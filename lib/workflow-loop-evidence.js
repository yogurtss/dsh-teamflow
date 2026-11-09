import { createHash } from 'node:crypto';
import { Worker } from 'node:worker_threads';
/** Only on opening/dispatching/submitting review, never on activity polling. */
export async function loopArtifactEvidence(workspace, team, loop) {
    const paths = [...new Set(team.tasks.filter(t => loop.bodyIds.includes(t.id)).flatMap(t => [...t.changedPaths ?? [], ...t.deliverables ?? []]))];
    if (!paths.length)
        return createHash('sha256').update(JSON.stringify({ artifacts: [], gaps: [] })).digest('hex');
    // File hashing must not monopolize the host event loop or freeze state polling.
    return new Promise((resolve, reject) => {
        const worker = new Worker(new URL('./workflow-loop-evidence-worker.js', import.meta.url), { workerData: { workspace, paths } });
        const timer = setTimeout(() => { void worker.terminate(); reject(new Error('审核文件读取超时，请缩小材料范围后重试')); }, 30000);
        worker.once('message', (result) => { clearTimeout(timer); if (result.evidence)
            resolve(result.evidence);
        else
            reject(new Error(result.error ?? '审核材料读取失败')); });
        worker.once('error', error => { clearTimeout(timer); reject(error); });
        worker.once('exit', () => { clearTimeout(timer); reject(new Error('审核材料读取进程已停止')); });
    });
}
