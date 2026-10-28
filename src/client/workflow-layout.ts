import type { TeamTask } from '../types.ts'

export interface CanvasPoint { x: number; y: number }

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
