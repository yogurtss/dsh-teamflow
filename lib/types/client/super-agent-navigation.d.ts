/** Session-scoped workbenches can visit the workspace supervisor and resume in place. */
export declare const superAgentEntry = "teamflow:super-agent-entry";
export declare const captainOpened = "teamflow:super-agent-captain-opened";
export interface SupervisorVisit {
    workspaceId?: string;
    sessionId: string;
    teamId: string;
    returnToWorkflow: () => void;
}
export declare let supervisorAvailable: boolean;
export declare function enableSupervisorVisits(): () => void;
export declare function visitSuperAgent(visit: SupervisorVisit): boolean;
