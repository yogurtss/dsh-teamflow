/** Session-scoped workbenches can visit the workspace supervisor and resume in place. */
export const superAgentEntry = 'teamflow:super-agent-entry';
export let supervisorAvailable = false;
export function enableSupervisorVisits() { supervisorAvailable = true; return () => { supervisorAvailable = false; }; }
export function visitSuperAgent(visit) {
    return !window.dispatchEvent(new CustomEvent(superAgentEntry, { detail: visit, cancelable: true }));
}
