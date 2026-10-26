import type { TeamState } from '../types.ts';
import type { WorkflowOperation } from '../workflow-types.ts';
export declare function draftTaskId(team: TeamState): string;
/** One atomic proposal inserts a node and reconnects the explicitly chosen successors. */
export declare function taskDraftOperations(team: TeamState, input: {
    id?: string;
    checkpoint: boolean;
    subject: string;
    description?: string;
    assignee?: string;
    dependencies: string[];
    successors: string[];
}): WorkflowOperation[];
