/** Transitive dependents that must wait for a person's rerun confirmation. */
import type { TeamTask } from './types.ts';
export declare function rerunImpact(tasks: readonly TeamTask[], id: string): {
    descendants: TeamTask[];
    active: TeamTask[];
};
export declare function rerunnableTasks(tasks: readonly TeamTask[], memberName: string): TeamTask[];
/** Keep the contract, identity and monotonic generation; invalidate old capabilities and evidence. */
export declare function resetTaskForRerun(task: TeamTask, suspended: boolean, now: number): void;
import type { TeamState } from './types.ts';
/** Ancestors before consumers; only rerun-invalidated nodes are released by this action. */
export declare function rerunPath(tasks: readonly TeamTask[], targetId: string): TeamTask[];
/** Validate the entire plan before mutating it; normal scheduling and human gates remain authoritative. */
export declare function resumeRerunPath(team: TeamState, targetId: string, now?: number): string[];
