import type { TeamState } from './types.ts';
import type { WorkflowLoop } from './workflow-loop-types.ts';
/** The existing wire field binds the submitted results for this round. */
export declare function loopArtifactEvidence(_workspace: string, team: TeamState, loop: WorkflowLoop): string;
