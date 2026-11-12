// Older saved runs identify a user pause through these persisted control reasons.
export function canStartLoopWithFlow(loop) {
    if (loop.status === 'ready')
        return !loop.queued;
    if (loop.status !== 'paused' || loop.lastDecision === 'blocked' || loop.lastDecision === 'revise')
        return false;
    return !!loop.failedExecutionTaskId || loop.reason === '用户暂停循环'
        || loop.reason === '用户暂停流程，已取消循环排队' || loop.reason === '循环已暂停；请使用循环控制继续';
}
