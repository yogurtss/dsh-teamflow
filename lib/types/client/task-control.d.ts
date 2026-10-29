import type { ActivityTask } from './activity-monitor.ts';
/** Playback grants scheduling permission; it never satisfies a dependency. */
export type ControlTask = Pick<ActivityTask, 'id' | 'status' | 'dependencies' | 'checkpoint' | 'workflowPaused' | 'workflowAwaitingStart' | 'workflowConfigPending' | 'workflowRerunRequired' | 'updatedAt'>;
export interface ControlTeam {
    tasks: readonly ControlTask[];
    phase?: string;
    halted?: boolean;
}
export declare function taskControlState(team: ControlTeam, task: ControlTask, historic?: boolean): {
    disabled: boolean;
    checked: boolean;
    label: "task.control.paused" | "task.control.awaitingStart" | "task.control.waiting" | "task.control.blocked" | "task.control.queued" | "task.control.staged" | "task.control.stopped" | "task.control.rerunRequired" | "task.control.rerunWaiting" | "task.control.reviewRequired" | "task.control.stopping" | "task.status.reviewPassed" | "task.status.configurationPending" | "task.status.reviewRejected" | "task.status.reviewReady" | "task.status.claimed" | "task.status.inProgress" | "task.status.completed" | "task.status.failed" | "task.status.cancelled";
    waiting: string[];
    reviewReady: boolean;
    stopping: boolean;
    terminal: boolean;
    canRerun: boolean;
    active: boolean;
    queued: boolean;
    actionLabel: "task.control.start" | "task.control.pause" | "task.control.dequeue" | "task.control.retryStop";
    visual: string;
};
/** Optimistic concurrency token shared by the canvas, activity view and route. */
export declare function flowControlVersion(team: ControlTeam): string;
export declare function flowControlState(team: ControlTeam): {
    canStart: boolean;
    canPause: boolean;
};
