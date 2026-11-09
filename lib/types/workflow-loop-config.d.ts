import type { LoopConfig } from './workflow-loop-types.ts';
import type { WorkflowLoop } from './workflow-loop-types.ts';
export declare function parseLoopConfig(raw: unknown): LoopConfig;
import type { TeamState } from './types.ts';
export declare function deriveLoop(team: TeamState, config: LoopConfig, id: string, runId: string): WorkflowLoop;
export declare function validateLoopGraph(team: TeamState): void;
