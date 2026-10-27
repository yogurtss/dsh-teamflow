/** Inline member configuration in the activity list, saved via the same workflow API as the canvas. */
import { useEffect, useState } from 'react'
import type { ModelDirectory } from '@deepseek-ai/dsh-client-ui-model-selection/client'
import type { ActivityMember, ActivityTeam } from './activity-monitor.ts'
import type { AgentTeamsTranslate } from './locales.ts'
import { StagedModelPicker } from './StagingPlanEditor.tsx'
import css from './ActivityPanel.module.css'
import type { TeamState, TeamTask } from '../types.ts'
import type { WorkflowOperation } from '../workflow-types.ts'
import { TaskRerunPicker } from './TaskRerunPicker.tsx'
import { rerunnableTasks } from '../task-rerun.ts'

type Details = { base: string; team: TeamState }
async function request(payload: Record<string, unknown>): Promise<Details> {
  const response = await fetch('/plugins/dsh-agent-teams/workflow', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
  const value = await response.json() as Details & { error?: string }
  if (!response.ok) throw new Error(value.error ?? `HTTP ${response.status}`)
  return value
}
export function QuickMemberEditor({ team, member, directory, t, close }: { team: ActivityTeam; member: ActivityMember; directory: ModelDirectory; t: AgentTeamsTranslate; close: () => void }) {
  const [base, setBase] = useState('')
  const [role, setRole] = useState(member.role)
  const [route, setRoute] = useState({ provider: '', model: '', reasoningEffort: '' })
  const [routeChanged, setRouteChanged] = useState(false)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const [tasks, setTasks] = useState<TeamTask[]>([])
  const [rerunId, setRerunId] = useState('')
  const [instructions, setInstructions] = useState('')
  useEffect(() => {
    let live = true
    setBusy(true); setError('')
    void request({ action: 'state', sessionId: team.captainSessionId, teamId: team.teamId }).then(result => {
      const current = result.team.members.find(item => item.name === member.name)
      if (!current) throw new Error('成员不存在')
      if (live) { setBase(result.base); setRole(current.role ?? ''); setRoute({ provider: current.provider ?? '', model: current.model ?? '', reasoningEffort: current.reasoningEffort ?? '' }); setRouteChanged(false); setTasks(result.team.tasks); setRerunId(rerunnableTasks(result.team.tasks, member.name).at(-1)?.id ?? '') }
    }).catch(err => { if (live) setError(err instanceof Error ? err.message : String(err)) }).finally(() => { if (live) setBusy(false) })
    return () => { live = false }
  }, [team.captainSessionId, team.teamId, member.name])
  async function save(rerun = false): Promise<void> {
    setBusy(true); setError('')
    try {
      const operations: WorkflowOperation[] = [{ action: 'update_member', name: member.name, role, ...(routeChanged ? { ...route, reasoningEffort: route.reasoningEffort || 'default' } : {}) }]
      if (rerun) {
        if (!rerunId) throw new Error('请选择重跑任务')
        operations.push({ action: 'rerun_task', id: rerunId, instructions })
      }
      await request({ action: 'edit', sessionId: team.captainSessionId, teamId: team.teamId, title: `调整 ${member.name} 的配置${rerun ? '并单独重跑任务' : ''}`, base, operations })
      close()
    } catch (err) { setError(err instanceof Error ? err.message : String(err)) } finally { setBusy(false) }
  }
  return <form className={css.quickMember} aria-label={`配置 ${member.name}`} onSubmit={event => { event.preventDefault(); void save((event.nativeEvent as SubmitEvent).submitter?.getAttribute('data-rerun') === 'true') }}>
    <strong>配置 · {member.name}</strong>
    <StagedModelPicker directory={directory} t={t} {...route} busy={busy || !base} onChange={value => { setRoute(value); setRouteChanged(true) }} />
    <label>职责<textarea value={role} disabled={busy || !base} onChange={event => setRole(event.target.value)} /></label>
    <TaskRerunPicker tasks={tasks} member={member.name} taskId={rerunId} instructions={instructions} disabled={busy || !base} onTask={setRerunId} onInstructions={setInstructions} />
    {error && <p role="alert">{error}</p>}
    <div><button type="submit" disabled={busy || !base}>保存</button>{rerunId && <button type="submit" data-rerun="true" disabled={busy || !base}>保存并仅重跑所选任务</button>}<button type="button" disabled={busy} onClick={close}>取消</button></div>
  </form>
}
