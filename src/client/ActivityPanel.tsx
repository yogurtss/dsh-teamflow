import { isGateTask } from '../workflow-node-kind.ts'
import { workflowRequest } from './workflow-request.ts'
import { activityStatus } from './activity-status.ts'
import { resolveActivitySession, type ActivitySessionOwner } from './activity-session.ts'
import { WorkflowLocale } from './workflow-i18n.tsx'
import { WorkflowWorkbench } from './WorkflowWorkbench.tsx'
import { flowControlState, flowControlVersion, taskControlState } from './task-control.ts'
import { TaskStateBadge, taskStateNodeClass } from './TaskStateBadge.tsx'
import { QuickMemberEditor } from './QuickMemberEditor.tsx'
import {
  useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore,
} from 'react'
import {
  IconBranchOutline16,
  IconStopFill16, IconWarningOutline16,
  WorkflowIcon,
} from './icons.tsx'
import { Modal } from '@deepseek-ai/dsh-client-ui-primitives'
import { currentSessionId, openWorkflowConversation } from './session-navigation.ts'
import type { ModelDirectory, ModelDirectoryResolver } from '@deepseek-ai/dsh-client-ui-model-selection/client'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type { ObservableSnapshot } from '@deepseek-ai/dsh-client-store'
import type { SessionListState } from '@deepseek-ai/dsh-api-session-controller/client'
import {
  compactDagLayout,
  COMPACT_DAG_NODE_WIDTH,
  COMPACT_DAG_NODE_HEIGHT,
  compactModelLabel,
  dependencyFocusTaskId,
  memberRouteLabel,
  orderDelegationMembers,
  relatedTaskIds,
  taskModelLabel,
  teamIsActive,
  usesParallelTaskGrid,
} from './activity-model.ts'
import {
  ACTIVITY_HALT_URL,
  getActivityMonitorTargetsSnapshot,
  getActivitySnapshotsSnapshot,
  startActivityPolling,
  subscribeActivityMonitorTargets,
  subscribeActivitySnapshots,
  publishWorkflowActivity,
  type ActivityMember,
  type ActivityTask,
  type ActivityTeam,
} from './activity-monitor.ts'
import { ACTION_ART, LEAD_ART, memberArtUrl } from './artwork.ts'
import { StagingPlanEditor } from './StagingPlanEditor.tsx'
import type { AgentTeamsTranslate } from './locales.ts'
import css from './ActivityPanel.module.css'

const CAPTAIN_ASSIGNEE = 'captain'

function formatTaskIds(ids: readonly string[], t: AgentTeamsTranslate): string {
  return ids.join(t('format.listSeparator'))
}

function taskTitle(task: ActivityTask, model: string): string {
  const extras = [
    task.kind,
    task.round === undefined ? undefined : `r${task.round}`,
    task.verdict,
    // Never show a bare pass: the audited verdict may no longer describe the
    // bytes currently on disk (issue #161).
    task.verdictStale === undefined ? undefined : `⚠ ${task.verdictStale}`,
    model === '' ? undefined : model,
  ].filter((item): item is string => item !== undefined)
  return extras.length === 0 ? `${task.id} · ${task.subject}` : `${task.id} · ${task.subject} · ${extras.join(' · ')}`
}

/** Badge/bar coloring key: visual state, widened for terminal statuses. */
function taskTone(state: ActivityTask['state'], status: string): string {
  if (status === 'failed') return 'failed'
  if (status === 'cancelled') return 'cancelled'
  return state
}

function Chevron({ open }: { readonly open: boolean }) {
  return (
    <svg className={css.chevron} data-open={open} width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
      <path d="M3.5 2l3 3-3 3" />
    </svg>
  )
}

function WorkGlyph({ active }: { readonly active: boolean }) {
  return (
    <svg className={css.workGlyph} data-active={active} width="11" height="11" viewBox="0 0 11 11" fill="currentColor" aria-hidden>
      {[[0, 0], [4.2, 0], [8.4, 0], [0, 4.2], [4.2, 4.2], [8.4, 4.2]].map(([x, y], index) => (
        <rect key={`${x}:${y}`} x={x} y={y} width="2.6" height="2.6" rx=".6" style={{ animationDelay: `${index * 0.15}s` }} />
      ))}
    </svg>
  )
}

/** Workflow status card remains visible in the corner while any team exists. */
function CollapsedBadge({ count, onClick, t, team, archived }: {
  readonly count: number
  readonly team: ActivityTeam
  readonly archived?: boolean
  readonly onClick: () => void
  readonly t: AgentTeamsTranslate
}) {
  const status=activityStatus(team,archived)
  const label=t(('activity.state.'+status.state) as Parameters<AgentTeamsTranslate>[0])
  const detail=t('activity.summary',{done:status.completed,total:status.total,running:status.running,review:status.reviews,attention:status.attention})
  const title=[team.name,label,status.total?status.percent+'%':undefined,detail,t('activity.badgeAria',{count})].filter(Boolean).join(' · ')
  return <button type="button" className={css.badge} data-agent-teams-collapsed data-status={status.state} onClick={onClick} aria-label={title} title={title}>
    <span className={css.statusRing} aria-hidden><svg viewBox="0 0 20 20" width="20" height="20"><circle cx="10" cy="10" r="7.5" className={css.ringTrack}/><circle cx="10" cy="10" r="7.5" className={css.ringValue} pathLength="100" strokeDasharray={status.percent+' 100'}/></svg>{status.state==='completed'?<i>✓</i>:status.state==='paused'?<i>Ⅱ</i>:status.attention>0?<i>·</i>:null}</span>
    <span className={css.statusBody}>
      <span className={css.statusHeading}><span>Workflow</span><span aria-hidden>↗</span></span>
      {team.name && <strong className={css.statusTeam}>{team.name}</strong>}
      <span className={css.statusLine}>
        <span className={css.statusLabel}>{label}</span>
        {status.total>0&&<span className={css.statusPercent}>{status.percent}<small>%</small></span>}
        {status.attention>0&&<span className={css.statusCount} aria-hidden>{status.attention>99?'99+':status.attention}</span>}
      </span>
      {status.total>0&&<span className={css.statusDetail}>{detail}</span>}
    </span>
  </button>
}

function memberStateLabel(
  member: ActivityMember,
  tasks: readonly ActivityTask[],
  historic: boolean,
  t: AgentTeamsTranslate,
): string {
  const owned = tasks.filter((task) => task.assignee === member.name)
  if (member.activity === 'working') return t('member.state.working')
  if (owned.some((task) => task.status === 'failed')) return t('member.state.failed')
  if (owned.some((task) => task.state === 'blocked')) return t('member.state.waiting')
  if (owned.length > 0 && owned.every((task) => task.status === 'completed')) return t('member.state.delivered')
  if (member.status === 'removed') return t(historic ? 'member.state.left' : 'member.state.removed')
  if (owned.length > 0) return t('member.state.pending')
  return t('member.state.unassigned')
}

function memberStatusText(
  member: ActivityMember,
  tasks: readonly ActivityTask[],
  t: AgentTeamsTranslate,
): string {
  const owned = tasks.filter((task) => task.assignee === member.name)
  const current = owned.find((task) => task.id === member.currentTask)
  const blocked = owned.find((task) => task.state === 'blocked')
  if (member.activity === 'working' && current !== undefined) {
    const model = taskModelLabel(current, [member])
    return model === ''
      ? t('member.status.executing', { taskId: current.id })
      : t('member.status.executingModel', { taskId: current.id, model })
  }
  if (member.activity === 'working') return t('member.status.working')
  if (blocked !== undefined) {
    const dependency = tasks.find((task) => blocked.dependencies.includes(task.id) && task.state !== 'completed')
    if (dependency !== undefined) {
      return t('member.status.waitingOn', {
        taskId: dependency.id,
        assignee: dependency.assignee || t('task.assignee.unclaimed'),
      })
    }
    return t('member.status.waitingPrerequisite')
  }
  if (member.total === 0) return t('member.status.waitingAssignment')
  if (member.done === member.total) return t('member.status.delivered')
  if (owned.some((task) => task.status === 'failed')) return t('task.detail.failed')
  if (owned.length > 0 && owned.every((task) => task.status === 'completed' || task.status === 'cancelled')) return t('member.status.settled')
  return t(member.activity === 'idle' ? 'member.status.idle' : 'member.status.unknown')
}

function taskSummary(team: ActivityTeam, t: AgentTeamsTranslate, discarded = false): string {
  team = {...team, tasks:team.tasks.filter(task => !task.superseded)}
  const completed = team.tasks.filter((task) => task.status === 'completed')
  const cancelled = team.tasks.filter((task) => task.status === 'cancelled')
  const running = team.tasks.filter((task) => task.state === 'running')
  const claimed = team.tasks.filter((task) => task.state === 'claimed')
  const blocked = team.tasks.filter(task => taskControlState(team,task).checked && taskControlState(team,task).waiting.length > 0)
  const ready = team.tasks.filter(task => taskControlState(team,task).label === 'task.control.queued')
  const reviews = team.tasks.filter(task => taskControlState(team,task).reviewReady)
  const failed = team.tasks.filter((task) => task.status === 'failed')
  if (discarded) return t('task.summary.discarded', { count: team.tasks.length })
  if (team.tasks.length === 0) return t('task.summary.waitingBreakdown')
  if (team.phase === 'staged') return t('task.summary.staged', { count: team.tasks.length })
  if (completed.length === team.tasks.length) return t('task.summary.allDelivered', { count: completed.length })
  if (completed.length + cancelled.length + failed.length === team.tasks.length) {
    return t('task.summary.ended', {
      completed: completed.length,
      cancelled: cancelled.length,
      failed: failed.length,
    })
  }
  if (failed.length > 0 && running.length === 0 && claimed.length === 0 && ready.length === 0 && reviews.length === 0 && blocked.length === 0) {
    return t('task.summary.failedSettled', { count: failed.length })
  }
  if (blocked.length > 0 && running.length > 0) {
    return t('task.summary.blockedAndRunning', {
      tasks: formatTaskIds(blocked.slice(0, 3).map((task) => task.id), t),
      more: blocked.length > 3 ? t('task.summary.more', { count: blocked.length - 3 }) : '',
    })
  }
  if (running.length > 0) return t('task.summary.running', { tasks: formatTaskIds(running.map((task) => task.id), t) })
  if (claimed.length > 0) return t('task.summary.claimed', { tasks: formatTaskIds(claimed.map((task) => task.id), t) })
  if (reviews.length > 0) return t('task.summary.review', { tasks: formatTaskIds(reviews.map(task=>task.id),t) })
  if (ready.length > 0) return t('task.summary.ready', { tasks: formatTaskIds(ready.map((task) => task.id), t) })
  if (blocked.length > 0) return t('task.summary.blocked', { tasks: formatTaskIds(blocked.map((task) => task.id), t) })
  if (team.tasks.some(task => !taskControlState(team,task).terminal && !taskControlState(team,task).checked)) return t('flow.summary.held')
  return t('task.summary.waitingSchedule')
}

function ProgressOverview({ team, t, discarded = false }: { readonly team: ActivityTeam; readonly t: AgentTeamsTranslate; readonly discarded?: boolean }) {
  team = {...team, tasks:team.tasks.filter(task => !task.superseded)}
  const running = discarded ? 0 : team.tasks.filter((task) => task.state === 'running').length
  const claimed = discarded ? 0 : team.tasks.filter((task) => task.state === 'claimed').length
  const blocked = discarded ? 0 : team.tasks.filter(task => taskControlState(team,task).checked && taskControlState(team,task).waiting.length > 0).length
  const held = discarded ? 0 : team.tasks.filter(task => !taskControlState(team,task).terminal && !taskControlState(team,task).checked).length
  const completed = discarded ? 0 : team.tasks.filter((task) => task.status === 'completed').length
  const done = activityStatus(team).state === 'completed'
  const summaryTone = discarded ? 'discarded' : done ? 'completed' : blocked > 0 || team.tasks.some(task => task.status === 'failed' || task.status === 'cancelled') ? 'warning' : 'running'
  return (
    <section className={css.progressOverview} aria-label={t('progress.aria')} data-progress-summary>
      <span className={css.progressTitle}>{t('progress.title')}</span>
      {team.tasks.length > 0 ? (
        <span className={css.progressSegments} aria-hidden>
          {team.tasks.map((task) => <span key={task.id} data-state={discarded ? 'cancelled' : taskTone(task.state, task.status)} />)}
        </span>
      ) : <span className={css.progressEmpty} />}
      <span className={css.progressLegend}>
        <span data-state="running">{t('progress.running', { count: running })}</span>
        {claimed > 0 && <span data-state="claimed">{t('progress.claimed', { count: claimed })}</span>}
        <span data-state="blocked">{t('progress.blocked', { count: blocked })}</span>
        {held > 0 && <span data-state="blocked">{t('progress.held', {count:held})}</span>}
        <span data-state="completed">{t('progress.delivered', { count: completed })}</span>
      </span>
      <span className={css.progressSummary} data-state={summaryTone}>
        <span className={css.progressSummaryDot} />
        <span>{summaryTone === 'completed' ? t('activity.state.completed') : taskSummary(team, t, discarded)}</span>
      </span>
    </section>
  )
}

/** Workspace-only summary of durable completion and the current unread inbox.
 * The snapshot is not a chat transcript: it provides at most five unread
 * captain messages, with no timestamps, so do not imply a complete history.
 */
function WorkspaceSummary({ team, t, discarded }: { readonly team: ActivityTeam; readonly t: AgentTeamsTranslate; readonly discarded: boolean }) {
  const completed = discarded ? 0 : activityStatus(team).completed
  const total = activityStatus(team).total
  return (
    <div className={css.workspaceSummary}>
      <section className={css.completionCard} aria-label={t('progress.aria')}>
        <h3>{t('progress.title')}</h3>
        <div className={css.completionBody}>
          <div className={css.completionRing} role="img" aria-label={t('team.stats.completed', { completed, total })} data-completed={completed} data-total={total}>
            <svg viewBox="0 0 120 120" aria-hidden>
              <circle className={css.ringTrack} cx="60" cy="60" r="51" />
              <circle className={css.ringValue} cx="60" cy="60" r="51" pathLength="100" strokeDasharray={`${total === 0 ? 0 : completed / total * 100} 100`} />
            </svg>
            <span aria-hidden><strong>{completed}<small> / {total}</small></strong><span>{t(discarded ? 'task.status.notRun' : 'workspace.completed')}</span></span>
          </div>
          {total === 0 ? <p className={css.summaryEmpty}>{t('workspace.noTasks')}</p> : <ul className={css.completionTasks} tabIndex={0} aria-label={t('workspace.taskSummary')}>
            {team.tasks.map(task => <li key={task.id} data-state={discarded ? 'cancelled' : taskTone(task.state, task.status)} data-verdict-stale={task.verdictStale === undefined ? undefined : 'true'} title={taskTitle(task, taskModelLabel(task, team.members))}>
              <span className={css.completionDot} aria-hidden>{task.verdictStale !== undefined ? '!' : !discarded && task.status === 'completed' ? '✓' : '·'}</span>
              <span className={css.completionTaskId}>{task.id}</span>
              <span className={css.completionTaskSubject} title={task.subject}>{task.subject}</span>
              <span className={css.completionTaskStatus}>{discarded ? t('task.status.notRun') : task.verdictStale !== undefined ? t('workspace.verdictStale') : t(taskControlState(team, task).label)}</span>
            </li>)}
          </ul>}
        </div>
      </section>
      <section className={css.inboxCard} aria-label={t('workspace.inbox')}>
        <header><h3>{t('workspace.inbox')}</h3><span>{t('workspace.inboxHint')}</span></header>
        {team.captainInbox.length === 0 ? <p className={css.summaryEmpty}>{t('workspace.inboxEmpty')}</p> : <ul className={css.inboxMessages} tabIndex={0} aria-label={t('workspace.inbox')}>
          {team.captainInbox.map((message, index) => {
            const member = team.members.find(candidate => candidate.name === message.from)
            const art = message.from === CAPTAIN_ASSIGNEE ? LEAD_ART : memberArtUrl(message.from, member?.role ?? '')
            return <li key={`${index}:${message.from}`}>
              <img src={art} alt="" aria-hidden />
              <div><strong>{message.from}</strong><p>{message.content}</p></div>
            </li>
          })}
        </ul>}
      </section>
    </div>
  )
}

function DependencyMap({ tasks, members, t, discarded = false, onSelectTask, team, historic = false, onToggle, onOpenTask, controlBusy }: {
  readonly team: ActivityTeam
  readonly historic?: boolean
  readonly controlBusy?: string
  readonly onToggle: (task: ActivityTask, enabled: boolean) => void
  readonly onOpenTask: (task: ActivityTask, review: boolean, rerun?: boolean) => void
  readonly tasks: readonly ActivityTask[]
  readonly members: readonly ActivityMember[]
  readonly t: AgentTeamsTranslate
  readonly discarded?: boolean
  readonly onSelectTask?: (id: string | null) => void
}) {
  const [open, setOpen] = useState(true)
  const [hoverTaskId, setHoverTaskId] = useState<string | null>(null)
  const [keyboardTaskId, setKeyboardTaskId] = useState<string | null>(null)
  const [pinnedTaskId, setPinnedTaskId] = useState<string | null>(null)
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const focusedTaskId = dependencyFocusTaskId(pinnedTaskId, keyboardTaskId, hoverTaskId)
  const nodeWidth = COMPACT_DAG_NODE_WIDTH
  const nodeHeight = COMPACT_DAG_NODE_HEIGHT
  const layout = useMemo(() => compactDagLayout(tasks), [tasks])
  const parallel = useMemo(() => usesParallelTaskGrid(tasks), [tasks])
  const related = useMemo(
    () => focusedTaskId === null ? null : relatedTaskIds(focusedTaskId, tasks),
    [focusedTaskId, tasks],
  )
  const scheduleHover = (id: string | null): void => {
    if (hoverTimer.current !== null) {
      clearTimeout(hoverTimer.current)
      hoverTimer.current = null
    }
    if (id === null) {
      setHoverTaskId(null)
      return
    }
    hoverTimer.current = setTimeout(() => {
      hoverTimer.current = null
      setHoverTaskId(id)
    }, 180)
  }
  useEffect(() => () => {
    if (hoverTimer.current !== null) clearTimeout(hoverTimer.current)
  }, [])
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') { setPinnedTaskId(null); onSelectTask?.(null) }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => { window.removeEventListener('keydown', onKeyDown) }
  }, [onSelectTask])
  if (tasks.length === 0) return null
  const fallbackTask = tasks.find((task) => task.state === 'blocked')
    ?? tasks.find((task) => task.state === 'running')
    ?? tasks.find((task) => task.state === 'claimed')
    ?? tasks[0]!
  const detailTask = tasks.find((task) => task.id === focusedTaskId) ?? fallbackTask
  const control = taskControlState(team, detailTask, historic)
  const detailModel = taskModelLabel(detailTask, members)
  const waitingOn = detailTask.dependencies.filter((dependency) => (
    tasks.find((task) => task.id === dependency)?.status !== 'completed'
  ))
  const dependents = tasks.filter((task) => task.dependencies.includes(detailTask.id))
  return (
    <section className={css.dependencySection} aria-label={t('dependency.aria')} data-dependency-map>
      <header className={css.sectionHead}>
        <button type="button" className={css.sectionToggleTitle} onClick={() => { setOpen((current) => !current) }} aria-expanded={open}>
          <Chevron open={open} /><IconBranchOutline16 /> {t(parallel ? 'dependency.parallel' : 'dependency.title')}
        </button>
        <span className={css.sectionHint}>{pinnedTaskId === null
          ? t(parallel ? 'dependency.hint.parallel' : 'workspace.dependencies')
          : t('dependency.hint.pinned', { taskId: pinnedTaskId })}</span>
      </header>
      {open && (
        <>
          <div className={css.dagViewport}>
            <div
              className={css.dagCanvas}
              data-layout={parallel ? 'parallel' : 'dependency'}
              style={parallel ? undefined : { width: layout.width, height: layout.height }}
            >
              {!parallel && <svg className={css.dagEdges} width={layout.width} height={layout.height} aria-hidden>
                {layout.edges.map((edge) => {
                  const active = related !== null && related.has(edge.from) && related.has(edge.to)
                  return <path key={`${edge.from}:${edge.to}`} d={edge.path} data-active={active} data-dimmed={related !== null && !active} />
                })}
              </svg>}
              {layout.nodes.map(({ task, x, y }) => {
                const model = taskModelLabel(task, members)
                const gate = isGateTask(task, team.workflow?.loops)
                const aiReview = (team.workflow?.loops.find(loop => loop.gateId === task.id)?.mode ?? task.checkpoint?.mode) === 'ai'
                const control = taskControlState(team,task,historic)
                return (
                  <button
                    key={task.id}
                    type="button"
                    aria-pressed={pinnedTaskId === task.id}
                    onClick={() => { if (gate) { onOpenTask(task, false); return }; const next = pinnedTaskId === task.id ? null : task.id; setPinnedTaskId(next); onSelectTask?.(next) }}
                    className={`${css.dagNode} ${taskStateNodeClass}`}
                    data-lifecycle={discarded ? 'notRun' : task.verdictStale ? 'stale' : control.visual}
                    style={parallel
                      ? { height: nodeHeight }
                      : { left: x, top: y, width: nodeWidth, height: nodeHeight }}
                    data-task-id={task.id}
                    data-gate={gate || undefined}
                    data-checkpoint={!!task.checkpoint || undefined}
                    data-review-ready={control.reviewReady || undefined}
                    data-state={discarded ? 'cancelled' : taskTone(task.state, task.status)}
                    data-verdict-stale={task.verdictStale === undefined ? undefined : 'true'}
                    data-task-model={model || undefined}
                    data-focused={related?.has(task.id) ?? false}
                    data-dimmed={related !== null && !related.has(task.id)}
                    title={`${taskTitle(task, model)} · ${t(control.label)}`}
                    onMouseEnter={() => { scheduleHover(task.id) }}
                    onMouseLeave={() => { scheduleHover(null) }}
                    onFocus={() => { setKeyboardTaskId(task.id) }}
                    onBlur={() => { setKeyboardTaskId(null) }}
                  >
                    {gate && <svg className={css.dagGateShape} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M1 50 L50 1 L99 50 L50 99 Z" /></svg>}
                    <span className={css.dagNodeHead}><span className={css.dagNodeDot} />{task.id}{task.checkpoint ? <span className={css.reviewKind} title={t('task.control.round',{round:task.checkpoint.round})}><WorkflowIcon name={isGateTask(task, team.workflow?.loops) ? 'gate' : 'acceptance'} /> {t(aiReview ? 'task.control.ai' : 'task.control.human')}</span> : <span className={css.dagOwner}>{task.assignee || t('task.assignee.unclaimed')}</span>}</span>
                    <span className={css.dagNodeLabel}>
                      {task.subject}
                    </span>
                    <TaskStateBadge control={control} t={t} className={css.dagState} discarded={discarded} stale={!!task.verdictStale} detail={task.status === 'claimed' ? t('task.control.claimedHint') : undefined} />
                    {task.state === 'running' && (
                      <span className={css.dagRunningState} aria-label={t('task.runningAria')}>
                        <WorkGlyph active />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
          <section className={css.taskDetail} data-task-detail={detailTask.id}>
            <span className={css.taskDetailHead}>
              <span className={css.taskDetailId}>{detailTask.id}</span>
              <span className={css.taskDetailSubject} title={detailTask.subject}>{detailTask.subject}</span>
              <span className={css.taskDetailBadge} data-verdict-stale={detailTask.verdictStale ? 'true' : undefined} data-review-ready={control.reviewReady || undefined} data-state={discarded ? 'cancelled' : taskTone(detailTask.state, detailTask.status)}>
                <span aria-hidden="true">{detailTask.verdictStale ? '!' : detailTask.status === 'completed' ? '✓' : detailTask.status === 'failed' ? '!' : control.reviewReady ? '◇' : '•'} </span>
                {discarded ? t('task.status.notRun') : t(control.label)}
              </span>
            </span>
            <span className={css.taskDetailLine}>
              {detailTask.checkpoint ? t('task.assignee.human') : detailTask.assignee || t('task.assignee.unclaimed')}
              {detailModel !== '' && <span className={css.taskDetailModel} data-task-model={detailModel}> · {t('task.model', { model: detailModel })}</span>}
              {detailTask.checkpoint && <span className={css.reviewKind}> · {t('task.control.round',{round:detailTask.checkpoint.round})}</span>}
            </span>
            <div className={css.taskDetailControls}>
              {(!control.terminal || control.canRerun || control.retryLoopTask) && <button type="button"
                data-task-action={control.canRerun ? 'rerun' : control.stopping ? 'retry' : control.queued ? 'dequeue' : control.checked ? 'pause' : 'play'}
                data-rerun-action={control.canRerun || undefined}
                data-running={!control.stopping && detailTask.status === 'in_progress' || undefined}
                aria-label={control.canRerun ? t('task.control.rerunTask',{task:detailTask.subject}) : `${t(control.actionLabel)} · ${detailTask.subject}`}
                className={css.taskPlayback}
                disabled={!control.canRerun && control.disabled || !!controlBusy}
                title={t(control.canRerun ? 'task.control.rerunHint' : control.disabled || control.stopping ? control.label : 'task.control.hint')}
                onClick={() => control.canRerun ? onOpenTask(detailTask,false,true) : onToggle(detailTask,control.stopping ? false : !control.checked)}>
                <svg className={css.taskPlaybackIcon} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                  {control.queued ? <path d="M3 3h10v10H3z" /> : control.checked && !control.canRerun ? <path d="M4 3h3v10H4zm5 0h3v10H9z" /> : <path d="M4 2.5v11l9-5.5z" />}
                </svg>
                {t(control.canRerun ? 'task.control.rerun' : control.disabled ? control.label : control.actionLabel)}
              </button>}
              <button type="button" data-review-action={control.reviewReady || undefined} disabled={!!controlBusy} onClick={() => onOpenTask(detailTask,control.reviewReady)}><WorkflowIcon name={control.reviewReady ? isGateTask(detailTask, team.workflow?.loops) ? 'gate' : 'acceptance' : 'properties'} />{t(control.reviewReady ? 'task.control.review' : 'task.control.properties')}</button>
            </div>
            {!control.terminal && waitingOn.length > 0 && <p className={css.taskControlHint}>{t('task.detail.waitingOn',{tasks:formatTaskIds(waitingOn,t)})}</p>}
            {detailTask.checkpoint?.note && <span className={css.reviewNote}>{detailTask.checkpoint.note}</span>}
            {detailTask.description && <p className={css.taskDetailDescription} title={detailTask.description}>{detailTask.description}</p>}
            <details key={detailTask.id} className={css.taskDetailMore}>
              <summary>{t('task.detail.more')}</summary>
              <span className={css.taskDetailMeta}>{dependents.length === 0 ? t('task.detail.noDownstream') : t('task.detail.unlocks',{tasks:formatTaskIds(dependents.map(task=>task.id),t)})}</span>
              {!control.terminal && !control.disabled && <p className={css.taskControlHint}>{t('task.control.hint')}</p>}
              {control.canRerun && <p className={css.taskControlHint}>{t('task.control.rerunHint')}</p>}
            </details>
          </section>
        </>
      )}
    </section>
  )
}

function LocalizedTeamSection({ team, modelDirectory, onContinuePlanning, onDiscarded, onNavigate, t, historic = false }: {
  readonly team: ActivityTeam
  readonly modelDirectory?: ModelDirectory
  readonly onContinuePlanning?: () => void
  readonly onDiscarded?: () => void
  /** Navigate to a member transcript. */
  readonly onNavigate: (parentId: SessionId, childId: SessionId) => void
  readonly t: AgentTeamsTranslate
  readonly historic?: boolean
}) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [controlBusy,setControlBusy] = useState<string>()
  const controlPending = useRef(false)
  const [controlError,setControlError] = useState('')
  const [taskEntry,setTaskEntry] = useState<{taskId:string;review:boolean;rerun?:boolean}>()
  async function toggleTask(task: ActivityTask, enabled: boolean): Promise<void> {
    if (controlPending.current || taskControlState(team,task,historic).disabled) return
    controlPending.current = true; setControlBusy(task.id); setControlError('')
    try {
      const value = await workflowRequest<{activity?:ActivityTeam}>({action:'set_task_enabled',sessionId:team.captainSessionId,teamId:team.teamId,taskId:task.id,enabled,updatedAt:task.updatedAt})
      if (!value.activity) throw new Error(t('task.control.failed'))
      publishWorkflowActivity(value.activity)
    } catch (error) { setControlError(error instanceof Error ? error.message : t('task.control.failed')) }
    finally { controlPending.current = false; setControlBusy(undefined) }
  }
  const flow = flowControlState(team)
  async function toggleFlow(enabled: boolean): Promise<void> {
    if (controlPending.current) return
    controlPending.current = true; setControlBusy('flow'); setControlError('')
    try {
      const value = await workflowRequest<{activity?:ActivityTeam; skipped?:string[]}>({action:team.phase === 'staged' ? 'start' : 'set_flow_enabled',sessionId:team.captainSessionId,teamId:team.teamId,enabled,version:flowControlVersion(team)})
      if (value.skipped?.length) setControlError(value.skipped.join('\n'))
      if (!value.activity) throw new Error(t('task.control.failed'))
      publishWorkflowActivity(value.activity)
    } catch (error) { setControlError(error instanceof Error ? error.message : t('task.control.failed')) }
    finally { controlPending.current = false; setControlBusy(undefined) }
  }
  const [editingMember, setEditingMember] = useState<string>()
  const selectedAssignee = team.tasks.find(task => task.id === selectedTaskId)?.assignee
  const [membersOpen, setMembersOpen] = useState(true)
  const [stopOpen, setStopOpen] = useState(false)
  const [stopping, setStopping] = useState(false)
  const [stopError, setStopError] = useState('')
  const discarded = historic && team.phase === 'staged'
  const stopped = !historic && team.halted === true
  const busyCount = team.members.filter((member) => member.activity === 'working').length
  const assignedCount = team.tasks.filter((task) => task.assignee !== '' && task.assignee !== CAPTAIN_ASSIGNEE).length
  const captainOwned = team.tasks.filter((task) => task.assignee === CAPTAIN_ASSIGNEE
    && task.status !== 'completed' && task.status !== 'failed' && task.status !== 'cancelled')
  const captainBusy = captainOwned.length > 0
  const captainTaskIds = formatTaskIds(captainOwned.map((task) => task.id), t)
  const {completed:completedCount,total:progressTotal,state:progressState} = activityStatus(team)
  const allCompleted = progressState === 'completed'
  const allSettled = team.tasks.length > 0 && team.tasks.every((task) => (
    task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled'
  ))
  const unfinishedCount = team.tasks.filter((task) => (
    task.status !== 'completed' && task.status !== 'failed' && task.status !== 'cancelled'
  )).length
  const canStop = !historic && team.phase === 'running' && team.halted !== true && teamIsActive(team)
  const stopTeam = async (): Promise<void> => {
    if (stopping) return
    setStopping(true)
    setStopError('')
    try {
      const response = await fetch(ACTIVITY_HALT_URL, {
        method: 'POST',
        cache: 'no-store',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId: team.captainSessionId, teamId: team.teamId }),
      })
      if (!response.ok) {
        let message = t('team.stopRequestFailed')
        try {
          const body = await response.json() as { error?: unknown }
          if (typeof body.error === 'string' && body.error.trim() !== '') message = body.error
        } catch {}
        throw new Error(message)
      }
      setStopOpen(false)
    } catch (error: unknown) {
      setStopError(t('team.stopFailed', { message: error instanceof Error ? error.message : String(error) }))
    } finally {
      setStopping(false)
    }
  }
  return (
    <>
      <section className={css.team} data-team-id={team.teamId} data-workspace-team>
        <header className={css.teamHead}>
          <span className={css.teamName} title={team.name}>{team.name}</span>
          {historic && <span className={css.historicPill}>{t(discarded ? 'team.discarded' : 'team.ended')}</span>}
          {stopped && <span className={css.historicPill}>{t('team.stopped')}</span>}
          <span className={css.teamStats}>
            <span data-stat="members">{t('team.stats.members', { count: team.members.length })}</span>
            <span data-stat="tasks">{t('team.stats.completed', { completed: completedCount, total: progressTotal })}</span>
            <span data-stat="messages">{t('team.stats.messages', { count: team.messageCount })}</span>
          </span>
          {canStop && (
            <button
              type="button"
              className={css.teamStopButton}
              aria-label={t('team.stop')}
              title={t('team.stop')}
              onClick={() => { setStopError(''); setStopOpen(true) }}
            >
              <IconStopFill16 />
            </button>
          )}
        </header>

        {!historic && !team.halted && <div className={css.taskDetailControls} title={t('flow.control.hint')} data-flow-controls>
          <button type="button" disabled={!!controlBusy || !(team.phase === 'staged' ? team.tasks.length > 0 : flow.canStart)} onClick={() => void toggleFlow(true)}>{t('flow.control.start')}</button>
          <button type="button" disabled={!!controlBusy || !flow.canPause} onClick={() => void toggleFlow(false)}>{t('flow.control.pause')}</button>
        </div>}
        {team.phase === 'staged' && !team.workflowEnabled && !historic && modelDirectory !== undefined && onContinuePlanning !== undefined && onDiscarded !== undefined && (
          <StagingPlanEditor
            team={team}
            modelDirectory={modelDirectory}
            onContinuePlanning={onContinuePlanning}
            onDiscarded={onDiscarded}
            t={t}
          />
        )}

      <section className={css.delegationSection} aria-label={t('delegation.aria')} data-delegation-map>
        <div className={css.captainNode}>
          <span className={css.captainAvatar}>
            <img className={css.leadAvatar} src={LEAD_ART} alt="" aria-hidden />
          </span>
          <span className={css.captainInfo}>
            <span className={css.captainLine}>
              <span className={css.captainName}>{t('captain.name')}</span>
              <span className={css.captainRole}>{t('captain.role')}</span>
            </span>
            <span className={css.captainSummary}>{discarded
              ? t('captain.summary.discarded', { tasks: team.tasks.length, members: team.members.length })
              : captainBusy
                ? t('captain.summary.withTakeover', { tasks: assignedCount, captainTasks: captainTaskIds })
              : team.phase === 'staged'
                ? t(team.planReviewState === 'awaiting_feedback'
                  ? 'captain.summary.awaitingFeedback'
                  : 'captain.summary.staged', { tasks: team.tasks.length, members: team.members.length })
                : t('captain.summary', { tasks: assignedCount, members: team.members.length })}</span>
          </span>
          <span className={css.captainState} data-busy={captainBusy || busyCount > 0}>
            <WorkGlyph active={captainBusy || busyCount > 0} />
            {discarded
              ? t('captain.state.discarded')
              : captainBusy
                ? t('captain.state.takeover', { tasks: captainTaskIds })
              : team.phase === 'staged'
                ? t(team.planReviewState === 'awaiting_feedback'
                  ? 'captain.state.awaitingFeedback'
                  : 'captain.state.staged')
              : busyCount > 0
                ? t('captain.state.working', { count: busyCount })
                : t(allCompleted
                  ? 'captain.state.collected'
                  : allSettled
                    ? 'captain.state.settled'
                    : 'captain.state.waiting')}
          </span>
        </div>

        <ProgressOverview team={team} t={t} discarded={discarded} />

        {(() => {
          const orderedMembers = orderDelegationMembers(team.members, team.tasks)
          const runningMembers = orderedMembers.filter((member) => (
            member.activity === 'working' || member.status === 'working'
            || team.tasks.some((task) => task.assignee === member.name
              && (task.status === 'pending' || task.status === 'claimed' || task.status === 'in_progress'))
          ))
          const visibleMembers = membersOpen ? orderedMembers : runningMembers
          const hiddenFinishedCount = orderedMembers.length - visibleMembers.length
          const expandLabel = membersOpen
            ? t('members.collapse')
            : hiddenFinishedCount > 0
              ? t('members.expandFinished', { count: hiddenFinishedCount })
              : t('members.expand')
          return (
            <>
              <button type="button" className={css.membersToggle} onClick={() => { setMembersOpen((current) => !current) }} aria-expanded={membersOpen} data-members-toggle>
                <span><Chevron open={membersOpen} />{t('members.toggle', { count: team.members.length })}</span>
                <span>{expandLabel}</span>
              </button>

              {(membersOpen || visibleMembers.length > 0) && <div className={css.delegationTree}>
                {team.members.length === 0 && <span className={css.emptyHint}>{t('members.empty')}</span>}
                {visibleMembers.map((member) => {
                  const owned = team.tasks.filter((task) => task.assignee === member.name)
                  const memberModel = memberRouteLabel(member)
                  return (
              <div key={member.id || member.name} className={css.memberBlock} data-activity={member.activity} data-selected-member={(editingMember === member.name || selectedAssignee === member.name) || undefined}>
                <span className={css.memberBranch} aria-hidden><span /></span>
                <button
                  type="button"
                  className={css.memberRow}
                  data-activity={member.activity}
                  onClick={() => {
                    if (!historic && modelDirectory) {
                      setEditingMember(value => value === member.name ? undefined : member.name)
                    } else if (member.id !== '') {
                      onNavigate(team.captainSessionId as SessionId, member.id as SessionId)
                    }
                  }}
                >
                  <span className={css.memberAvatar} data-unread={member.unread > 0}>
                    <img className={css.memberArt} src={memberArtUrl(member.name, member.role)} alt="" aria-hidden />
                    <img className={css.stateArt} data-activity={member.activity} src={ACTION_ART[member.activity]} alt="" aria-hidden />
                  </span>
                  <span className={css.memberInfo}>
                    <span className={css.memberLine}>
                      <span className={css.memberName}>{member.name}</span>
                      {member.role !== '' && <span className={css.memberRole}>{member.role}</span>}
                      {/* Inline member model badge: compact visible label, full route in
                          title/aria-label (accessible tooltip) and the data-member-model
                          DOM probe; noninteractive span, no tab stop. */}
                      {memberModel !== '' && (
                        <span className={css.memberModel} role="img" data-member-model={memberModel} title={memberModel} aria-label={memberModel}>
                          {compactModelLabel(memberModel)}
                        </span>
                      )}
                      <span className={css.memberState} data-activity={member.activity}>
                        <WorkGlyph active={member.activity === 'working'} />
                        {discarded
                          ? t('member.state.notCreated')
                          : stopped
                            ? t('member.state.stopped')
                            : team.phase === 'staged'
                              ? t('member.state.staged')
                              : memberStateLabel(member, team.tasks, historic, t)}
                      </span>
                    </span>
                    <span className={css.memberStatusLine}>{discarded
                      ? t('member.status.discarded')
                      : stopped
                        ? t('member.status.stopped')
                        : team.phase === 'staged'
                          ? t('member.status.staged')
                      : historic && owned.length > 0 && owned.every((task) => (
                        task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled'
                      ))
                        ? t('member.status.settled')
                      : memberStatusText(member, team.tasks, t)}</span>
                  </span>
                  <span className={css.memberCount}>{member.done}/{member.total}</span>
                </button>
                {editingMember === member.name && modelDirectory && !historic && <QuickMemberEditor key={member.name} team={team} member={member} directory={modelDirectory} t={t} close={() => setEditingMember(undefined)} onRerun={taskId=>setTaskEntry({taskId,review:false,rerun:true})} />}
                {!historic && modelDirectory && member.id !== '' && <button type="button" className={css.quickTranscript} onClick={() => onNavigate(team.captainSessionId as SessionId, member.id as SessionId)}>{t('workflow.executionChat')}</button>}
                <div className={css.assignmentLine}>
                  <span className={css.assignmentLabel}>{t(discarded
                    ? 'assignment.discarded'
                    : team.phase === 'staged'
                      ? 'assignment.staged'
                      : 'assignment.label')}</span>
                  <span className={css.assignmentTasks}>
                    {owned.length === 0
                      ? <span className={css.taskEmpty}>{t('assignment.empty')}</span>
                      : owned.map((task) => {
                          const model = taskModelLabel(task, team.members)
                          const shortModel = compactModelLabel(model)
                          return (
                            <span
                              key={task.id}
                              className={css.assignmentChip}
                              data-state={discarded ? 'cancelled' : taskTone(task.state, task.status)}
                              data-verdict-stale={task.verdictStale === undefined ? undefined : 'true'}
                              data-task-model={model || undefined}
                              title={taskTitle(task, model)}
                            >
                              {task.state === 'running' && shortModel !== '' ? `${task.id} · ${shortModel}` : task.id}
                            </span>
                          )
                        })}
                  </span>
                </div>
                  </div>
                )
              })}
                </div>}
            </>
          )
        })()}
      </section>

      {controlBusy && <p role="status" className={css.taskControlHint}>{t('task.control.saving')}</p>}
      {controlError && <p role="alert" className={css.stopModalError}>{controlError}</p>}
      <DependencyMap team={team} tasks={team.tasks} members={team.members} t={t} historic={historic} discarded={discarded} onSelectTask={setSelectedTaskId} controlBusy={controlBusy} onToggle={(task,enabled)=>void toggleTask(task,enabled)} onOpenTask={(task,review,rerun)=>setTaskEntry({taskId:task.id,review,rerun})} />
      {taskEntry && <WorkflowWorkbench key={taskEntry.taskId} sessionId={team.captainSessionId} teamId={team.teamId} archived={historic} entryTarget={taskEntry} onClose={()=>setTaskEntry(undefined)} modelDirectory={modelDirectory} t={t} openExecution={(id,parent)=>onNavigate((parent??team.captainSessionId) as SessionId,id as SessionId)} openConversation={id=>openWorkflowConversation(onNavigate,id as SessionId)} />}
      <WorkspaceSummary team={team} t={t} discarded={discarded} />
      </section>
      <Modal
        open={stopOpen}
        onClose={() => { if (!stopping) setStopOpen(false) }}
        title={t('team.stopTitle', { team: team.name })}
        closeLabel={t('plan.cancel')}
        description={t('team.stopDescription', { tasks: unfinishedCount, members: busyCount })}
        footer={(
          <span className={css.stopModalActions}>
            <button type="button" disabled={stopping} onClick={() => { setStopOpen(false) }}>{t('team.stopCancel')}</button>
            <button type="button" data-danger disabled={stopping} onClick={() => { void stopTeam() }}>
              <IconStopFill16 />
              {stopping ? t('team.stopping') : t('team.stopConfirm')}
            </button>
          </span>
        )}
      >
        {stopError !== '' && <p className={css.stopModalError} role="alert"><IconWarningOutline16 />{stopError}</p>}
      </Modal>
    </>
  )
}

/** Shared session inputs for the canvas shortcut and blank-session entry. */
export type ActivityPanelProps = {
  readonly onMonitorStatus?: (sessionId: SessionId, status: 'loading' | 'ready' | 'error') => void
  readonly conversationVisible?: boolean
  readonly sessionsList: ObservableSnapshot<SessionListState>
  readonly modelDirectories: ModelDirectoryResolver
  readonly openMember: (parentId: SessionId, childId: SessionId) => void | Promise<void>
} & PropsLocale<'agentTeams'>

export function ActivityPanel({ sessionsList, modelDirectories, openMember, t, conversationVisible = true, onMonitorStatus }: ActivityPanelProps) {
  const [canvasEntry, setCanvasEntry] = useState<{ owner: SessionId; teamId: string; archived: boolean }>()
  const selectedSession = currentSessionId(useSyncExternalStore(
    sessionsList.subscribe,
    sessionsList.getSnapshot,
  ))
  const [sessionOwner,setSessionOwner]=useState<ActivitySessionOwner>()
  const current=(sessionOwner && sessionOwner.sessionId===selectedSession ? sessionOwner.owner : selectedSession) as SessionId|undefined
  useEffect(()=>{
    if(!selectedSession)return
    const controller=new AbortController();let active=true
    void resolveActivitySession(selectedSession,controller.signal).then(result=>{
      if(!active)return
      if(result.activity)publishWorkflowActivity(result.activity)
      setSessionOwner(result)
    }).catch(()=>{ /* Keep the selected-session boundary when discovery is unavailable. */ })
    return()=>{active=false;controller.abort()}
  },[selectedSession])
  const monitorTargets = useSyncExternalStore(
    subscribeActivityMonitorTargets,
    getActivityMonitorTargetsSnapshot,
  )
  const { teams, archivedTeams } = useSyncExternalStore(
    subscribeActivitySnapshots,
    getActivitySnapshotsSnapshot,
  )
  const currentTargets = useMemo(
    () => current === undefined ? [] : monitorTargets.filter((target) => target.sessionId === current),
    [current, monitorTargets],
  )
  useLayoutEffect(() => {
    setCanvasEntry(entry => entry?.owner === current ? entry : undefined)
  }, [current])

  useEffect(() => {
    if (current === undefined) return
    // Cards keep live teams on the normal cadence. The current-session scope
    // also performs one cold-start discovery pass so archived/cardless teams
    // survive a browser or `dsh web` restart.
    onMonitorStatus?.(current, 'loading')
    const controller = startActivityPolling(currentTargets, { discoverySessionId: current, onStatus: status => onMonitorStatus?.(current, status) })
    return () => controller.stop()
  }, [current, currentTargets, onMonitorStatus])

  const visibleTeams = useMemo(
    // No current session (initial load): show nothing until one is picked,
    // so the shortcut never points to another session.
    () => (current === undefined ? [] : teams.filter((team) => team.captainSessionId === current)),
    [teams, current],
  )
  const visibleArchived = useMemo(
    () => (current === undefined ? [] : archivedTeams.filter((team) =>
      team.captainSessionId === current && !teams.some((live) =>
        live.captainSessionId === current && live.teamId === team.teamId,
      ),
    )),
    [archivedTeams, current, teams],
  )
  const team = visibleTeams[0] ?? visibleArchived[0]
  if (!conversationVisible || !current) return null
  return (
    <>
      {team && <CollapsedBadge count={visibleTeams.length + visibleArchived.length}
        team={team} archived={!visibleTeams.length} t={t}
        onClick={() => setCanvasEntry({ owner: current, teamId: team.teamId, archived: !visibleTeams.length })} />}
      {canvasEntry && canvasEntry.owner === current && <WorkflowWorkbench
        key={canvasEntry.owner + ':' + canvasEntry.teamId} initiallyOpen sessionId={canvasEntry.owner}
        teamId={canvasEntry.teamId} archived={canvasEntry.archived} t={t}
        modelDirectory={modelDirectories.directoryFor(canvasEntry.owner)}
        openExecution={(id, parent) => openMember((parent ?? canvasEntry.owner) as SessionId, id as SessionId)}
        onClose={() => setCanvasEntry(undefined)} />}
    </>
  )
}

export function TeamSection(props: Parameters<typeof LocalizedTeamSection>[0]) {
  return <WorkflowLocale t={props.t}><LocalizedTeamSection {...props}/></WorkflowLocale>
}
