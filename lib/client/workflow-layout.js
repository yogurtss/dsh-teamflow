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
