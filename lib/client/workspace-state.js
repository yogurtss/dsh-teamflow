/** Plugin-instance state shared by the monitor and any number of native tabs. */
export function createWorkspaceState() {
    let snapshot = { statuses: new Map(), selected: new Map() };
    const listeners = new Set();
    const publish = (next) => {
        snapshot = next;
        for (const listener of listeners)
            listener();
    };
    return {
        getSnapshot: () => snapshot,
        subscribe: (listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
        status(session, status) {
            if (snapshot.statuses.get(session) === status)
                return;
            publish({ ...snapshot, statuses: new Map(snapshot.statuses).set(session, status) });
        },
        select(session, team) {
            if (snapshot.selected.get(session) === team)
                return;
            publish({ ...snapshot, selected: new Map(snapshot.selected).set(session, team) });
        },
    };
}
