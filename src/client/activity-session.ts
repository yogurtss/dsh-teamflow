/** Resolve only server-bound TeamFlow discussion sessions to their owning captain. */
import type { ActivityTeam } from './activity-monitor.ts'
export interface ActivitySessionOwner { sessionId:string; owner:string; activity?:ActivityTeam }
export async function resolveActivitySession(sessionId:string, signal?:AbortSignal, fetchState:typeof fetch=fetch):Promise<ActivitySessionOwner> {
  const fallback={sessionId,owner:sessionId}
  if(!sessionId.startsWith('session-at-discussion-'))return fallback
  const response=await fetchState('/plugins/dsh-agent-teams/workflow',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({sessionId,action:'state'}),signal})
  if(!response.ok)return fallback
  const value=await response.json() as {currentDiscussion?:string;team?:{captainSessionId?:string};activity?:ActivityTeam}
  const owner=value.team?.captainSessionId
  if(!value.currentDiscussion || typeof owner!=='string' || !owner)return fallback
  return {sessionId,owner,...value.activity?.captainSessionId===owner?{activity:value.activity}:{}}
}
