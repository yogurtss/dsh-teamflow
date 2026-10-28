/** Playback grants scheduling permission; it never satisfies a dependency. */
export function taskControlState(team, task, historic = false) {
    const terminal = ['completed', 'failed', 'cancelled'].includes(task.status);
    const stopping = !!task.workflowPaused && ['claimed', 'in_progress'].includes(task.status);
    const waiting = task.dependencies.filter(id => !team.tasks.some(upstream => upstream.id === id && upstream.status === 'completed'));
    const reviewReady = !!task.checkpoint && !task.checkpoint.decision && task.status === 'pending' && !task.workflowPaused && !task.workflowConfigPending && !task.workflowRerunRequired && !waiting.length && team.phase !== 'staged' && !team.halted && !historic;
    const disabled = historic || !!team.halted || terminal || !!task.workflowConfigPending || !!task.workflowRerunRequired || !!task.checkpoint?.decision;
    const checked = !terminal && !task.workflowPaused && !task.workflowConfigPending && !task.workflowRerunRequired && !task.checkpoint?.decision;
    const label = terminal ? task.checkpoint?.decision === 'approve' ? 'task.status.reviewPassed' : task.status === 'completed' ? 'task.status.completed' : task.status === 'failed' ? 'task.status.failed' : 'task.status.cancelled'
        : task.checkpoint?.decision === 'reject' ? 'task.status.reviewRejected'
            : task.workflowConfigPending ? 'task.status.configurationPending'
                : task.workflowRerunRequired ? 'task.control.rerunRequired'
                    : historic || team.halted ? 'task.control.stopped'
                        : stopping ? 'task.control.stopping'
                            : task.workflowPaused ? 'task.control.paused'
                                : team.phase === 'staged' ? 'task.control.staged'
                                    : task.status === 'in_progress' ? 'task.status.inProgress'
                                        : task.status === 'claimed' ? 'task.status.claimed'
                                            : waiting.length ? 'task.control.waiting'
                                                : task.checkpoint ? 'task.status.reviewReady' : 'task.control.queued';
    const canRerun = terminal && !task.checkpoint && !historic && !team.halted && team.phase !== 'staged';
    return { disabled, checked, label, waiting, reviewReady, stopping, terminal, canRerun };
}
