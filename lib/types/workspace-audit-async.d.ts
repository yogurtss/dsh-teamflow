import type { TeamState } from './types.ts';
import type { DeliveryAudit } from './quality-gates.ts';
import type { ArtifactScopeRead } from './artifacts.ts';
export declare const WORKSPACE_AUDIT_TIMEOUT_MS = 3000;
export declare function createWorkspaceAuditor(options?: {
    timeoutMs?: number;
}): {
    audit(workspace: string, team: TeamState): Promise<DeliveryAudit>;
    readScope(workspace: string, paths: readonly string[], cache?: boolean): Promise<ArtifactScopeRead>;
    dispose(): Promise<void>;
};
