import type { TeamState } from './types.ts';
export declare const defaultWatchKinds: readonly ["review", "proposal", "block"];
export declare const watchKinds: readonly ["review", "proposal", "block", "progress"];
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
    conversationTitle?: string;
    teamId: string;
    name: string;
    captainSessionId: string;
    complete: boolean;
    watch?: WorkflowWatch;
    items: WatchItem[];
    progress?: NodeChange[];
}
export interface NodeChange {
    id: string;
    taskId: string;
    title: string;
    at: number;
    status: 'started' | 'completed' | 'failed' | 'cancelled';
    inputs: string[];
}
export interface WatchProgress {
    baseline: Record<string, string>;
    changes: NodeChange[];
}
/** Capture transitions at the state writer so fast nodes are visible between Web polls. */
export declare function recordNodeChanges(team: TeamState): void;
/** Match the workbench completion rule, including replacement paths and loop gates. */
export declare function workflowComplete(team: TeamState): boolean;
export declare function validWatch(value: unknown): value is WorkflowWatch;
