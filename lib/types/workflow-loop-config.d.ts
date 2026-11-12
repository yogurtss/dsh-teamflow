import type { LoopConfig } from './workflow-loop-types.ts';
import type { WorkflowLoop } from './workflow-loop-types.ts';
export declare function parseLoopConfig(raw: unknown): LoopConfig;
import type { TeamState, TeamTask } from './types.ts';
export declare function upstreamIds(tasks: readonly TeamTask[], gateId: string): Set<string>;
export declare function deriveLoop(team: TeamState, config: LoopConfig, id: string, runId: string): WorkflowLoop;
export declare function reviewerConflicts(team: TeamState, bodyIds: string[], reviewer: string): TeamTask[];
/** Apply the draft PASS edges to a new task list for both preview and save. */
export declare function gateRouteTasks(team: TeamState, gateId: string, passTargets: unknown, started: boolean): TeamTask[];
export declare function previewGate(team: TeamState, config: LoopConfig, passTargets: string[]): {
    bodyIds: string[];
    error: string;
};
export declare function validateLoopGraph(team: TeamState): void;
