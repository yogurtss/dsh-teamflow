export const CARD_WIDTH = 294, CARD_HEIGHT = 230, CARD_PORT_Y = 114;
// Persist layouts in their original coordinate space so old layouts and templates can round-trip.
export const displayPoint = (p) => ({ x: p.x * CARD_WIDTH / 225, y: p.y * CARD_HEIGHT / 150 });
export const storedPoint = (p) => ({ x: p.x * 225 / CARD_WIDTH, y: p.y * 150 / CARD_HEIGHT });
export function connectionPort(p, side, diamond = false) {
    return { x: p.x + (side === 'output' ? (diamond ? 225 : CARD_WIDTH) : 0), y: p.y + (diamond ? 75 : CARD_PORT_Y) };
}
export function connectionTarget(tasks, position, point, from, diamond = () => false) {
    return tasks.filter(t => t.id !== from).map(task => {
        const p = position(task.id), gate = diamond(task), anchor = connectionPort(p, 'input', gate);
        const distance = Math.hypot(point.x - anchor.x, point.y - anchor.y);
        const inside = point.x >= p.x - 18 && point.x <= p.x + (gate ? 225 : CARD_WIDTH) + 18 && point.y >= p.y - 12 && point.y <= p.y + (gate ? 150 : CARD_HEIGHT) + 12;
        return { task, distance, inside };
    }).filter(hit => hit.inside || hit.distance <= 40).sort((a, b) => a.distance - b.distance)[0]?.task;
}
