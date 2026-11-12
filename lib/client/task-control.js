import { canRetryLoopTask, canStartLoopWithFlow, canToggleLoopTask } from "../workflow-loop-types.js";
export function taskControlState(team, task, historic = false) {
    const loop = team.workflow?.loops?.find(loop => loop.gateId === task.id || loop.bodyIds.includes(task.id));
    const terminal = ['completed', 'failed', 'cancelled'].includes(task.status);
    const stopping = !!task.workflowPaused && ['claimed', 'in_progress'].includes(task.status);
    const waiting = task.dependencies.filter(id => !team.tasks.some(upstream => upstream.id === id && upstream.status === 'completed'));
    const humanReview = loop ? loop.gateId === task.id && loop.mode === 'human' && loop.status === 'reviewing'
        : task.checkpoint?.kind !== 'gate' && task.checkpoint?.mode !== 'ai' && !waiting.length;
    const reviewReady = humanReview && !!task.checkpoint && !task.checkpoint.decision && task.status === 'pending' && !task.workflowPaused && !task.workflowConfigPending && !task.workflowRerunRequired && team.phase !== 'staged' && !team.halted && !historic;
    const loopLocked = loop && (team.phase === 'staged' || !canToggleLoopTask(loop, task.id));
    const retryLoopTask = !!loop && canRetryLoopTask(loop, task);
    const disabled = !!loopLocked || historic || !!team.halted || terminal && !retryLoopTask || !!task.workflowConfigPending || !!task.workflowRerunRequired || !!task.checkpoint?.decision;
    const checked = !terminal && !task.workflowPaused && !task.workflowConfigPending && !task.workflowRerunRequired && !task.checkpoint?.decision;
    let label = terminal ? task.checkpoint?.decision === 'approve' ? 'task.status.reviewPassed' : task.status === 'completed' ? 'task.status.completed' : task.status === 'failed' ? 'task.status.failed' : 'task.status.cancelled'
        : task.checkpoint?.decision === 'reject' ? 'task.status.reviewRejected'
            : task.workflowConfigPending ? 'task.status.configurationPending'
                : task.workflowRerunRequired ? waiting.length ? 'task.control.rerunWaiting' : task.checkpoint ? 'task.control.reviewRequired' : 'task.control.rerunRequired'
                    : historic || team.halted ? 'task.control.stopped'
                        : stopping ? 'task.control.stopping'
                            : task.workflowPaused ? task.workflowAwaitingStart ? 'task.control.awaitingStart' : 'task.control.paused'
                                : team.phase === 'staged' ? 'task.control.staged'
                                    : task.status === 'in_progress' ? 'task.status.inProgress'
                                        : task.status === 'claimed' ? 'task.status.claimed'
                                            : waiting.some(id => team.tasks.some(upstream => upstream.id === id && (['failed', 'cancelled'].includes(upstream.status) || upstream.checkpoint?.decision === 'reject'))) ? 'task.control.blocked'
                                                : waiting.length ? 'task.control.waiting'
                                                    : reviewReady ? 'task.status.reviewReady' : 'task.control.queued';
    const canRerun = !loop && terminal && !task.checkpoint && !historic && !team.halted && team.phase !== 'staged';
    const active = ['claimed', 'in_progress'].includes(task.status);
    // Scheduling permission is not execution. A queued task can be withdrawn,
    // but must never advertise an execution pause before it has been claimed.
    const queued = checked && !active;
    const actionLabel = stopping ? 'task.control.retryStop'
        : !checked ? 'task.control.start' : active ? 'task.control.pause' : 'task.control.dequeue';
    if (!terminal && loop?.status === 'paused')
        label = stopping ? 'task.control.stopping' : 'task.control.paused';
    else if (!terminal && loop?.status === 'cancelled')
        label = stopping ? 'task.control.stopping' : 'task.status.cancelled';
    else if (!terminal && loop?.status === 'ready' && !loop.queued)
        label = 'task.control.awaitingStart';
    else if (loop?.gateId === task.id && loop.status === 'reviewing')
        label = loop.mode === 'ai' ? active ? 'task.status.inProgress' : 'task.control.queued' : 'task.status.reviewReady';
    else if (loop?.gateId === task.id && loop.mode === 'ai' && loop.status === 'passed')
        label = 'task.status.completed';
    const visual = label.slice(label.lastIndexOf('.') + 1);
    return { retryLoopTask, disabled, checked, label, waiting, reviewReady, stopping, terminal, canRerun, active, queued, actionLabel, visual };
}
/** Optimistic concurrency token shared by the canvas, activity view and route. */
export function flowControlVersion(team) {
    return JSON.stringify([team.phase ?? 'running', !!team.halted, (team.workflow?.loops ?? []).map(loop => [loop.gateId, loop.bodyIds, loop.status, loop.mode, !!loop.queued, loop.failedExecutionTaskId, canStartLoopWithFlow(loop)]), team.tasks.map(task => [task.id, task.updatedAt, task.status, !!task.workflowPaused, !!task.workflowConfigPending, !!task.workflowRerunRequired, task.checkpoint?.decision, task.dependencies])]);
}
export function flowControlState(team) {
    // Global start explicitly confirms pending reruns; individual node controls remain guarded.
    const controls = team.tasks.map(task => taskControlState(team, { ...task, workflowPaused: task.workflowPaused || task.workflowRerunRequired, workflowRerunRequired: false }));
    const stoppingIds = new Set(team.tasks.filter((_, i) => controls[i]?.stopping).map(task => task.id));
    const canStartLoop = team.workflow?.loops?.some(loop => canStartLoopWithFlow(loop)
        && !stoppingIds.has(loop.gateId) && !loop.bodyIds.some(id => stoppingIds.has(id)));
    const canKickLoop = team.workflow?.loops?.some(loop => loop.status === 'running' || loop.status === 'reviewing' && loop.mode === 'ai');
    return {
        canStart: !team.halted && team.phase !== 'staged' && (controls.some(c => !c.disabled && !c.stopping) || !!canStartLoop || !!canKickLoop),
        canPause: !team.halted && team.phase !== 'staged' && (controls.some(c => !c.disabled && (c.checked || c.stopping)) || !!team.workflow?.loops?.some(loop => ['running', 'reviewing'].includes(loop.status) || loop.queued) || controls.some(c => c.stopping)),
    };
}
