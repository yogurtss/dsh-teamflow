import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/** Session-owned entry points: a persistent title action and a durable turn card. */
import { useSyncExternalStore } from 'react';
import { AgentTeamsSummary, openActivityPanel } from "./AgentTeamsCard.js";
import { getActivitySnapshotsSnapshot, subscribeActivitySnapshots } from "./activity-monitor.js";
import { teamCardsForTurn } from "./agent-teams-card-definition.js";
import { LEAD_ART } from "./artwork.js";
import css from './AgentTeamsCard.module.css';
import { WorkflowWorkbench } from "./WorkflowWorkbench.js";
export function TeamChatEntry({ sessionId, t, openMember, openContext }) {
    const { teams, archivedTeams } = useSyncExternalStore(subscribeActivitySnapshots, getActivitySnapshotsSnapshot);
    const team = [...teams, ...archivedTeams].find(team => team.captainSessionId === sessionId);
    if (!team)
        return _jsx(WorkflowWorkbench, { sessionId: sessionId, nativeOnly: true, openContext: openContext, openConversation: id => openMember?.(id, id), openExecution: (id, parentId) => openMember?.((parentId ?? sessionId), id) }, sessionId);
    return _jsxs(_Fragment, { children: [_jsxs("button", { className: css.chatEntry, "data-team-chat-entry": true, type: "button", title: t('workspace.focus'), onClick: () => openActivityPanel({ teamId: team.teamId, captainSessionId: sessionId, teamName: team.name, members: team.members }), children: [_jsx("img", { src: LEAD_ART, alt: "", "aria-hidden": true }), t('workspace.focus')] }), _jsx(WorkflowWorkbench, { sessionId: sessionId, teamId: team.teamId, reviewEntryOnly: true, openConversation: openMember ? id => openMember(id, id) : undefined }, sessionId)] });
}
export function TeamTurnCard({ sessionId, turn, useChat, t, openMember }) {
    const nodes = useChat(snapshot => snapshot.nodes);
    const cards = teamCardsForTurn(nodes.values(), turn.turn);
    if (turn.status !== 'closed' || cards.length === 0)
        return null;
    return _jsx("div", { className: css.turnCards, "data-team-turn-cards": true, children: cards.map(node => _jsx(AgentTeamsSummary, { data: node.data, sessionId: sessionId, t: t, openMember: openMember }, node.key)) });
}
