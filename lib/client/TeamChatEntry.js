import { jsx as _jsx } from "react/jsx-runtime";
/** Session-owned review reminders, discussion entry and durable team cards. */
import { useSyncExternalStore } from 'react';
import { AgentTeamsSummary } from "./AgentTeamsCard.js";
import { getActivitySnapshotsSnapshot, subscribeActivitySnapshots } from "./activity-monitor.js";
import { teamCardsForTurn } from "./agent-teams-card-definition.js";
import css from './AgentTeamsCard.module.css';
import { WorkflowWorkbench } from "./WorkflowWorkbench.js";
import { openWorkflowConversation } from "./session-navigation.js";
export function TeamChatEntry({ sessionId, t, openMember, openContext }) {
    const { teams, archivedTeams } = useSyncExternalStore(subscribeActivitySnapshots, getActivitySnapshotsSnapshot);
    const team = [...teams, ...archivedTeams].find(team => team.captainSessionId === sessionId);
    if (!team)
        return _jsx(WorkflowWorkbench, { sessionId: sessionId, nativeOnly: true, openContext: openContext, openConversation: openMember ? id => openWorkflowConversation(openMember, id) : undefined, openExecution: (id, parentId) => openMember?.((parentId ?? sessionId), id) }, sessionId);
    return _jsx(WorkflowWorkbench, { sessionId: sessionId, teamId: team.teamId, nativeOnly: true, archived: archivedTeams.includes(team), openConversation: openMember ? id => openWorkflowConversation(openMember, id) : undefined }, sessionId);
}
export function TeamTurnCard({ sessionId, turn, useChat, t, openMember }) {
    const nodes = useChat(snapshot => snapshot.nodes);
    const cards = teamCardsForTurn(nodes.values(), turn.turn);
    if (turn.status !== 'closed' || cards.length === 0)
        return null;
    return _jsx("div", { className: css.turnCards, "data-team-turn-cards": true, children: cards.map(node => _jsx(AgentTeamsSummary, { data: node.data, sessionId: sessionId, t: t, openMember: openMember }, node.key)) });
}
