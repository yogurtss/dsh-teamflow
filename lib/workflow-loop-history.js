/** Immutable history first, revision-checked manifest last. No overwrite fallback. */
import { mkdir, open, readFile, rename, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { clearPendingLoopHistory, loopsOf, pendingLoopHistory } from "./workflow-loops.js";
export async function previousReview(root, teamId, loop) {
    if (loop.round < 2)
        return;
    let id = loop.historyHead;
    const seen = new Set();
    while (id) {
        if (seen.has(id))
            throw new Error('历史记录链损坏');
        seen.add(id);
        const record = await readHistoryRecord(root, teamId, id);
        if (record.loopId !== loop.id || record.runId !== loop.runId)
            throw new Error('历史记录不属于当前循环运行');
        if (record.round < loop.round - 1)
            return;
        if (record.round === loop.round - 1 && record.kind === 'decision' && record.decision === 'revise')
            return record;
        id = record.previous;
    }
}
const recordId = (id) => /^[a-f0-9-]{36}$/u.test(id);
async function writeSynced(path, text) {
    const handle = await open(path, 'wx');
    try {
        await handle.writeFile(text, 'utf8');
        await handle.sync();
    }
    finally {
        await handle.close();
    }
}
export async function writeLoopTeam(root, team) {
    const dir = join(root, team.id), lock = join(dir, '.loop-write.lock'), history = join(dir, 'loop-history');
    await mkdir(history, { recursive: true });
    let lease;
    try {
        lease = await open(lock, 'wx');
    }
    catch (error) {
        if (error.code !== 'EEXIST')
            throw error;
        const owner = Number(await readFile(lock, 'utf8'));
        if (!Number.isSafeInteger(owner) || owner <= 0)
            throw new Error('循环写入锁不完整，请停止宿主后检查锁文件');
        try {
            process.kill(owner, 0);
            throw new Error('另一个循环写入者正在保存，请重试');
        }
        catch (check) {
            if (check.code !== 'ESRCH')
                throw check;
        }
        const recoveryPath = join(dir, '.loop-recovery.lock');
        const recovery = await open(recoveryPath, 'wx');
        try {
            // Serialize stale-lock recovery and recheck after obtaining that lease.
            const currentOwner = Number(await readFile(lock, 'utf8'));
            if (currentOwner !== owner)
                throw new Error('循环写入锁已变化，请重试');
            try {
                process.kill(currentOwner, 0);
                throw new Error('循环写入者仍然存在');
            }
            catch (check) {
                if (check.code !== 'ESRCH')
                    throw check;
            }
            await rm(lock);
            lease = await open(lock, 'wx');
        }
        finally {
            await recovery.close();
            await rm(recoveryPath, { force: true });
        }
    }
    const temp = join(dir, `.loop-state-${randomUUID()}.tmp`);
    try {
        await lease.writeFile(String(process.pid));
        let current = 0;
        try {
            current = JSON.parse(await readFile(join(dir, 'team.json'), 'utf8')).workflow?.loopRevision ?? 0;
        }
        catch (error) {
            if (error.code !== 'ENOENT')
                throw error;
        }
        if (current !== (team.workflow?.loopRevision ?? 0))
            throw new Error('循环状态已被其他写入者更新，请重新加载');
        for (const record of pendingLoopHistory(team)) {
            const path = join(history, `${record.id}.json`), text = JSON.stringify(record);
            try {
                await writeSynced(path, text);
            }
            catch (error) {
                if (error.code !== 'EEXIST' || await readFile(path, 'utf8') !== text)
                    throw error;
            }
        }
        // Check referenced heads before publishing a state that could schedule work.
        for (const loop of loopsOf(team))
            if (loop.historyHead) {
                if (!recordId(loop.historyHead) || !(await stat(join(history, `${loop.historyHead}.json`))).isFile())
                    throw new Error('循环历史引用不匹配');
            }
        const next = { ...team, workflow: { ...team.workflow, loopRevision: current + 1 } };
        await writeSynced(temp, JSON.stringify(next, null, 2));
        for (let attempt = 0;; attempt++) {
            try {
                await rename(temp, join(dir, 'team.json'));
                break;
            }
            catch (error) {
                if (attempt >= 4 || !['EPERM', 'EBUSY', 'EACCES'].includes(error.code ?? ''))
                    throw error;
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }
        team.workflow.loopRevision = current + 1;
        clearPendingLoopHistory(team);
    }
    finally {
        await lease.close();
        await rm(lock, { force: true });
        await rm(temp, { force: true }).catch(() => undefined);
    }
}
export async function readHistoryRecord(root, teamId, id) {
    if (!recordId(id))
        throw new Error('历史记录标识无效');
    const record = JSON.parse(await readFile(join(root, teamId, 'loop-history', `${id}.json`), 'utf8'));
    if (record.id !== id || typeof record.loopId !== 'string' || typeof record.runId !== 'string' || !Number.isSafeInteger(record.round) || record.round < 1
        || typeof record.summary !== 'string' || !Number.isFinite(record.at) || !Array.isArray(record.tasks)
        || !record.tasks.every(t => !!t && typeof t.id === 'string' && typeof t.subject === 'string' && ['pending', 'claimed', 'in_progress', 'completed', 'failed', 'cancelled'].includes(t.status) && (t.output === undefined || typeof t.output === 'string'))
        || (record.members !== undefined && (!Array.isArray(record.members) || !record.members.every(m => !!m && typeof m.name === 'string' && ['id', 'provider', 'model', 'reasoningEffort', 'activeProvider', 'activeModel'].every(key => m[key] === undefined || typeof m[key] === 'string'))))
        || (record.executionRounds !== undefined && (!record.executionRounds || typeof record.executionRounds !== 'object' || Array.isArray(record.executionRounds) || !Object.values(record.executionRounds).every(n => Number.isSafeInteger(n) && n > 0 && n <= record.round)))
        || !['execution', 'decision', 'control'].includes(record.kind) || (record.previous && !recordId(record.previous)))
        throw new Error('循环历史记录损坏');
    return record;
}
export async function readLoopHistory(root, team, loopId, cursor) {
    const loop = loopsOf(team).find(l => l.id === loopId);
    if (!loop)
        throw new Error('循环不存在');
    let next = cursor ?? loop.historyHead;
    const records = [], seen = new Set();
    while (next && records.length < 5) {
        if (seen.has(next))
            throw new Error('历史记录链损坏');
        seen.add(next);
        const record = await readHistoryRecord(root, team.id, next);
        if (record.loopId !== loop.id || record.runId !== loop.runId)
            throw new Error('历史记录不属于当前循环运行');
        records.push(record);
        next = record.previous;
    }
    return { records, next };
}
