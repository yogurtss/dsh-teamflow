/** One-off work must not acquire unsolicited loops or review gates. */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
export { modelMetrics } from './harness-model-case.mjs'
export const sources = { 'notes.txt': '讨论了周六举行社区读书活动，人数约二十人，地点待定。\n' }
export const freshPrompt = '请用 TeamFlow 为这份 notes.txt 安排一次性整理工作：先整理活动信息，再据此输出一页活动摘要。给每个任务完整说明和验收标准，建好方案后等我确认，先不要执行。'
export const coldPrompt = '读取保存的方案，不修改或执行。'
export async function verifySeededBehavior() { return { passed: true } }
export function evaluate(workspace, captainId, events) {
  let team
  try { for (const id of readdirSync(join(workspace, '.agent-teams'))) {
    try { const value = JSON.parse(readFileSync(join(workspace, '.agent-teams', id, 'team.json'), 'utf8')); if (value.captainSessionId === captainId) team = value } catch {}
  } } catch {}
  const checks = {
    createdThroughTool: events.some(e => e.event === 'tool-result' && e.name === 'agent_teams_create' && !e.isError),
    staged: team?.phase === 'staged',
    plainDag: !!team && !team.workflow?.loops?.length && team.tasks.every(t => !t.checkpoint),
    exactlyTwoTasks: team?.tasks.length === 2 && team.tasks.some(t => t.dependencies.length === 1),
    noExecution: !!team && team.members.every(m => !m.id) && team.tasks.every(t => t.status === 'pending'),
    completeContracts: !!team && team.tasks.every(t => t.description?.length > 20),
  }
  return { passed: Object.values(checks).every(Boolean), checks, team: team && { teamId: team.id, taskIds: team.tasks.map(t => t.id) } }
}
