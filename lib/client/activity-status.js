/** Completed nodes, not estimated model progress. Scope matches the badge's click target. */
export function activityStatus(team, archived = false) {
    const tasks = team?.tasks.filter(task => !task.superseded) ?? [];
    const delivered = (task) => task.status === 'completed' && (team?.forceCompleted || !task.checkpoint || task.checkpoint.decision === 'approve');
    const completed = tasks.filter(delivered).length;
    // Dependencies describe forward flow only. REJECT is a loop control edge,
    // so it neither creates an endpoint at the entry nor hides a terminal gate.
    const upstream = new Set(tasks.flatMap(task => task.dependencies));
    const endpoints = tasks.filter(task => !upstream.has(task.id));
    const unpassedGates = new Set(team?.workflow?.loops.filter(loop => loop.status !== 'passed').map(loop => loop.gateId));
    const done = endpoints.length > 0 && endpoints.every(delivered) && (team?.forceCompleted || !tasks.some(task => unpassedGates.has(task.id)));
    const running = archived || team?.halted ? 0 : tasks.filter(t => !t.workflowPaused && ['claimed', 'in_progress'].includes(t.status)).length;
    const reviews = archived || team?.halted || team?.phase === 'staged' ? 0 : tasks.filter(t => t.checkpoint && !t.checkpoint.decision && t.status === 'pending' && !t.workflowPaused && !t.workflowRerunRequired && !t.workflowConfigPending && t.dependencies.every(id => tasks.some(up => up.id === id && up.status === 'completed'))).length;
    const issues = archived ? 0 : tasks.filter(t => t.status === 'failed' || t.checkpoint?.decision === 'reject' || t.workflowConfigPending || t.workflowRerunRequired).length;
    const configuration = archived ? 0 : tasks.filter(t => t.workflowConfigPending && t.status !== 'failed' && t.checkpoint?.decision !== 'reject' && !t.workflowRerunRequired).length;
    const attention = reviews + issues;
    const paused = !!team?.halted || tasks.some(t => t.workflowPaused) && !running && !tasks.some(t => t.status === 'pending' && !t.workflowPaused && !t.workflowConfigPending && !t.workflowRerunRequired && !t.checkpoint?.decision);
    const state = done ? 'completed' : archived ? 'archived' : !team ? 'history' : issues ? (configuration === issues && !reviews ? 'configuration' : 'attention') : team.phase === 'staged' ? 'staged' : reviews ? 'review' : paused ? 'paused' : running ? 'running' : 'waiting';
    return { state, completed, total: tasks.length, percent: done ? 100 : tasks.length ? Math.floor(completed / tasks.length * 100) : 0, running, reviews, attention };
}
