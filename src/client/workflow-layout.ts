import type { TeamTask } from '../types.ts'

export interface CanvasPoint { x: number; y: number }
type LayoutTask = Pick<TeamTask, 'id' | 'dependencies'>
/** Historical review links are display-only and never enter the dependency graph. */
export function reviewHistoryEdges(tasks: readonly Pick<TeamTask, 'id'|'dependencies'|'checkpoint'>[]): { from: string; to: string }[] {
  const ids = new Set(tasks.map(task => task.id))
  return tasks.flatMap(task => [...new Set(task.checkpoint?.history.flatMap(entry => entry.inputIds ?? []) ?? [])]
    .filter(id => ids.has(id) && !task.dependencies.includes(id)).map(from => ({ from, to: task.id })))
}
export interface LayoutLoop { gateId: string; entryId: string; bodyIds?: readonly string[] }

/** Template configs carry entry/gate IDs; runtime loops also carry the derived body. */
export function loopBodyIds(tasks: readonly LayoutTask[], loop: LayoutLoop): string[] {
  if (loop.bodyIds) return [...loop.bodyIds]
  const byId = new Map(tasks.map(task => [task.id, task])), ancestors = new Set<string>()
  const visit = (id: string) => { if (ancestors.has(id)) return; ancestors.add(id); byId.get(id)?.dependencies.forEach(visit) }
  byId.get(loop.gateId)?.dependencies.forEach(visit)
  const body = new Set([loop.entryId]); let changed = true
  while (changed) { changed = false; for (const task of tasks) if (ancestors.has(task.id) && !body.has(task.id) && task.dependencies.some(id => body.has(id))) { body.add(task.id); changed = true } }
  return tasks.filter(task => body.has(task.id)).map(task => task.id)
}

/** Collapse each loop into a region before arranging the surrounding DAG. */
export function arrangeWorkflow(tasks: LayoutTask[], loops: readonly LayoutLoop[] = []): Record<string, CanvasPoint> {
  if (!loops.length) return arrangeTasks(tasks)
  const groups = new Map<string, { ids: string[]; points: Record<string, CanvasPoint>; width: number; height: number; exitY: number }>()
  const owner = new Map<string, string>()
  for (const loop of loops) {
    const ids = loopBodyIds(tasks, loop), points = arrangeTasks(tasks.filter(task => ids.includes(task.id)))
    const right = Math.max(32, ...Object.values(points).map(p => p.x)), bottom = Math.max(32, ...Object.values(points).map(p => p.y))
    // The gate occupies a second row. Every body step and parallel branch stays visible.
    points[loop.gateId] = { x: right + 300, y: bottom + 230 }
    const key = `loop:${loop.gateId}`
    groups.set(key, { ids: [...ids, loop.gateId], points, width: right + 525, height: bottom + 475, exitY: bottom + 230 })
    for (const id of [...ids, loop.gateId]) owner.set(id, key)
  }
  for (const task of tasks) if (!owner.has(task.id)) {
    const key = `task:${task.id}`; owner.set(task.id, key)
    groups.set(key, { ids: [task.id], points: { [task.id]: { x: 32, y: 32 } }, width: 257, height: 182, exitY: 32 })
  }
  const units = [...groups].map(([id, group]) => ({ id, dependencies: [...new Set(tasks.filter(t => group.ids.includes(t.id)).flatMap(t => t.dependencies.map(dep => owner.get(dep))).filter((dep): dep is string => !!dep && dep !== id))] }))
  const ranks = arrangeTasks(units), widths = new Map<number, number>(), offsets = new Map<number, number>()
  for (const [id, p] of Object.entries(ranks)) widths.set(p.x, Math.max(widths.get(p.x) ?? 0, groups.get(id)!.width))
  let x = 0
  for (const rank of [...widths.keys()].sort((a, b) => a - b)) { offsets.set(rank, x); x += widths.get(rank)! + 120 }
  const result: Record<string, CanvasPoint> = {}, exits = new Map<string, number>()
  for (const rank of [...widths.keys()].sort((a, b) => a - b)) {
    let nextY = 0
    for (const unit of units.filter(u => ranks[u.id]!.x === rank)) {
      const group = groups.get(unit.id)!, y = Math.max(nextY, ...unit.dependencies.map(id => (exits.get(id) ?? 32) - 32))
      for (const [id, p] of Object.entries(group.points)) result[id] = { x: p.x + offsets.get(rank)!, y: p.y + y }
      exits.set(unit.id, y + group.exitY); nextY = y + group.height + 80
    }
  }
  return result
}

export function loopRegion(tasks: readonly LayoutTask[], loop: LayoutLoop, position: (id: string) => CanvasPoint) {
  const points = [...loopBodyIds(tasks, loop), loop.gateId].map(position)
  const x = Math.min(...points.map(p => p.x)) - 20, y = Math.min(...points.map(p => p.y)) - 28
  const right = Math.max(...points.map(p => p.x)) + 245, bottom = Math.max(...points.map(p => p.y)) + 240
  const gate = position(loop.gateId), entry = position(loop.entryId), lane = bottom - 35
  return { x, y, width: right - x, height: bottom - y, bottom,
    returnPath: `M${gate.x + 112.5},${gate.y + 150} V${lane - 18} Q${gate.x + 112.5},${lane} ${gate.x + 94.5},${lane} H${entry.x + 130.5} Q${entry.x + 112.5},${lane} ${entry.x + 112.5},${lane - 18} V${entry.y + 150}`,
    label: { x: (gate.x + entry.x) / 2 + 112.5, y: lane - 10 } }
}

/** Fixed-height cards and generous gutters keep branches and long titles apart. */
export function arrangeTasks(tasks: Pick<TeamTask, 'id' | 'dependencies'>[]): Record<string, CanvasPoint> {
  const depths = new Map<string, number>(), rows = new Map<number, number>()
  const byId = new Map(tasks.map(task => [task.id, task]))
  function depth(id: string, seen = new Set<string>()): number {
    if (depths.has(id)) return depths.get(id)!
    if (seen.has(id)) return 0
    const next = new Set(seen).add(id)
    const dependencies = byId.get(id)?.dependencies.filter(dep => byId.has(dep)) ?? []
    const value = dependencies.length ? 1 + Math.max(...dependencies.map(dep => depth(dep, next))) : 0
    depths.set(id, value)
    return value
  }
  return Object.fromEntries(tasks.map(task => {
    const column = depth(task.id), row = rows.get(column) ?? 0
    rows.set(column, row + 1)
    return [task.id, { x: 32 + column * 300, y: 32 + row * 190 }]
  }))
}

export const clampZoom = (value: number): number => Math.max(.1, Math.min(2, value))
export function fitGraph(width: number, height: number, graphWidth: number, graphHeight: number): number {
  return clampZoom(Math.min(1, Math.max(1, width - 32) / graphWidth, Math.max(1, height - 32) / graphHeight))
}
