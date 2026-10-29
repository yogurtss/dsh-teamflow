/** Session-owned review reminders, discussion entry and durable team cards. */
import { useSyncExternalStore } from 'react'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { AgentTeamsSummary, type AgentTeamsCardInjected } from './AgentTeamsCard.tsx'
import { getActivitySnapshotsSnapshot, subscribeActivitySnapshots } from './activity-monitor.ts'
import { teamCardsForTurn } from './agent-teams-card-definition.ts'
import css from './AgentTeamsCard.module.css'
import { WorkflowWorkbench } from './WorkflowWorkbench.tsx'
import { openWorkflowConversation } from './session-navigation.ts'

export function TeamChatEntry({ sessionId, t, openMember, openContext }: PropsRuntime<'conversation.session.header.actions'> & PropsLocale<'agentTeams'> & Pick<AgentTeamsCardInjected, 'openMember'> & { openContext?: () => void }) {
  const { teams, archivedTeams } = useSyncExternalStore(subscribeActivitySnapshots, getActivitySnapshotsSnapshot)
  const team = [...teams, ...archivedTeams].find(team => team.captainSessionId === sessionId)
  if (!team) return <WorkflowWorkbench key={sessionId} sessionId={sessionId} nativeOnly openContext={openContext}
    openConversation={openMember ? id => openWorkflowConversation(openMember, id as typeof sessionId) : undefined}
    openExecution={(id, parentId) => openMember?.((parentId ?? sessionId) as typeof sessionId, id as typeof sessionId)} />
  return <WorkflowWorkbench key={sessionId} sessionId={sessionId} teamId={team.teamId} nativeOnly archived={archivedTeams.includes(team)}
    openConversation={openMember ? id => openWorkflowConversation(openMember, id as typeof sessionId) : undefined} />
}

export function TeamTurnCard({ sessionId, turn, useChat, t, openMember }: PropsRuntime<'conversation.chat.turnTail'> & PropsLocale<'agentTeams'> & AgentTeamsCardInjected) {
  const nodes = useChat(snapshot => snapshot.nodes)
  const cards = teamCardsForTurn(nodes.values(), turn.turn)
  if (turn.status !== 'closed' || cards.length === 0) return null
  return <div className={css.turnCards} data-team-turn-cards>{cards.map(node => <AgentTeamsSummary key={node.key}
    data={node.data as import('./agent-teams-card-definition.ts').AgentTeamsCardData}
    sessionId={sessionId} t={t} openMember={openMember} />)}</div>
}
