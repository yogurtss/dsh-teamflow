import type { TeamTask } from '../types.ts'

/** Mirrors graph invariants for immediate drag feedback; the server revalidates. */
export function connectionIssue(tasks: TeamTask[], from: string, to: string): string | undefined {
  const target = tasks.find(t => t.id === to)
  if (!target || !tasks.some(t => t.id === from)) return '节点不存在'
  if (from === to) return '不能连接自身'
  if (target.dependencies.includes(from)) return '这条交接已存在'
  if (target.status !== 'pending' || (target.attempt ?? 0) > 0 || target.reassigning || target.checkpoint?.decision) return '请先停止目标任务，或创建返工轮次'
  const seen = new Set<string>()
  function reaches(id: string): boolean {
    if (id === to) return true
    if (seen.has(id)) return false
    seen.add(id)
    return tasks.find(t => t.id === id)?.dependencies.some(reaches) ?? false
  }
  if (reaches(from)) return '这条连接会形成循环'
}

export function connectionTarget(tasks: TeamTask[], position: (id: string) => { x: number; y: number }, point: { x: number; y: number }, from: string) {
  return tasks.filter(t => t.id !== from).map(task => {
    const p = position(task.id), dx = point.x - p.x, dy = point.y - (p.y + 55)
    const distance = Math.hypot(dx, dy)
    return { task, p, distance, inside: point.x >= p.x - 18 && point.x <= p.x + 243 && point.y >= p.y - 12 && point.y <= p.y + 138 }
  }).filter(candidate => candidate.distance <= 40 || candidate.inside).sort((a, b) => a.distance - b.distance)[0]?.task
}
