/** Workflow completion is separate from archiving and human approval. */
import type { TeamState } from './types.ts';
export declare function assertWorkflowArchivable(team: TeamState): void;
/** Restore a reviewable copy; retain the archive and all finished results. */
export declare function prepareArchivedWorkflow(archived: TeamState): TeamState;
