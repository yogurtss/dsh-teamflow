export { parseLoopConfig } from './workflow-loop-config.ts';
import type { TeamState, TeamTask } from './types.ts';
import type { LoopConfig, WorkflowLoop, LoopHistoryRecord } from './workflow-loop-types.ts';
export type { LoopConfig, WorkflowLoop, LoopHistoryRecord } from './workflow-loop-types.ts';
export declare const pendingLoopHistory: (team: TeamState) => readonly LoopHistoryRecord[];
export declare const clearPendingLoopHistory: (team: TeamState) => void;
export declare const loopsOf: (team: TeamState) => WorkflowLoop[];
export declare const loopForTask: (team: TeamState, id: string) => WorkflowLoop | undefined;
export declare function loopInputFingerprint(team: TeamState, loop: WorkflowLoop): string;
/** The ordinary DAG is validated independently, including external paths. */
export declare function validateLoopGraph(team: TeamState): void;
export declare function configureLoop(team: TeamState, config: LoopConfig): WorkflowLoop;
export declare function loopCanExecute(team: TeamState, task: TeamTask): boolean;
export declare function loopDependenciesSatisfied(team: TeamState, task: TeamTask): boolean;
/** Called before every durable write and from the scheduler watchdog. Never creates tasks. */
export declare function reconcileLoops(team: TeamState, now?: number): boolean;
export declare function startLoop(team: TeamState, id: string, additionalRounds?: number, now?: number): void;
export declare function decideLoop(team: TeamState, id: string, input: {
    decisionId: string;
    runId: string;
    round: number;
    fingerprint: string;
    decision: 'pass' | 'revise' | 'blocked';
    note: string;
    taskIds: string[];
}, actor: string, now?: number): void;
export declare function pauseLoop(team: TeamState, id: string, cancel?: boolean, reason?: string): void;
export declare function loopPrompt(team: TeamState, task: TeamTask): string | undefined;
export declare function isWorkflowLoops(value: unknown): value is WorkflowLoop[];
