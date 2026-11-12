import type { TeamState } from './types.ts'
import { replacedTaskIds } from './replaced-tasks.ts'

export const watchKinds = ['review', 'proposal', 'block'] as const
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
  teamId: string; name: string; captainSessionId: string; complete: boolean
  watch?: WorkflowWatch
  items: WatchItem[]
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
