import type { ActivityTask, ActivityTeam } from './activity-monitor.ts';
/** The switch grants scheduling permission; it never satisfies a dependency. */
export declare function taskControlState(team: Pick<ActivityTeam, 'tasks' | 'phase' | 'halted'>, task: ActivityTask, historic?: boolean): {
    disabled: boolean;
    checked: boolean;
    label: "task.control.paused" | "task.control.waiting" | "task.control.queued" | "task.control.staged" | "task.control.stopped" | "task.control.rerunRequired" | "task.control.stopping" | "task.status.reviewPassed" | "task.status.configurationPending" | "task.status.reviewRejected" | "task.status.reviewReady" | "task.status.claimed" | "task.status.inProgress" | "task.status.completed" | "task.status.failed" | "task.status.cancelled";
    waiting: string[];
    reviewReady: boolean;
    stopping: boolean;
    terminal: boolean;
    canRerun: boolean;
};
