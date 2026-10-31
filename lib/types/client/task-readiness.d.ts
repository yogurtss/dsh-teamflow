import { type WorkflowText } from './workflow-text.ts';
import type { TeamState, TeamTask } from '../types.ts';
export interface TaskReadiness {
    label: string;
    detail: string;
    dependencies: string[];
}
/** Explain saved execution state without claiming to know live host availability. */
export declare function taskReadiness(team: TeamState, task: TeamTask, l?: WorkflowText): TaskReadiness;
