export function rerunImpact(tasks, id) {
    const affected = new Set([id]);
    let changed = true;
    while (changed) {
        changed = false;
        for (const task of tasks)
            if (!affected.has(task.id) && task.dependencies.some(dep => affected.has(dep))) {
                affected.add(task.id);
                changed = true;
            }
    }
    const descendants = tasks.filter(task => task.id !== id && affected.has(task.id));
    return {
        descendants,
        active: descendants.filter(task => ['claimed', 'in_progress'].includes(task.status) || task.reassigning),
    };
}
export function rerunnableTasks(tasks, memberName) {
    return tasks.filter(task => !task.checkpoint && task.assignee === memberName && ['completed', 'failed', 'cancelled'].includes(task.status));
}
/** Keep the contract, identity and monotonic generation; invalidate old capabilities and evidence. */
export function resetTaskForRerun(task, suspended, now) {
    if (['completed', 'failed', 'cancelled'].includes(task.status)) {
        task.stoppedAttempts ??= [];
        const status = task.status === 'completed' ? '已完成' : task.status === 'cancelled' ? '已取消' : '失败';
        task.stoppedAttempts.push({ attemptId: task.attemptId, output: `${status} · ${task.output || '未提交结果'}`, at: now });
    }
    task.status = 'pending';
    task.workflowPaused = suspended;
    task.workflowRerunRequired = suspended;
    task.updatedAt = now;
    task.workflowAwaitingStart = false;
    delete task.workflowRerunContext;
    for (const key of ['output', 'attemptId', 'handoffId', 'handoffFromMemberId', 'reassigning', 'verdict', 'findings', 'changedPaths', 'acceptanceResults', 'commandsRun', 'supplementalEvidence', 'reviewedAttempt', 'reviewedArtifacts', 'reviewedGaps', 'reviewedScope', 'reviewedDuringDrift', 'verdictStartSnapshot'])
        delete task[key];
    if (task.checkpoint)
        task.checkpoint = { round: task.checkpoint.round + 1, history: task.checkpoint.history };
}
