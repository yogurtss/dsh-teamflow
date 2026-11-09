import type { TeamState, ArtifactDigest } from './types.ts';
import type { WorkflowLoop } from './workflow-loop-types.ts';
/** Only on opening/dispatching/submitting review, never on activity polling. */
export declare function loopArtifactEvidence(workspace: string, team: TeamState, loop: WorkflowLoop): Promise<string>;
export declare function loopArtifactMaterials(workspace: string, team: TeamState, loop: WorkflowLoop): Promise<{
    evidence: string;
    files: ArtifactDigest[];
}>;
