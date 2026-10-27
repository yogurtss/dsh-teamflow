/** Transitive dependents that must wait for a person's rerun confirmation. */
import type { TeamTask } from './types.ts'
export function rerunImpact(tasks: readonly TeamTask[], id: string): { descendants: TeamTask[]; active: TeamTask[] } {
  const affected = new Set([id])
  let changed = true
  while (changed) { changed = false; for (const task of tasks) if (!affected.has(task.id) && task.dependencies.some(dep => affected.has(dep))) { affected.add(task.id); changed = true } }
  const descendants = tasks.filter(task => task.id !== id && affected.has(task.id))
  return {
    descendants,
    active: descendants.filter(task => ['claimed','in_progress'].includes(task.status) || task.reassigning),
  }
}
export function rerunnableTasks(tasks: readonly TeamTask[], memberName: string): TeamTask[] {
  return tasks.filter(task => !task.checkpoint && task.assignee === memberName && ['completed','failed','cancelled'].includes(task.status))
}
/** Keep the contract, identity and monotonic generation; invalidate old capabilities and evidence. */
export function resetTaskForRerun(task: TeamTask, suspended: boolean, now: number): void {
  task.status='pending'; task.workflowPaused=suspended; task.workflowRerunRequired=suspended; task.updatedAt=now
  for (const key of ['output','attemptId','handoffId','handoffFromMemberId','reassigning','verdict','findings','changedPaths','acceptanceResults','commandsRun','supplementalEvidence','reviewedAttempt','reviewedArtifacts','reviewedGaps','reviewedScope','reviewedDuringDrift','verdictStartSnapshot'] as const) delete task[key]
  if(task.checkpoint) task.checkpoint={round:task.checkpoint.round+1,history:task.checkpoint.history}
}
