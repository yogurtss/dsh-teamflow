export function canChangeGateReview(loop, gate) {
    return ['ready', 'running', 'paused'].includes(loop.status) && gate.status === 'pending'
        && !gate.reassigning && !gate.checkpoint?.decision;
}
export function canStartLoopWithFlow(loop) {
    if (loop.status === 'ready')
        return !loop.queued;
    return loop.status === 'paused' && (loop.lastDecision !== 'revise' || loop.round < loop.maxRounds);
}
