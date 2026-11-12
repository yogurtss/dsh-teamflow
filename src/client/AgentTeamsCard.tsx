import { activityStatus } from './activity-status.ts'
import { useEffect, useMemo, useSyncExternalStore } from 'react'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import {
  getActivitySnapshotsSnapshot,
  monitorAgentTeam,
  subscribeActivitySnapshots,
} from './activity-monitor.ts'
import type { AgentTeamsCardData } from './agent-teams-card-definition.ts'
import { LEAD_ART, memberArtUrl } from './artwork.ts'
import css from './AgentTeamsCard.module.css'

/** Navigation action injected from the plugin's own SessionsService access. */
export interface AgentTeamsCardInjected {
  readonly workspaceBridge?: { getSnapshot: () => unknown; subscribe: (listener: () => void) => () => void }
  readonly openMember: (parentId: SessionId, childId: SessionId) => void
}

/** Complete keyed Chat renderer props. */
export type AgentTeamsCardProps =
  PropsRuntime<'conversation.chat.node', 'agent-teams'>
  & PropsLocale<'agentTeams'>
  & AgentTeamsCardInjected

/** Render one durable team as a compact conversation card. */
const noWorkspace = () => undefined
const noSubscription = () => () => {}

export function AgentTeamsCard({ node, openMember, sessionId, t, workspaceBridge }: AgentTeamsCardProps) {
  const native = useSyncExternalStore(workspaceBridge?.subscribe ?? noSubscription, workspaceBridge?.getSnapshot ?? noWorkspace)
  const location = node.location
  // Closed turns render their card through the official, non-folding turn tail.
  if (native && (location.kind === 'turn' || location.kind === 'step') && location.turn.status === 'closed') return null
  return <AgentTeamsSummary data={node.data} openMember={openMember} sessionId={sessionId} t={t} />
}

export function AgentTeamsSummary({ data, openMember, sessionId, t }: AgentTeamsCardInjected & PropsLocale<'agentTeams'> & {
  data: AgentTeamsCardData; sessionId: string
}) {
  // `conversation.chat.node` is session-scoped, so its framework-owned id is
  // a stable owner even while another conversation becomes current.
  const owner = data.captainSessionId || sessionId
  const { teams, archivedTeams } = useSyncExternalStore(
    subscribeActivitySnapshots,
    getActivitySnapshotsSnapshot,
  )
  useEffect(() => {
    return monitorAgentTeam(owner, data.teamId)
  }, [data.teamId, owner])
  const snapshot = teams.find((team) => team.teamId === data.teamId && (owner === '' || team.captainSessionId === owner))
    ?? archivedTeams.find((team) => team.teamId === data.teamId && (owner === '' || team.captainSessionId === owner))
  const resolved = useMemo<AgentTeamsCardData>(() => ({
    ...data,
    captainSessionId: snapshot?.captainSessionId ?? owner,
    teamName: snapshot?.name ?? data.teamName,
    members: snapshot?.members.map((member) => ({ id: member.id, name: member.name, role: member.role })) ?? data.members,
  }), [data, owner, snapshot])
  const { completed, total, percent, state } = activityStatus(snapshot)
  return (
    <section className={css.root} data-agent-teams-card data-team-id={resolved.teamId}>
      <header className={css.head}>
        <img className={css.leadAvatar} src={LEAD_ART} alt="" aria-hidden />
        <div className={css.heading}>
          <span className={css.eyebrow}>TEAMFLOW</span>
          <span className={css.teamName} title={resolved.teamName}>{resolved.teamName}</span>
          <span className={css.memberCount}>{t('card.memberCount', { count: resolved.members.length })}</span>
        </div>
      </header>
      {snapshot?.description && <p className={css.description}>{snapshot.description}</p>}
      {total > 0 && <div className={css.progressSection}>
        <div className={css.progressLabel}>
          <span>{t(state === 'completed' ? 'activity.state.completed' : 'card.progress')}</span>
          <strong>{t('card.completedCount', { completed, total })}</strong>
        </div>
        <div className={css.progressTrack} role="progressbar" aria-label={t('card.progress')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
          <span style={{ width: `${percent}%` }} />
        </div>
      </div>}
      {resolved.members.length > 0 && (
        <div className={css.members}>
          {resolved.members.map((member) => (
            <button
              type="button"
              key={member.id || member.name}
              className={css.member}
              onClick={() => {
                if (member.id !== '') openMember(owner as SessionId, member.id as SessionId)
              }}
              title={member.role === '' ? member.name : `${member.name} · ${member.role}`}
            >
              {memberArtUrl(member.name, member.role) !== null ? (
                <img className={css.memberArt} src={memberArtUrl(member.name, member.role) ?? ''} alt="" aria-hidden />
              ) : (
                <span className={css.memberInitial}>{member.name.trim().slice(0, 1).toUpperCase() || '?'}</span>
              )}
              <span className={css.memberInfo}>
                <span className={css.memberName}>{member.name}</span>
                {member.role && <span className={css.memberRole}>{member.role}</span>}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
