import type { TeamState } from './types.ts'
import { replacedTaskIds } from './replaced-tasks.ts'

export const defaultWatchKinds = ['review', 'proposal', 'block'] as const
export const watchKinds = [...defaultWatchKinds, 'progress'] as const
export type WatchKind = typeof watchKinds[number]
export interface WorkflowWatch { kinds: WatchKind[]; keep: boolean }
export interface WatchItem {
  id: string
  kind: WatchKind
  title: string
  taskId?: string
  round?: number
  discussion?: string
  proposalId?: string
  reason?: 'configuration' | 'rerun' | 'rejected' | 'loop-paused'
}
export interface WatchRow {
  conversationTitle?:string
  teamId: string; name: string; captainSessionId: string; complete: boolean
  watch?: WorkflowWatch
  items: WatchItem[]
  progress?: NodeChange[]
}

export interface NodeChange {
  id:string; taskId:string; title:string; at:number
  status:'started'|'completed'|'failed'|'cancelled'
  inputs:string[]
}
export interface WatchProgress { baseline:Record<string,string>; changes:NodeChange[] }

/** Capture transitions at the state writer so fast nodes are visible between Web polls. */
export function recordNodeChanges(team:TeamState):void {
  if(!team.superAgentWatch?.kinds.includes('progress')){
    delete team.watchProgress
    return
  }
  const previous=team.watchProgress
  const changes=previous?.changes.slice()??[]
  const baseline:Record<string,string>=Object.create(null)
  const tasks=new Map(team.tasks.map(task=>[task.id,task]))
  for(const task of team.tasks){
    const status=task.status==='claimed'||task.status==='in_progress'?'started':task.status
    const key=JSON.stringify([task.attempt??0,task.checkpoint?.round,status])
    baseline[task.id]=key
    if(!previous||previous.baseline[task.id]===key||status==='pending')continue
    const inputs=status==='started'?task.dependencies.flatMap(id=>{
      const parent=tasks.get(id)
      return parent?.status==='completed'?[parent.subject]:[]
    }):[]
    changes.push({id:crypto.randomUUID(),taskId:task.id,title:task.subject,status,inputs,at:Date.now()})
  }
  team.watchProgress={baseline,changes:changes.slice(-40)}
}

/** Match the workbench completion rule, including replacement paths and loop gates. */
export function workflowComplete(team: TeamState): boolean {
  if (!team.workflow || team.phase === 'staged') return false
  const replaced = replacedTaskIds(team.tasks, team.workflow)
  const tasks = team.tasks.filter(task => !replaced.has(task.id))
  const upstream = new Set(tasks.flatMap(task => task.dependencies))
  const ends = tasks.filter(task => !upstream.has(task.id))
  return ends.length > 0 && ends.every(task => task.status === 'completed' && (!task.checkpoint || task.checkpoint.decision === 'approve'))
    && !team.workflow.loops?.some(loop => loop.status !== 'passed' && tasks.some(task => task.id === loop.gateId))
}

export function validWatch(value: unknown): value is WorkflowWatch {
  if (!value || typeof value !== 'object') return false
  const watch = value as Partial<WorkflowWatch>
  return typeof watch.keep === 'boolean' && Array.isArray(watch.kinds) && watch.kinds.length <= watchKinds.length
    && watch.kinds.every(kind => watchKinds.includes(kind)) && new Set(watch.kinds).size === watch.kinds.length
}
