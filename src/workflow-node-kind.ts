import type { Checkpoint } from './workflow-types.ts'

/** Resolve old loop checkpoints without rewriting persisted execution history. */
export function isGateTask(task: { id: string; checkpoint?: Pick<Checkpoint, 'kind'> }, loops: readonly { gateId: string }[] = []): boolean {
  return task.checkpoint?.kind === 'gate' || loops.some(loop => loop.gateId === task.id)
}
