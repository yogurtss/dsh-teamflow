/** Resolve old loop checkpoints without rewriting persisted execution history. */
export function isGateTask(task, loops = []) {
    return task.checkpoint?.kind === 'gate' || loops.some(loop => loop.gateId === task.id);
}
