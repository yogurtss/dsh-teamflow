/** Native workspace content; discovery remains mounted independently of tab lifetime. */
import { useEffect, useState, useSyncExternalStore } from 'react'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { ISidebarRight } from '@deepseek-ai/dsh-client-ui-sidebar-right/client'
import { ActivityPanel, TeamSection, historicCardTeam, type ActivityPanelProps } from './ActivityPanel.tsx'
import { openWorkflowConversation } from './session-navigation.ts'
import { getActivitySnapshotsSnapshot, startActivityPolling, subscribeActivitySnapshots } from './activity-monitor.ts'
import type { WorkspaceActivityState } from './workspace-state.ts'
import { LEAD_ART } from './artwork.ts'
import css from './WorkspaceActivity.module.css'
import { WorkflowHistory } from './WorkflowHistory.tsx'
import { WorkflowWorkbench } from './WorkflowWorkbench.tsx'

export const TEAM_TAB_KIND = 'agent-teams'
export const TEAM_TAB_ID = '@yogurtss/dsh-teamflow/activity'

/** Optional host integration tracks whether the host renders durable turn-tail cards. */
export function createWorkspaceBridge() {
  let sidebar: ISidebarRight | undefined
  const listeners = new Set<() => void>()
  return {
    getSnapshot: () => sidebar,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } },
    set(value: ISidebarRight | undefined) { sidebar = value; for (const listener of listeners) listener() },
  }
}

/** The activity dot is the primary monitor on every host; native tabs are supplementary. */
export function ActivitySurface({ state, ...props }: ActivityPanelProps & {
  state: WorkspaceActivityState
}) {
  return <ActivityPanel {...props} onMonitorStatus={state.status} onRememberTeam={state.remember} />
}

export type WorkspaceActivityProps = PropsRuntime<'sidebar.right.pane.tab'> & PropsLocale<'agentTeams'> & {
  state: WorkspaceActivityState
  modelDirectories: ActivityPanelProps['modelDirectories']
  openMember: ActivityPanelProps['openMember']
  openContext?: () => void
}

export function WorkspaceActivity({ sessionId, useTabInfo, t, state, modelDirectories, openMember, openContext }: WorkspaceActivityProps) {
  const { tab } = useTabInfo()
  const snapshots = useSyncExternalStore(subscribeActivitySnapshots, getActivitySnapshotsSnapshot)
  const local = useSyncExternalStore(state.subscribe, state.getSnapshot)
  const [retry, setRetry] = useState(0)
  const [isNativeContext, setIsNativeContext] = useState(false)
  const live = snapshots.teams.filter(team => team.captainSessionId === sessionId)
  const archived = snapshots.archivedTeams.filter(team => team.captainSessionId === sessionId && !live.some(item => item.teamId === team.teamId))
  const historic = [...local.history.values()].filter(team => team.captainSessionId === sessionId
    && !live.some(item => item.teamId === team.teamId) && !archived.some(item => item.teamId === team.teamId))
    .map(team => historicCardTeam(team, sessionId))
  const records = [...live, ...archived, ...historic]
  const selected = records.find(team => team.teamId === local.selected.get(sessionId)) ?? records[0]
  const history = selected !== undefined && !live.includes(selected)
  const status = local.statuses.get(sessionId) ?? 'loading'
  // Explicit reconnect is bounded and cleaned up; ordinary polling is owned by the monitor.
  useEffect(() => {
    if (retry === 0 || !tab.visible) return
    const controller = startActivityPolling([], { discoverySessionId: sessionId, onStatus: value => state.status(sessionId, value) })
    void controller.firstTick.finally(() => { controller.stop() })
    return () => { controller.stop() }
  }, [retry, sessionId, state, tab.visible])
  const backToChat = (): void => {
    // Closing this occurrence does not cancel a team or destroy other workspace tabs.
    tab.actions.close()
    requestAnimationFrame(() => document.querySelector<HTMLElement>('[data-composer-card] [contenteditable="true"][role="textbox"], [data-composer-card] textarea')?.focus())
  }
  return (
    <div className={css.root} data-agent-teams-workspace data-session-id={sessionId}>
      <div className={css.content}>
        <header className={css.heading}>
          <img src={LEAD_ART} alt="" aria-hidden />
          <h2>TeamFlow</h2>
          <span>{t('workspace.title')}</span>
        </header>
        {history && selected && !archived.includes(selected) && <WorkflowHistory name={selected.name}><TeamSection team={selected} workspace historic onNavigate={openMember} t={t} /></WorkflowHistory>}
        {(!history || !!selected && archived.includes(selected)) && <WorkflowWorkbench key={`${sessionId}:${selected?.teamId ?? ''}`} sessionId={sessionId} teamId={selected?.teamId} archived={history} embeddedContext={isNativeContext} onNativeContext={setIsNativeContext} openContext={openContext} modelDirectory={modelDirectories.directoryFor(sessionId)} t={t}
          waitingCount={selected?.phase !== 'staged' && !selected?.halted ? selected?.tasks.filter(task => task.checkpoint && !task.workflowConfigPending && !task.workflowPaused && !task.checkpoint.decision && task.status === 'pending' && task.dependencies.every(id => selected.tasks.some(t => t.id === id && t.status === 'completed'))).length : 0}
          openConversation={id => openWorkflowConversation(openMember, id as import('@deepseek-ai/dsh-session/types').SessionId)}
          openExecution={(id, parentId) => openMember((parentId ?? sessionId) as import('@deepseek-ai/dsh-session/types').SessionId, id as import('@deepseek-ai/dsh-session/types').SessionId)} />}
        {!isNativeContext && status === 'error' && <div className={css.error} role="alert"><span>{t('workspace.error')}</span><button onClick={() => setRetry(value => value + 1)}>{t('workspace.retry')}</button></div>}
        {records.length > 1 && <nav className={css.selector} aria-label={t('workspace.title')}>
          {records.map(team => <button key={team.teamId} aria-pressed={selected?.teamId === team.teamId} onClick={() => state.select(sessionId, team.teamId)}>{team.name}<span>{t(live.includes(team) ? 'workspace.current' : 'workspace.history')}</span></button>)}
        </nav>}
        {selected === undefined ? isNativeContext ? null : status === 'loading' ? <div className={css.skeleton} role="status" aria-label={t('workspace.loading')}><i /><i /><i /></div> : <section className={css.empty}>
          <span className={css.emptyMark} aria-hidden>↳</span>
          <h3>{t('workspace.emptyTitle')}</h3><p>{t('workspace.emptyBody')}</p>
          <button onClick={backToChat}>{t('workspace.back')}</button>
        </section> : <>
          <TeamSection key={`${sessionId}:${selected.teamId}`} team={selected} workspace historic={history}
            modelDirectory={!history ? modelDirectories.directoryFor(sessionId) : undefined}
            onContinuePlanning={backToChat} onDiscarded={backToChat} onNavigate={openMember} t={t} />
        </>}
      </div>
    </div>
  )
}
