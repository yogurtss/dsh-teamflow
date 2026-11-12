/** Session-scoped workbenches can visit the workspace supervisor and resume in place. */
export const superAgentEntry = 'teamflow:super-agent-entry'
export const captainOpened = 'teamflow:super-agent-captain-opened'
export interface SupervisorVisit { workspaceId?:string; sessionId: string; teamId: string; returnToWorkflow: () => void }
export let supervisorAvailable = false
export function enableSupervisorVisits() { supervisorAvailable=true; return ()=>{supervisorAvailable=false} }
export function visitSuperAgent(visit: SupervisorVisit): boolean {
  return !window.dispatchEvent(new CustomEvent(superAgentEntry,{detail:visit,cancelable:true}))
}
