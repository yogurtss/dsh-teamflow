import { parentPort } from 'node:worker_threads'
import { auditTeamWorkspace } from './workspace-audit.ts'
import { readArtifactScope, readOutcomePreview } from './artifacts.ts'
import type { TeamState } from './types.ts'

parentPort?.on('message', ({ id, workspace, team, paths, previewPath, cache }: { id: number; workspace: string; team?: TeamState; paths?: string[]; previewPath?: string; cache?: boolean }) => {
  try {
    const result = previewPath !== undefined ? readOutcomePreview(workspace, previewPath) : paths ? readArtifactScope(workspace, paths, { cache }) : auditTeamWorkspace(workspace, team!)
    parentPort!.postMessage({ id, result })
  } catch (error) { parentPort!.postMessage({ id, error: String(error) }) }
})
