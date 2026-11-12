// Keep every task in history. Progress can retire a failed path only after its replacement succeeds.
export function replacedTaskIds(tasks, workflow) {
    if (!tasks.some(task => task.status === 'failed' || task.status === 'cancelled' || task.checkpoint?.decision === 'reject'))
        return new Set();
    const byId = new Map(tasks.map(t => [t.id, t]));
    // Older canvases did not record a replacement when an edge was deleted
    // separately. Recover former inputs from the actual applied graph edits.
    const priorInputs = new Map();
    function remember(id, dependencies) {
        const inputs = priorInputs.get(id) ?? new Set();
        for (const dependency of dependencies)
            inputs.add(dependency);
        priorInputs.set(id, inputs);
    }
    for (const task of workflow?.templateDefinition?.tasks ?? [])
        remember(task.id, task.dependencies);
    for (const change of workflow?.history ?? []) {
        if (change.status !== 'applied')
            continue;
        for (const op of change.operations) {
            if (op.action === 'remove_task') {
                priorInputs.delete(op.id);
                for (const inputs of priorInputs.values())
                    inputs.delete(op.id);
            }
            else if ((op.action === 'add_task' || op.action === 'update_task') && op.id && op.dependencies) {
                remember(op.id, op.dependencies);
            }
        }
    }
    const byTitle = new Map();
    for (const task of tasks) {
        const matches = byTitle.get(task.subject);
        if (matches)
            matches.push(task);
        else
            byTitle.set(task.subject, [task]);
    }
    function sources(task) {
        if (task.replacesTaskIds)
            return task.replacesTaskIds;
        const title = task.subject?.replace(/ · 返工 \d+$/, '');
        if (!title || title === task.subject)
            return [];
        const matches = byTitle.get(title)?.filter(old => old.assignee === task.assignee &&
            task.description?.startsWith((old.description ?? '') + '\n\n返工要求：'));
        return matches?.length === 1 ? [matches[0].id] : [];
    }
    const replaced = new Set();
    const blocked = new Map();
    function blockedByFailure(task) {
        if (task.status === 'failed' || task.status === 'cancelled' || task.checkpoint?.decision === 'reject')
            return true;
        if (task.status !== 'pending')
            return false;
        if (blocked.has(task.id))
            return blocked.get(task.id);
        blocked.set(task.id, false);
        const result = task.dependencies.some(id => {
            const upstream = byId.get(id);
            return upstream && blockedByFailure(upstream);
        });
        blocked.set(task.id, result);
        return result;
    }
    function retire(id) {
        const old = byId.get(id);
        if (!old || replaced.has(id) || !blockedByFailure(old))
            return;
        replaced.add(id);
        sources(old).forEach(retire);
        // A retired branch can contain several failed/cancelled steps. Shared
        // inputs still required by another unfinished branch are restored below.
        old.dependencies.forEach(retire);
    }
    for (const task of tasks) {
        if (task.status !== 'completed' || (task.checkpoint && task.checkpoint.decision !== 'approve'))
            continue;
        sources(task).forEach(retire);
        if (task.dependencies.length) {
            const inputs = priorInputs.get(task.id);
            for (const id of inputs ?? [])
                if (!task.dependencies.includes(id))
                    retire(id);
            for (const round of task.checkpoint?.history ?? []) {
                for (const id of round.inputIds ?? [])
                    if (!task.dependencies.includes(id))
                        retire(id);
            }
        }
        // Older automatic repairs already record the gate that supplied their findings.
        if (task.verdict === 'pass' || (!task.verdict && task.kind === 'verification')) {
            for (const id of task.dependencies) {
                const repair = byId.get(id);
                if (repair?.kind === 'repair' && repair.status === 'completed')
                    repair.findingSourceTaskIds?.forEach(retire);
            }
        }
    }
    // A different unfinished consumer may still need the original result.
    const needed = tasks.filter(task => !replaced.has(task.id) && task.status !== 'completed');
    while (needed.length) {
        for (const id of needed.pop().dependencies) {
            if (replaced.delete(id))
                needed.push(byId.get(id));
        }
    }
    return replaced;
}
