import { parentPort } from 'node:worker_threads'
import { auditTeamWorkspace } from './workspace-audit.ts'
import { readArtifactScope } from './artifacts.ts'
import type { TeamState } from './types.ts'

parentPort?.on('message', ({ id, workspace, team, paths, cache }: { id: number; workspace: string; team?: TeamState; paths?: string[]; cache?: boolean }) => {
  try {
    const result = paths ? readArtifactScope(workspace, paths, { cache }) : auditTeamWorkspace(workspace, team!)
    parentPort!.postMessage({ id, result })
  } catch (error) { parentPort!.postMessage({ id, error: String(error) }) }
})
