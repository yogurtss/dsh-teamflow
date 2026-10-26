import type { TeamState } from '../types.ts'
import type { WorkflowOperation } from '../workflow-types.ts'

export function draftTaskId(team: TeamState): string {
  let seq = team.taskSeq + 1
  while (team.tasks.some(task => task.id === `t${seq}`)) seq++
  return `t${seq}`
}

/** One atomic proposal inserts a node and reconnects the explicitly chosen successors. */
export function taskDraftOperations(team: TeamState, input: {
  id?: string; checkpoint: boolean; subject: string; description?: string; assignee?: string;
  dependencies: string[]; successors: string[];
}): WorkflowOperation[] {
  const id = input.id ?? draftTaskId(team)
  if (input.dependencies.some(dependency => dependency === id || input.successors.includes(dependency)) || input.successors.includes(id)) throw new Error('同一节点不能同时作为上游和后续，也不能连接自身')
  const fields = { subject: input.subject, description: input.description, assignee: input.checkpoint ? undefined : input.assignee, dependencies: input.dependencies }
  const operations: WorkflowOperation[] = [input.id ? { action: 'update_task', id, ...fields } : { action: 'add_task', id, checkpoint: input.checkpoint, ...fields }]
  for (const task of team.tasks) {
    if (task.id === id) continue
    const wasSuccessor = !!input.id && task.dependencies.includes(id)
    if (!input.successors.includes(task.id) && !wasSuccessor) continue
    const dependencies = input.successors.includes(task.id)
      ? [...new Set([...task.dependencies.filter(dependency => !input.dependencies.includes(dependency) && dependency !== id), id])]
      : task.dependencies.filter(dependency => dependency !== id)
    if (JSON.stringify(dependencies) !== JSON.stringify(task.dependencies)) operations.push({ action: 'update_task', id: task.id, dependencies })
  }
  return operations
}
