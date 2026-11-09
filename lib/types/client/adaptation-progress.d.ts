import type { WorkflowProposal } from '../workflow-types.ts';
export type AdaptationPhase = 'idle' | 'connecting' | 'generating' | 'ready' | 'stale' | 'attention' | 'applied' | 'error' | 'disconnected';
/** Use observed host state; an idle AI without a proposal is not a successful adaptation. */
export declare function adaptationPhase(input: {
    opening: boolean;
    busy: boolean;
    disconnected: boolean;
    error: boolean;
    hasSession: boolean;
    proposal?: WorkflowProposal;
    base?: string;
}): AdaptationPhase;
export declare const adaptationLabels: Record<AdaptationPhase, {
    button: string;
    detail: string;
}>;
export declare const adaptationConflicts: Set<string>;
