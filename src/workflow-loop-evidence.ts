import { createHash } from 'node:crypto'
import { Worker } from 'node:worker_threads'
import type { TeamState, ArtifactDigest } from './types.ts'
import type { WorkflowLoop } from './workflow-loop-types.ts'

/** Only on opening/dispatching/submitting review, never on activity polling. */
export async function loopArtifactEvidence(workspace: string, team: TeamState, loop: WorkflowLoop): Promise<string> {
  return (await loopArtifactMaterials(workspace, team, loop)).evidence
}

export async function loopArtifactMaterials(workspace: string, team: TeamState, loop: WorkflowLoop): Promise<{ evidence: string; files: ArtifactDigest[] }> {
  const paths = [...new Set(team.tasks.filter(t => loop.bodyIds.includes(t.id)).flatMap(t => [...t.changedPaths ?? [], ...t.deliverables ?? []]))]
  if (!paths.length) return { evidence: createHash('sha256').update(JSON.stringify({ artifacts: [], gaps: [] })).digest('hex'), files: [] }
  // File hashing must not monopolize the host event loop or freeze state polling.
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./workflow-loop-evidence-worker.js', import.meta.url), { workerData: { workspace, paths } })
    const timer = setTimeout(() => { void worker.terminate(); reject(new Error('审核文件读取超时，请缩小材料范围后重试')) }, 30000)
    worker.once('message', (result: { evidence?: string; files?: ArtifactDigest[]; error?: string }) => { clearTimeout(timer); if (result.evidence && result.files) resolve({ evidence: result.evidence, files: result.files }); else reject(new Error(result.error ?? '审核材料读取失败')) })
    worker.once('error', error => { clearTimeout(timer); reject(error) })
    worker.once('exit', () => { clearTimeout(timer); reject(new Error('审核材料读取进程已停止')) })
  })
}
