import { activityStatus } from "./activity-status.js";
export function activityActors(team, archived = false) {
    const row = (label, tone, name, task) => ({ label, tone, name, task });
    const status = activityStatus(team, archived);
    if (status.state === 'completed')
        return [row('activity.state.completed', 'complete')];
    if (archived)
        return [row('activity.state.archived', 'ready')];
    if (team.halted)
        return [row('activity.state.paused', 'ready')];
    switch (team.adaptation) {
        case 'generating': return [row('actor.adapting', 'adapting', 'captain')];
        case 'decision': return [row('actor.proposal', 'decision', 'captain')];
        case 'attention': return [row('actor.needsInput', 'blocked', 'captain')];
        case 'applied': return [row('actor.applied', 'ready', 'captain')];
    }
    const tasks = team.tasks.filter(t => !t.superseded);
    const rows = [];
    for (const task of tasks) {
        const name = task.assignee || undefined;
        const gate = team.workflow?.loops?.find(loop => loop.gateId === task.id);
        if (task.handoffFrom !== undefined) {
            rows.push({ ...row('actor.handoff', 'ready', name, task.subject), from: task.handoffFrom });
        }
        else if (gate?.status === 'reviewing' && gate.mode === 'human') {
            rows.push(row('actor.decision', 'decision', undefined, task.subject));
        }
        else if (gate?.status === 'paused') {
            rows.push(row('activity.state.paused', 'ready', name, task.subject));
        }
        else if (task.status === 'failed' || task.checkpoint?.decision === 'reject') {
            rows.push(row('actor.blocked', 'blocked', name, task.subject));
        }
        else if (['claimed', 'in_progress'].includes(task.status)) {
            const live = name === 'captain' ? team.captainWorking : team.members.some(m => m.name === name && m.activity === 'working');
            if (!task.workflowPaused && live)
                rows.push(row('activity.state.running', 'active', name, task.subject));
            else
                rows.push(row(task.workflowPaused ? 'activity.state.paused' : 'actor.awaitingSession', task.status === 'in_progress' && !task.workflowPaused ? 'blocked' : 'ready', name, task.subject));
        }
        else if (task.checkpoint && team.phase !== 'staged' && task.status === 'pending' && !task.workflowPaused &&
            !task.workflowConfigPending && !task.workflowRerunRequired && !task.checkpoint.decision &&
            !gate &&
            task.dependencies.every(id => tasks.some(t => t.id === id && t.status === 'completed'))) {
            rows.push(row('actor.decision', 'decision', undefined, task.subject));
        }
    }
    if (rows.length)
        return rows;
    const pending = tasks.filter(t => t.status === 'pending');
    const task = pending.find(t => t.dependencies.every(id => tasks.some(u => u.id === id && u.status === 'completed'))) ?? pending[0];
    if (!task)
        return [row('activity.state.waiting', 'ready')];
    const waiting = task.dependencies.some(id => !tasks.some(u => u.id === id && u.status === 'completed'));
    const label = task.workflowConfigPending ? 'activity.state.configuration' : waiting ? 'actor.dependencies' :
        !task.assignee && !task.checkpoint ? 'actor.unassigned' : 'task.control.awaitingStart';
    return [row(label, 'ready', task.assignee || undefined, task.subject)];
}
