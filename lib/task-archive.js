import { createHash, randomUUID } from 'node:crypto';
import { open, rm } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join } from 'node:path';
import { Worker } from 'node:worker_threads';
import { readTeam, withTeamLock, writeTeam } from "./state.js";
import { checkpointInputs } from "./workflow.js";
import { taskNeedsConfiguration } from "./task-description.js";
import { MAX_ARCHIVE_MANIFEST_BYTES, parseTaskArchive } from "./task-archive-config.js";
const running = new Map();
const workers = new Map();
const keyOf = (root, team) => join(root, team);
function inputs(team, task) {
    const tasks = checkpointInputs(team, task);
    const ids = new Set(tasks.map(t => t.id));
    return { tasks, loops: (team.workflow?.loops ?? []).filter(l => ids.has(l.gateId)).map(l => ({ id: l.id, runId: l.runId, round: l.round, status: l.status, historyHead: l.historyHead, historyCount: l.historyCount })), config: parseTaskArchive(task.archive) };
}
const fingerprint = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const eligible = (team, task) => !team.halted && team.phase !== 'staged' && task.kind === 'archive' && !task.workflowPaused && !task.workflowRerunRequired && !taskNeedsConfiguration(task) && !task.reassigning && task.dependencies.every(id => team.tasks.some(t => t.id === id && t.status === 'completed'));
/** A worker owns file I/O; the host lock owns only claims and guarded state commits. */
export async function runTaskArchives(root, workspace, teamId) {
    const key = keyOf(root, teamId);
    if (running.has(key))
        return running.get(key);
    const work = (async () => {
        for (;;) {
            const claim = await withTeamLock(`team:${root}:${teamId}`, async () => {
                const team = await readTeam(root, teamId);
                if (!team)
                    return;
                const task = team.tasks.find(t => eligible(team, t) && ['pending', 'in_progress'].includes(t.status));
                if (!task)
                    return;
                const source = inputs(team, task), id = randomUUID(), createdAt = Date.now();
                task.status = 'in_progress';
                task.attempt = (task.attempt ?? 0) + 1;
                task.attemptId = id;
                task.updatedAt = createdAt;
                await writeTeam(root, team);
                return { taskId: task.id, subject: task.subject, id, createdAt, source, sourceFingerprint: fingerprint(source) };
            });
            if (!claim)
                return;
            let record, failure;
            try {
                record = await new Promise((resolve, reject) => {
                    const worker = new Worker(new URL('./task-archive-worker.js', import.meta.url), { workerData: { root, workspace, teamId, ...claim } });
                    workers.set(key, { worker, taskId: claim.taskId });
                    const timer = setTimeout(() => { void worker.terminate(); reject(new Error('归档超时，请缩小文件范围后重试')); }, 30000);
                    worker.once('message', (result) => { clearTimeout(timer); result.record ? resolve(result.record) : reject(new Error(result.error ?? '归档失败')); });
                    worker.once('error', error => { clearTimeout(timer); reject(error); });
                    worker.once('exit', () => { clearTimeout(timer); reject(new Error('归档已中断')); });
                });
            }
            catch (error) {
                failure = error instanceof Error ? error.message : String(error);
            }
            finally {
                await workers.get(key)?.worker.terminate();
                workers.delete(key);
            }
            let published = false;
            await withTeamLock(`team:${root}:${teamId}`, async () => {
                const team = await readTeam(root, teamId), task = team?.tasks.find(t => t.id === claim.taskId);
                // Stop, rerun, dependency changes and cold recovery revoke the old attempt.
                if (!team || !task || task.attemptId !== claim.id || task.status !== 'in_progress')
                    return;
                if (!eligible(team, task)) {
                    task.status = 'pending';
                    task.updatedAt = Date.now();
                    delete task.attemptId;
                    await writeTeam(root, team);
                    return;
                }
                if (fingerprint(inputs(team, task)) !== claim.sourceFingerprint)
                    failure = '归档期间上游记录已变化，请检查后重新归档';
                task.status = failure ? 'failed' : 'completed';
                task.updatedAt = Date.now();
                if (!failure && record) {
                    (task.archiveRecords ??= []).push(record);
                    task.output = `成果归档已生成：${record.manifestPath}\n文件引用 ${record.fileCount} 项，复制 ${record.copiedCount} 项。`;
                }
                else
                    task.output = failure ?? '归档未生成';
                await writeTeam(root, team);
                published = !failure && !!record;
            });
            // Only successful state-linked manifests are retained. Interrupted copies
            // are private temporary artifacts, never a second execution history.
            if (!published)
                for (const suffix of ['', '.partial'])
                    await rm(join(root, teamId, 'artifacts', claim.id + suffix), { recursive: true, force: true });
        }
    })();
    running.set(key, work);
    try {
        await work;
    }
    finally {
        if (running.get(key) === work)
            running.delete(key);
    }
}
export async function cancelTaskArchive(root, teamId, taskId) { const current = workers.get(keyOf(root, teamId)); if (current && (!taskId || taskId === current.taskId))
    await current.worker.terminate(); }
export function archiveRunning(root, teamId) { return running.has(keyOf(root, teamId)); }
/** Only records linked from authorized team state can be loaded, never a caller-supplied path. */
export async function readTaskArchive(root, team, taskId, id) {
    const record = team.tasks.find(t => t.id === taskId)?.archiveRecords?.find(r => r.id === id);
    if (!record)
        throw new Error('归档记录不存在');
    const handle = await open(join(root, team.id, 'artifacts', record.id, 'manifest.json'), constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0) | (constants.O_NONBLOCK ?? 0));
    let raw;
    try {
        const before = await handle.stat();
        if (!before.isFile() || before.size > MAX_ARCHIVE_MANIFEST_BYTES)
            throw new Error('归档清单不是普通文件或超过 20 MiB');
        // Read at most the initial size plus one byte; growth cannot trigger an unbounded readFile.
        const buffer = Buffer.alloc(before.size + 1);
        let bytes = 0;
        while (bytes < buffer.length) {
            const result = await handle.read(buffer, bytes, buffer.length - bytes, null);
            if (!result.bytesRead)
                break;
            bytes += result.bytesRead;
        }
        const after = await handle.stat();
        if (bytes !== before.size || after.size !== before.size || after.mtimeMs !== before.mtimeMs || after.ctimeMs !== before.ctimeMs)
            throw new Error('归档清单读取期间发生变化');
        raw = buffer.subarray(0, bytes).toString('utf8');
    }
    finally {
        await handle.close();
    }
    if (fingerprintText(raw) !== record.sha256)
        throw new Error('归档清单校验失败');
    return JSON.parse(raw);
}
function fingerprintText(raw) { return createHash('sha256').update(raw).digest('hex'); }
