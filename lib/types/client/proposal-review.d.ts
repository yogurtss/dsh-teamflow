/** Readable field comparisons and line diffs for human workflow approval. */
import type { TeamState } from '../types.ts';
import type { WorkflowOperation } from '../workflow-types.ts';
export type ReviewField = {
    key: string;
    label: string;
    before: string;
    after: string;
    array: boolean;
    editable: boolean;
};
export declare function reviewFields(team: TeamState, operation: WorkflowOperation): {
    title: string;
    fields: ReviewField[];
};
export declare function setReviewField(operation: WorkflowOperation, field: ReviewField, value: string): WorkflowOperation;
export declare function reviewedOperations(team: TeamState, operations: WorkflowOperation[], included: boolean[]): WorkflowOperation[];
export type DiffLine = {
    kind: 'same' | 'removed' | 'added';
    text: string;
};
export declare function lineDiff(before: string, after: string): DiffLine[];
