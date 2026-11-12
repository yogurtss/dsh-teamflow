export function canChangeGateReview(loop, gate) {
    return ['ready', 'running', 'paused'].includes(loop.status) && gate.status === 'pending'
        && !gate.reassigning && !gate.checkpoint?.decision;
}
export function canToggleLoopTask(loop, taskId) {
    return taskId !== loop.gateId && (loop.status === 'ready' || loop.status === 'running' || loop.status === 'paused' && loop.lastDecision !== 'revise');
}
export function canRetryLoopTask(loop, task) {
    return loop.status === 'paused' && canToggleLoopTask(loop, task.id) && (task.status === 'failed' || task.status === 'cancelled');
}
export function canStartLoopWithFlow(loop) {
    if (loop.status === 'ready')
        return !loop.queued;
    return loop.status === 'paused' && (loop.lastDecision !== 'revise' || loop.round < loop.maxRounds);
}
