import type { TeamTask } from './types.ts';
import type { WorkflowState } from './workflow-types.ts';
export declare function replacedTaskIds(tasks: TeamTask[], workflow?: WorkflowState): Set<string>;
