/** Transitive dependents that must wait for a person's rerun confirmation. */
import type { TeamTask } from './types.ts';
export declare function rerunImpact(tasks: readonly TeamTask[], id: string): {
    descendants: TeamTask[];
    active: TeamTask[];
};
export declare function rerunnableTasks(tasks: readonly TeamTask[], memberName: string): TeamTask[];
/** Keep the contract, identity and monotonic generation; invalidate old capabilities and evidence. */
export declare function resetTaskForRerun(task: TeamTask, suspended: boolean, now: number): void;
