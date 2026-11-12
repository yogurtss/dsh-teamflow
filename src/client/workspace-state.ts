/** Plugin-instance state shared by the monitor and any number of native tabs. */

export type ConnectionStatus = 'loading' | 'ready' | 'error'
export interface WorkspaceSnapshot {
  readonly statuses: ReadonlyMap<string, ConnectionStatus>
  readonly selected: ReadonlyMap<string, string>
}

export function createWorkspaceState() {
  let snapshot: WorkspaceSnapshot = { statuses: new Map(), selected: new Map() }
  const listeners = new Set<() => void>()
  const publish = (next: WorkspaceSnapshot): void => {
    snapshot = next
    for (const listener of listeners) listener()
  }
  return {
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } },
    status(session: string, status: ConnectionStatus) {
      if (snapshot.statuses.get(session) === status) return
      publish({ ...snapshot, statuses: new Map(snapshot.statuses).set(session, status) })
    },
    select(session: string, team: string) {
      if (snapshot.selected.get(session) === team) return
      publish({ ...snapshot, selected: new Map(snapshot.selected).set(session, team) })
    },
  }
}
export type WorkspaceActivityState = ReturnType<typeof createWorkspaceState>
