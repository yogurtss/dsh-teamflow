export const WORKFLOW_NODE_WIDTH = 225;
export const WORKFLOW_PORT_Y = 55;
/** Anchors use the node's outer border box, shared by paths, snapping and CSS. */
export function connectionPort(point, side) {
    return { x: point.x + (side === 'output' ? WORKFLOW_NODE_WIDTH : 0), y: point.y + WORKFLOW_PORT_Y };
}
export function connectionPath(start, end) {
    return `M${start.x},${start.y} C${start.x + 35},${start.y} ${end.x - 35},${end.y} ${end.x},${end.y}`;
}
/** Mirrors graph invariants for immediate drag feedback; the server revalidates. */
export function connectionIssue(tasks, from, to) {
    const target = tasks.find(t => t.id === to);
    if (!target || !tasks.some(t => t.id === from))
        return '节点不存在';
    if (from === to)
        return '不能连接自身';
    if (target.dependencies.includes(from))
        return '这条交接已存在';
    if (target.status !== 'pending' || ((target.attempt ?? 0) > 0 && !target.workflowPaused) || target.reassigning || (target.checkpoint?.decision && target.checkpoint.decision !== 'reject'))
        return '请先停止目标任务，或创建返工轮次';
    const seen = new Set();
    function reaches(id) {
        if (id === to)
            return true;
        if (seen.has(id))
            return false;
        seen.add(id);
        return tasks.find(t => t.id === id)?.dependencies.some(reaches) ?? false;
    }
    if (reaches(from))
        return '这条连接会形成循环';
}
export function connectionTarget(tasks, position, point, from) {
    return tasks.filter(t => t.id !== from).map(task => {
        const p = position(task.id), anchor = connectionPort(p, 'input'), dx = point.x - anchor.x, dy = point.y - anchor.y;
        const distance = Math.hypot(dx, dy);
        return { task, p, distance, inside: point.x >= p.x - 18 && point.x <= p.x + 243 && point.y >= p.y - 12 && point.y <= p.y + 138 };
    }).filter(candidate => candidate.distance <= 40 || candidate.inside).sort((a, b) => a.distance - b.distance)[0]?.task;
}
