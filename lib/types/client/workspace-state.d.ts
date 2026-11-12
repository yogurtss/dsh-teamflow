/** Plugin-instance state shared by the monitor and any number of native tabs. */
export type ConnectionStatus = 'loading' | 'ready' | 'error';
export interface WorkspaceSnapshot {
    readonly statuses: ReadonlyMap<string, ConnectionStatus>;
    readonly selected: ReadonlyMap<string, string>;
}
export declare function createWorkspaceState(): {
    getSnapshot: () => WorkspaceSnapshot;
    subscribe: (listener: () => void) => () => void;
    status(session: string, status: ConnectionStatus): void;
    select(session: string, team: string): void;
};
export type WorkspaceActivityState = ReturnType<typeof createWorkspaceState>;
