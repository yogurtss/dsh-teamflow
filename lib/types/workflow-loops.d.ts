export { parseLoopConfig } from './workflow-loop-config.ts';
import type { TeamState, TeamTask } from './types.ts';
import type { LoopConfig, WorkflowLoop, LoopHistoryRecord } from './workflow-loop-types.ts';
export type { LoopConfig, WorkflowLoop, LoopHistoryRecord } from './workflow-loop-types.ts';
export declare const loopRetryInstructions = "\u6309\u539F\u4EFB\u52A1\u8981\u6C42\u91CD\u8BD5\u672C\u8F6E\uFF0C\u4FDD\u7559\u5148\u524D\u7684\u6267\u884C\u8BB0\u5F55\u3002";
export declare const pendingLoopHistory: (team: TeamState) => readonly LoopHistoryRecord[];
export declare const clearPendingLoopHistory: (team: TeamState) => void;
export declare const loopsOf: (team: TeamState) => WorkflowLoop[];
export declare const loopForTask: (team: TeamState, id: string) => WorkflowLoop | undefined;
export declare const loopTaskContract: (task: TeamTask) => string;
export declare function loopInputFingerprint(team: TeamState, loop: WorkflowLoop): string;
/** The ordinary DAG is validated independently, including external paths. */
export declare function validateLoopGraph(team: TeamState): void;
export declare function configureLoop(team: TeamState, config: LoopConfig): WorkflowLoop;
/** Validate edits to both branches before applying either one. */
export declare function saveGateSettings(team: TeamState, config: LoopConfig, passTargets: unknown, loopId?: unknown): void;
export declare function loopCanExecute(team: TeamState, task: TeamTask): boolean;
export declare function loopDependenciesSatisfied(team: TeamState, task: TeamTask): boolean;
/** Called before every durable write and from the scheduler watchdog. Never creates tasks. */
export declare function reconcileLoops(team: TeamState, now?: number, failedTurnId?: string): boolean;
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
