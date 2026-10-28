import type { TeamTask } from './types.ts'

/** Legacy drafts have no intent flag; execution/stop evidence rules out a first start. */
export function awaitsFirstStart(task: TeamTask): boolean {
  if (!task.workflowPaused || task.status !== 'pending' || task.workflowRerunRequired) return false
  return task.workflowAwaitingStart ?? (!(task.attempt ?? 0) && !task.attemptId && !task.handoffId && !task.stoppedAttempts?.length && !task.checkpoint)
}
