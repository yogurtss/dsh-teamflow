/** Natural-language planning acceptance; no model output or tool order is scripted. */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
export { modelMetrics } from './harness-model-case.mjs'
export const sources = { 'brief.txt': '虚构社区读书活动策划，不涉及真实报名或发布。\n' }
export const freshPrompt = `请为社区读书活动建立 TeamFlow 工作流方案，先等待我确认，今天不要启动执行。
先由策划收集整理活动资料，这一步只执行一次，不需要循环。
然后策划编写活动文案，由独立审核员 AI 自动审核；不通过时要带着意见返回同一文案任务改进，最多执行 2 轮，超限暂停等我决定。
文案通过后，由设计成员制作海报方案，我来人工审核；不通过就返回同一海报任务按我的意见改进，最多 3 轮。
这两个循环都要保存每轮历史，不要通过新增任务实现返工。每轮执行超时设为 10 分钟。
最后由策划一次性汇总已通过的文案和海报，不要循环这一步。汇总之后再加一个系统自动执行的成果归档节点，默认只保存清单、版本和证据引用，不复制文件，不分配执行成员。每个任务给出完整要求和验收标准。`
export const coldPrompt = '读取并说明保存的工作流方案，不执行或修改。'
export async function verifySeededBehavior() { return { passed: true } }
export function evaluate(workspace, captainId, events) {
  let team
  try { for (const id of readdirSync(join(workspace, '.agent-teams'))) {
    try { const value = JSON.parse(readFileSync(join(workspace, '.agent-teams', id, 'team.json'), 'utf8')); if (value.captainSessionId === captainId) team = value } catch {}
  } } catch {}
  const loops = team?.workflow?.loops ?? [], ai = loops.find(l => l.mode === 'ai'), human = loops.find(l => l.mode === 'human')
  const nodes = new Set(loops.flatMap(l => [l.gateId, ...l.bodyIds]))
  const ordinary = team?.tasks.filter(t => !nodes.has(t.id)&&t.kind!=='archive') ?? []
  const checks = {
    archiveAfterDelivery: team?.tasks.filter(t=>t.kind==='archive').length===1 && team.tasks.some(t=>t.kind==='archive'&&!t.assignee&&!t.checkpoint&&!nodes.has(t.id)&&t.archive?.copyFiles===false&&t.dependencies.some(id=>ordinary.some(o=>o.id===id&&o.dependencies.includes(human?.gateId)))),
    createdThroughTool: events.some(e => e.event === 'tool-result' && e.name === 'agent_teams_create' && !e.isError),
    awaitingHumanApproval: team?.phase === 'staged' && team?.planReviewState === 'awaiting_review',
    separateHumanAndAiLoops: loops.length === 2 && !!ai && !!human,
    exactBudgets: ai?.maxRounds === 2 && human?.maxRounds === 3 && loops.every(l => l.timeoutMinutes === 10),
    untouchedRounds: loops.length === 2 && loops.every(l => l.round === 1 && l.status === 'ready' && l.historyCount === 0),
    independentReviewer: !!ai?.reviewer && ai.bodyIds.every(id => team.tasks.find(t => t.id === id)?.assignee !== ai.reviewer),
    ordinaryPreparationAndDelivery: ordinary.length === 2 && ordinary.some(t => !t.dependencies.length) && ordinary.some(t => t.dependencies.includes(human?.gateId)),
    sequentialLoops: !!ai && !!human && team.tasks.find(t => t.id === human.entryId)?.dependencies.includes(ai.gateId),
    noExecution: !!team && team.members.every(m => !m.id) && team.tasks.every(t => t.status === 'pending' && !t.attemptId),
    standaloneContracts: !!team && team.tasks.every(t => typeof t.description === 'string' && t.description.length > 20),
  }
  return { passed: Object.values(checks).every(Boolean), checks, team: team && { teamId: team.id, loops: loops.map(({mode,round,maxRounds,bodyIds,gateId}) => ({mode,round,maxRounds,bodyIds,gateId})), tasks: team.tasks.map(({id,subject,assignee,dependencies}) => ({id,subject,assignee,dependencies})) } }
}
