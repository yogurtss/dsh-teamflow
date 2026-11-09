import { sourceText } from "./workflow-text.js";
export const WORKFLOW_GATE_PATH = 'M112.5 2 C116.5 2 119 5 124 8 L215 67 C222 71 225 72 225 75 C225 78 222 79 215 83 L124 142 C119 145 116.5 148 112.5 148 C108.5 148 106 145 101 142 L10 83 C3 79 0 78 0 75 C0 72 3 71 10 67 L101 8 C106 5 108.5 2 112.5 2 Z';
export const WORKFLOW_NODE_WIDTH = 225;
export const WORKFLOW_PORT_Y = 55;
export const WORKFLOW_GATE_PORT_Y = 75;
/** Anchors use the node's outer border box, shared by paths, snapping and CSS. */
export function connectionPort(point, side, checkpoint = false) {
    return { x: point.x + (side === 'output' ? WORKFLOW_NODE_WIDTH : 0), y: point.y + (checkpoint ? WORKFLOW_GATE_PORT_Y : WORKFLOW_PORT_Y) };
}
export function connectionPath(start, end) {
    return `M${start.x},${start.y} C${start.x + 35},${start.y} ${end.x - 35},${end.y} ${end.x},${end.y}`;
}
/** Mirrors graph invariants for immediate drag feedback; the server revalidates. */
export function connectionIssue(tasks, from, to, l = sourceText) {
    const target = tasks.find(t => t.id === to);
    if (!target || !tasks.some(t => t.id === from))
        return l("节点不存在");
    if (from === to)
        return l("不能连接自身");
    if (target.dependencies.includes(from))
        return l("这条交接已存在");
    if (target.status !== 'pending' || ((target.attempt ?? 0) > 0 && !target.workflowPaused) || target.reassigning || (target.checkpoint?.decision && target.checkpoint.decision !== 'reject'))
        return l("请先停止目标任务，或创建返工轮次");
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
        return l("这条连接会形成循环");
}
export function connectionTarget(tasks, position, point, from) {
    return tasks.filter(t => t.id !== from).map(task => {
        const p = position(task.id), anchor = connectionPort(p, 'input', !!task.checkpoint), dx = point.x - anchor.x, dy = point.y - anchor.y;
        const distance = Math.hypot(dx, dy);
        return { task, p, distance, inside: point.x >= p.x - 18 && point.x <= p.x + 243 && point.y >= p.y - 12 && point.y <= p.y + 138 };
    }).filter(candidate => candidate.distance <= 40 || candidate.inside).sort((a, b) => a.distance - b.distance)[0]?.task;
}
