/** Historical review links are display-only and never enter the dependency graph. */
export function reviewHistoryEdges(tasks) {
    const ids = new Set(tasks.map(task => task.id));
    return tasks.flatMap(task => [...new Set(task.checkpoint?.history.flatMap(entry => entry.inputIds ?? []) ?? [])]
        .filter(id => ids.has(id) && !task.dependencies.includes(id)).map(from => ({ from, to: task.id })));
}
/** Template configs carry entry/gate IDs; runtime loops also carry the derived body. */
export function loopBodyIds(tasks, loop) {
    if (loop.bodyIds)
        return [...loop.bodyIds];
    const byId = new Map(tasks.map(task => [task.id, task])), ancestors = new Set();
    const visit = (id) => { if (ancestors.has(id))
        return; ancestors.add(id); byId.get(id)?.dependencies.forEach(visit); };
    byId.get(loop.gateId)?.dependencies.forEach(visit);
    const body = new Set([loop.entryId]);
    let changed = true;
    while (changed) {
        changed = false;
        for (const task of tasks)
            if (ancestors.has(task.id) && !body.has(task.id) && task.dependencies.some(id => body.has(id))) {
                body.add(task.id);
                changed = true;
            }
    }
    return tasks.filter(task => body.has(task.id)).map(task => task.id);
}
/** Collapse each loop into a region before arranging the surrounding DAG. */
export function arrangeWorkflow(tasks, loops = []) {
    if (!loops.length)
        return arrangeTasks(tasks);
    const groups = new Map();
    const owner = new Map();
    for (const loop of loops) {
        const ids = loopBodyIds(tasks, loop), points = arrangeTasks(tasks.filter(task => ids.includes(task.id)));
        const right = Math.max(32, ...Object.values(points).map(p => p.x)), bottom = Math.max(32, ...Object.values(points).map(p => p.y));
        // The gate occupies a second row. Every body step and parallel branch stays visible.
        points[loop.gateId] = { x: right + 300, y: bottom + 230 };
        const key = `loop:${loop.gateId}`;
        groups.set(key, { ids: [...ids, loop.gateId], points, width: right + 525, height: bottom + 475, exitY: bottom + 230 });
        for (const id of [...ids, loop.gateId])
            owner.set(id, key);
    }
    for (const task of tasks)
        if (!owner.has(task.id)) {
            const key = `task:${task.id}`;
            owner.set(task.id, key);
            groups.set(key, { ids: [task.id], points: { [task.id]: { x: 32, y: 32 } }, width: 257, height: 182, exitY: 32 });
        }
    const units = [...groups].map(([id, group]) => ({ id, dependencies: [...new Set(tasks.filter(t => group.ids.includes(t.id)).flatMap(t => t.dependencies.map(dep => owner.get(dep))).filter((dep) => !!dep && dep !== id))] }));
    const ranks = arrangeTasks(units), widths = new Map(), offsets = new Map();
    for (const [id, p] of Object.entries(ranks))
        widths.set(p.x, Math.max(widths.get(p.x) ?? 0, groups.get(id).width));
    let x = 0;
    for (const rank of [...widths.keys()].sort((a, b) => a - b)) {
        offsets.set(rank, x);
        x += widths.get(rank) + 120;
    }
    const result = {}, exits = new Map();
    for (const rank of [...widths.keys()].sort((a, b) => a - b)) {
        let nextY = 0;
        for (const unit of units.filter(u => ranks[u.id].x === rank)) {
            const group = groups.get(unit.id), y = Math.max(nextY, ...unit.dependencies.map(id => (exits.get(id) ?? 32) - 32));
            for (const [id, p] of Object.entries(group.points))
                result[id] = { x: p.x + offsets.get(rank), y: p.y + y };
            exits.set(unit.id, y + group.exitY);
            nextY = y + group.height + 80;
        }
    }
    return result;
}
export function loopRegion(tasks, loop, position, cardWidth = 225, cardHeight = 150) {
    const points = [...loopBodyIds(tasks, loop), loop.gateId].map(position);
    const x = Math.min(...points.map(p => p.x)) - 20, y = Math.min(...points.map(p => p.y)) - 28;
    const right = Math.max(...points.map(p => p.x)) + cardWidth + 20, bottom = Math.max(...points.map(p => p.y)) + cardHeight + 90;
    const gate = position(loop.gateId), entry = position(loop.entryId), lane = bottom - 35;
    return { x, y, width: right - x, height: bottom - y, bottom,
        returnPath: `M${gate.x + 112.5},${gate.y + 150} V${lane - 18} Q${gate.x + 112.5},${lane} ${gate.x + 94.5},${lane} H${entry.x + cardWidth / 2 + 18} Q${entry.x + cardWidth / 2},${lane} ${entry.x + cardWidth / 2},${lane - 18} V${entry.y + cardHeight}`,
        label: { x: (gate.x + entry.x) / 2 + 112.5, y: lane - 10 } };
}
/** Fixed-height cards and generous gutters keep branches and long titles apart. */
export function arrangeTasks(tasks) {
    const depths = new Map(), rows = new Map();
    const byId = new Map(tasks.map(task => [task.id, task]));
    function depth(id, seen = new Set()) {
        if (depths.has(id))
            return depths.get(id);
        if (seen.has(id))
            return 0;
        const next = new Set(seen).add(id);
        const dependencies = byId.get(id)?.dependencies.filter(dep => byId.has(dep)) ?? [];
        const value = dependencies.length ? 1 + Math.max(...dependencies.map(dep => depth(dep, next))) : 0;
        depths.set(id, value);
        return value;
    }
    return Object.fromEntries(tasks.map(task => {
        const column = depth(task.id), row = rows.get(column) ?? 0;
        rows.set(column, row + 1);
        return [task.id, { x: 32 + column * 300, y: 32 + row * 190 }];
    }));
}
export const clampZoom = (value) => Math.max(.1, Math.min(2, value));
export function fitGraph(width, height, graphWidth, graphHeight) {
    return clampZoom(Math.min(1, Math.max(1, width - 32) / graphWidth, Math.max(1, height - 32) / graphHeight));
}
