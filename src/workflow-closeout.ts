import { join } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import { createUserMessage } from '@deepseek-ai/dsh-llm'
import { agentTeamsSource, observedSessionFormatVersion, sessionOwnEvents } from './harness-compat.ts'
import { sessionLeadsTeamAsync } from './lineage.ts'
import { haltTeamWork } from './tools.ts'
import { archiveTeamDir, readArchivedTeam, readTeam, recordRetiredMemberIds, withTeamLock, writeTeam } from './state.ts'
import { cancelTaskArchive } from './task-archive.ts'
import type { TeamState } from './types.ts'

function taskSummary(team: TeamState, english: boolean): string {
  const lines = [english ? `Workflow “${team.name}” was force-ended by the user.` : `用户已强制结束流程「${team.name}」。`]
  const labels = {completed:'已完成', failed:'失败', cancelled:'已取消', pending:'等待中', claimed:'已领取', in_progress:'进行中'}
  for (const task of team.tasks) {
    const statuses = team.closeout?.originalStatuses
    const status = statuses && Object.hasOwn(statuses, task.id) ? statuses[task.id]! : task.status
    lines.push(`[${english ? status : labels[status]}] ${task.id} · ${task.subject}`)
    if (task.output) lines.push(task.output.slice(0, 1200))
    if (task.changedPaths?.length) lines.push(task.changedPaths.join(', '))
  }
  return lines.join('\n')
}

async function requestReport(captain: Agent, summary: string, english: boolean): Promise<string | undefined> {
  const task = english
    ? 'Write the final handover report in this conversation. Summarize what worked, what did not, and lessons learned from this run. Include verified results and files, blockers, unfinished work, and suggested next steps. Do not resume work, call tools or create another workflow.'
    : '请直接在当前对话给出收尾报告，总结本次流程的得失：哪些做法有效、哪些未奏效、有什么经验教训。列出已验证的成果和文件、阻塞原因、未完成事项及后续建议。缺少证据时请注明。请勿调用工具、恢复执行或创建新流程。'
  const prompt = createUserMessage({
    source: agentTeamsSource({kind:'agent-teams'}, observedSessionFormatVersion(captain)),
    content: [{type:'text', text:task + '\n\n' + summary.slice(0, 28000)}],
  })
  captain.followup(prompt)
  await captain.whenIdle()
  let matching = false
  let report: string | undefined
  for (const event of sessionOwnEvents(captain.session)) {
    if (event.type === 'user/message' && event.data.id === prompt.id) matching = true
    else if (matching && (event.type === 'turn/start' || event.type === 'turn/end')) break
    else if (matching && event.type === 'assistant/message' && !event.data.interrupted &&
      !event.data.message.content.some(block => block.type === 'tool-call')) {
      const text = event.data.message.content.filter(block => block.type === 'text').map(block => block.text).join('\n').trim()
      if (text) report = text
    }
  }
  return report
}

async function saveCaptainReport(root: string, archived: TeamState, captain: Agent, english: boolean): Promise<void> {
  const closeout = archived.closeout!
  const report = await requestReport(captain, closeout.report!, english)
  if (!report) return
  await withTeamLock(`team:${root}:${archived.id}`, async () => {
    const current = await readArchivedTeam(root, archived.id)
    if (!current?.closeout || current.createdAt !== archived.createdAt || current.closeout.requestId !== closeout.requestId) return
    current.closeout.report = report
    current.closeout.source = 'captain'
    await writeTeam(join(root, 'archive'), current)
  })
}

export async function forceEndWorkflow(ctx: Context, root: string, teamId: string, captain: Agent, createdAt: number, requestId: string, english: boolean): Promise<TeamState> {
  // Serialize duplicate confirmations without holding the scheduler's team lock during a model turn.
  return withTeamLock(`closeout:${root}:${teamId}`, async () => {
    const live = await readTeam(root, teamId)
    const archived = await readArchivedTeam(root, teamId)
    if (archived?.closeout?.requestId === requestId && archived.createdAt === createdAt && await sessionLeadsTeamAsync(ctx, archived, captain.id)) return archived
    if (!live || live.createdAt !== createdAt || !(await sessionLeadsTeamAsync(ctx, live, captain.id))) throw new Error('当前流程已变化，请重新打开画布')
    await haltTeamWork({ctx, stateRoot:root, teamId, captain, closeout:{requestId, createdAt}})
    const ended = await withTeamLock(`team:${root}:${teamId}`, async () => {
      const fresh = await readTeam(root, teamId)
      if (!fresh?.halted || !fresh.closeout) throw new Error('流程状态已变化，请刷新')
      fresh.closeout.report ??= taskSummary(fresh, english)
      fresh.closeout.source ??= 'snapshot'
      for (const member of fresh.members) {
        member.restoreOnUnarchive ??= member.status !== 'removed'
        member.status = 'removed'
      }
      await writeTeam(root, fresh)
      await recordRetiredMemberIds(root, fresh.members.map(member => member.id))
      await cancelTaskArchive(root, teamId)
      await archiveTeamDir(root, teamId)
      return fresh
    })
    void saveCaptainReport(root, ended, captain, english).catch(error => {
      ctx.logger.warn(`agent-teams: closeout report unavailable for ${teamId}: ${String(error)}`)
    })
    return ended
  })
}
