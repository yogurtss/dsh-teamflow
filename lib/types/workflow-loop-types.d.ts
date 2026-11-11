import type { TeamTask, TeamMember } from './types.ts';
export interface LoopConfig {
    gateId: string;
    entryId: string;
    mode: 'human' | 'ai';
    reviewer?: string;
    rejectToEntry?: boolean;
    maxRounds: number;
    timeoutMinutes: number;
}
export interface WorkflowLoop extends LoopConfig {
    id: string;
    bodyIds: string[];
    runId: string;
    round: number;
    status: 'ready' | 'running' | 'reviewing' | 'paused' | 'passed' | 'cancelled';
    reason?: string;
    feedback?: string;
    requestedTaskIds?: string[];
    startedAt?: number;
    reviewStartedAt?: number;
    historyHead?: string;
    historyCount: number;
    captured: Record<string, string>;
    externalInputs: Record<string, string>;
    lastDecisionId?: string;
    lastDecision?: 'pass' | 'revise' | 'blocked';
    previousOutputs?: Record<string, string>;
    reviewArtifactEvidence?: string;
    queued?: boolean;
    contracts?: Record<string, string>;
    executionRounds?: Record<string, number>;
}
export interface LoopHistoryRecord {
    id: string;
    previous?: string;
    loopId: string;
    runId: string;
    round: number;
    at: number;
    kind: 'execution' | 'decision' | 'control';
    summary: string;
    decision?: 'pass' | 'revise' | 'blocked';
    actor?: string;
    tasks: TeamTask[];
    inputFingerprint: string;
    artifactEvidence?: string;
    members?: Pick<TeamMember, 'id' | 'name' | 'provider' | 'model' | 'reasoningEffort' | 'activeProvider' | 'activeModel'>[];
    executionRounds?: Record<string, number>;
}
