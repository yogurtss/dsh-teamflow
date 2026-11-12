import type { TeamState } from './types.ts';
export declare const watchKinds: readonly ["review", "proposal", "block"];
export type WatchKind = typeof watchKinds[number];
export interface WorkflowWatch {
    kinds: WatchKind[];
    keep: boolean;
}
export interface WatchItem {
    id: string;
    kind: WatchKind;
    title: string;
    taskId?: string;
    round?: number;
    discussion?: string;
    proposalId?: string;
    reason?: 'configuration' | 'rerun' | 'rejected' | 'loop-paused';
}
export interface WatchRow {
    teamId: string;
    name: string;
    captainSessionId: string;
    complete: boolean;
    watch?: WorkflowWatch;
    items: WatchItem[];
}
/** Match the workbench completion rule, including replacement paths and loop gates. */
export declare function workflowComplete(team: TeamState): boolean;
export declare function validWatch(value: unknown): value is WorkflowWatch;
