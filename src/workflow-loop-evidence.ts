import type { TeamState } from './types.ts'
import type { WorkflowLoop } from './workflow-loop-types.ts'
import { resultDigest } from './review-results.ts'

/** The existing wire field binds the submitted results for this round. */
export function loopArtifactEvidence(_workspace: string, team: TeamState, loop: WorkflowLoop): string {
  return resultDigest(team.tasks.filter(task => loop.bodyIds.includes(task.id)))
}
