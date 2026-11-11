import type { LoopConfig } from './workflow-loop-types.ts'
import type { WorkflowLoop } from './workflow-loop-types.ts'
export function parseLoopConfig(raw: unknown): LoopConfig {
  if (!raw || typeof raw !== 'object') throw new Error('循环配置无效')
  const value = raw as Record<string, unknown>
  if (typeof value.gateId !== 'string' || typeof value.entryId !== 'string' || !['human', 'ai'].includes(String(value.mode))) throw new Error('请配置循环入口、门控和审核方式')
  const maxRounds = Number(value.maxRounds), timeoutMinutes = Number(value.timeoutMinutes)
  if (!Number.isSafeInteger(maxRounds) || maxRounds < 1 || maxRounds > 20) throw new Error('轮次上限必须为 1–20，包含首次执行')
  if (!Number.isSafeInteger(timeoutMinutes) || timeoutMinutes < 1 || timeoutMinutes > 1440) throw new Error('执行超时必须为 1–1440 分钟')
  return { gateId: value.gateId, entryId: value.entryId, mode: value.mode as LoopConfig['mode'], maxRounds, timeoutMinutes,
    ...(value.rejectToEntry === true ? { rejectToEntry: true } : {}),
    ...(typeof value.reviewer === 'string' && value.reviewer.trim() ? { reviewer: value.reviewer.trim() } : {}) }
}

import type { TeamState, TeamTask } from './types.ts'
const loopsOf = (team: TeamState) => team.workflow?.loops ?? []
function taskOf(team: TeamState, id: string): TeamTask { const task = team.tasks.find(t => t.id === id); if (!task) throw new Error(`循环节点不存在：${id}`); return task }
export function deriveLoop(team: TeamState, config: LoopConfig, id: string, runId: string): WorkflowLoop {
  const gate = taskOf(team, config.gateId), ancestors = new Set<string>()
  const visit = (id: string) => { if (ancestors.has(id)) return; ancestors.add(id); taskOf(team, id).dependencies.forEach(visit) }
  gate.dependencies.forEach(visit)
  if (!ancestors.has(config.entryId)) throw new Error('循环入口必须位于门控上游')
  const body = new Set([config.entryId]); let changed = true
  while (changed) { changed = false; for (const task of team.tasks) if (ancestors.has(task.id) && !body.has(task.id) && task.dependencies.some(id => body.has(id))) { body.add(task.id); changed = true } }
  return { ...config, id, runId, bodyIds: [...body], round: 1, status: 'ready', historyCount: 0, captured: {}, externalInputs: {} }
}
export function reviewerConflicts(team: TeamState, bodyIds: string[], reviewer: string) {
  return team.tasks.filter(task => bodyIds.includes(task.id) && task.assignee === reviewer)
}

/** Apply the draft PASS edges to a new task list for both preview and save. */
export function gateRouteTasks(team: TeamState, gateId: string, passTargets: unknown, started: boolean) {
  if (!Array.isArray(passTargets) || passTargets.some(id => typeof id !== 'string' || !team.tasks.some(task => task.id === id))) throw new Error('请选择有效的 PASS 目标')
  return team.tasks.map(task => {
    const connected = task.dependencies.includes(gateId)
    if (connected === passTargets.includes(task.id)) return task
    if (started || task.status !== 'pending' || task.attempt || task.reassigning) throw new Error('请在首次执行前调整 PASS 路径')
    return { ...task, dependencies: connected ? task.dependencies.filter(id => id !== gateId) : [...task.dependencies, gateId] }
  })
}

export function previewGate(team: TeamState, config: LoopConfig, passTargets: string[]) {
  let bodyIds: string[] = []
  try {
    const previous = loopsOf(team).find(loop => loop.gateId === config.gateId)
    const started = !!(previous?.contracts || previous?.historyCount)
    const candidate = { ...team, tasks: gateRouteTasks(team, config.gateId, passTargets, started) }
    const loop = deriveLoop(candidate, config, previous?.id ?? config.gateId, previous?.runId ?? config.gateId)
    bodyIds = loop.bodyIds
    parseLoopConfig(config)
    if (team.halted) throw new Error('请先恢复团队')
    if (started && previous && (config.entryId !== previous.entryId || config.maxRounds < previous.round)) throw new Error('已执行的循环须保留入口，轮次上限不能低于当前轮')
    if (!started && candidate.tasks.some(t => (bodyIds.includes(t.id) || t.id === config.gateId) && (t.status !== 'pending' || t.attempt || t.checkpoint?.decision))) throw new Error('请在首次执行前配置循环')
    candidate.tasks = candidate.tasks.map(task => task.id === config.gateId ? { ...task, assignee: config.mode === 'ai' ? config.reviewer : undefined } : task)
    validateLoopGraph({ ...candidate, workflow: { ...team.workflow ?? {positions:{}, discussions:{}, history:[]}, loops: [...loopsOf(team).filter(item => item !== previous), { ...loop, status: previous?.status ?? 'ready' }] } })
    return { bodyIds, error: '' }
  } catch (error) {
    return { bodyIds, error: error instanceof Error ? error.message : String(error) }
  }
}

export function validateLoopGraph(team: TeamState): void {
  if (!loopsOf(team).length) return
  const visiting = new Set<string>(), visited = new Set<string>()
  const visit = (id: string): void => {
    if (visiting.has(id)) throw new Error('普通依赖不能形成循环，请使用门控回退边')
    if (visited.has(id)) return
    visiting.add(id); taskOf(team, id).dependencies.forEach(visit); visiting.delete(id); visited.add(id)
  }
  team.tasks.forEach(task => visit(task.id))
  const occupied = new Set<string>()
  const identities = new Set<string>()
  for (const loop of loopsOf(team)) {
    if (identities.has(loop.id)) throw new Error('循环标识重复')
    identities.add(loop.id)
    parseLoopConfig(loop)
    const gate = taskOf(team, loop.gateId), body = new Set(loop.bodyIds)
    if (gate.checkpoint?.kind === 'acceptance') throw new Error('验收节点不能作为循环门控')
    if (body.size > 32) throw new Error('单个循环最多 32 个执行节点，请拆分流程')
    if (loop.status !== 'passed' && gate.status === 'completed') throw new Error('循环门控只能通过正式审核放行')
    if (!gate.checkpoint || !body.size || !body.has(loop.entryId) || body.has(gate.id)) throw new Error('循环需要独立门控和有效入口')
    if (body.size !== loop.bodyIds.length) throw new Error('循环区域节点重复')
    for (const id of [...body, gate.id]) {
      if (occupied.has(id)) throw new Error('不支持嵌套或共享节点的循环')
      occupied.add(id)
    }
    const reaches = (from: string, to: string, seen = new Set<string>()): boolean => {
      if (from === to) return true
      if (seen.has(to)) return false
      seen.add(to)
      return taskOf(team, to).dependencies.some(dep => body.has(dep) && reaches(from, dep, seen))
    }
    for (const id of body) {
      const task = taskOf(team, id)
      if (task.kind === 'archive') throw new Error('成果归档节点应放在循环门控的 PASS 路径之后')
      if (!task.assignee || !team.members.some(m => m.name === task.assignee && (m.status !== 'removed' || ['paused','passed','cancelled'].includes(loop.status)))) throw new Error('请先为循环内任务指定有效负责人')
      if (task.checkpoint || !reaches(loop.entryId, id) || !reaches(id, gate.id)) throw new Error('循环区域必须从入口可达并汇合到唯一门控')
      if (team.tasks.some(t => !body.has(t.id) && t.id !== gate.id && t.dependencies.includes(id))) throw new Error('循环内的输出必须经过门控才能连接环外')
    }
    if (loop.mode === 'ai') {
      if (gate.assignee !== loop.reviewer) throw new Error('AI 门控负责人必须与循环审核成员一致')
      if (!loop.reviewer || !team.members.some(m => m.name === loop.reviewer && (m.status !== 'removed' || ['paused','passed','cancelled'].includes(loop.status)))) throw new Error('请选择有效的 AI 审核成员')
      const conflicts = reviewerConflicts(team, loop.bodyIds, loop.reviewer)
      if (conflicts.length) throw new Error(`${loop.reviewer} 负责「${conflicts.map(task => task.subject).join('、')}」，请选择独立审核成员`)
    } else if (gate.assignee) throw new Error('人工门控不能分配执行成员')
  }
}
