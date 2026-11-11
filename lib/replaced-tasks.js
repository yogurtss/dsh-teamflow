// Keep every task in history. Progress can retire a failed path only after its replacement succeeds.
export function replacedTaskIds(tasks) {
    const byId = new Map(tasks.map(t => [t.id, t]));
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
        if (task.status === 'failed' || task.status === 'cancelled')
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
        if (old.status === 'pending')
            old.dependencies.forEach(retire);
    }
    for (const task of tasks) {
        if (task.status !== 'completed' || (task.checkpoint && task.checkpoint.decision !== 'approve'))
            continue;
        sources(task).forEach(retire);
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
