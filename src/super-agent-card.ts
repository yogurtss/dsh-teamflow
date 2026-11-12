import type { WatchItem } from './super-agent-watch.ts'

export const cardRecord='plugin:teamflow/super-agent-card'
export interface SupervisorCard {
  key:string; workspaceId:string; project:string; teamId:string; workflow:string
  captain:string; item:WatchItem; summary:string; status:'open'|'approved'|'rejected'|'closed'
}
export interface CardEvent { card:SupervisorCard; revision:'start'|'update' }
declare module '@deepseek-ai/dsh-session/types' {
  interface PluginRecordMap { 'plugin:teamflow/super-agent-card':CardEvent }
}
export function readCard(event:{type:string;data:unknown}):CardEvent|undefined {
  if(event.type!==cardRecord)return
  const record=event.data as Partial<CardEvent>|null
  const c=record?.card
  if(c && typeof c.key==='string' && typeof c.captain==='string' && typeof c.workspaceId==='string' && typeof c.item?.title==='string' && (record.revision==='start'||record.revision==='update'))return record as CardEvent
}
