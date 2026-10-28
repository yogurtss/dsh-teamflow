import type { TeamTask } from './types.ts';
/** Legacy drafts have no intent flag; execution/stop evidence rules out a first start. */
export declare function awaitsFirstStart(task: TeamTask): boolean;
