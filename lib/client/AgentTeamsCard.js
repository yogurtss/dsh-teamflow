import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { activityStatus } from "./activity-status.js";
import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { getActivitySnapshotsSnapshot, monitorAgentTeam, subscribeActivitySnapshots, } from "./activity-monitor.js";
import { LEAD_ART, memberArtUrl } from "./artwork.js";
import css from './AgentTeamsCard.module.css';
/** Render one durable team as a compact conversation card. */
const noWorkspace = () => undefined;
const noSubscription = () => () => { };
export function AgentTeamsCard({ node, openMember, sessionId, t, workspaceBridge }) {
    const native = useSyncExternalStore(workspaceBridge?.subscribe ?? noSubscription, workspaceBridge?.getSnapshot ?? noWorkspace);
    const location = node.location;
    // Closed turns render their card through the official, non-folding turn tail.
    if (native && (location.kind === 'turn' || location.kind === 'step') && location.turn.status === 'closed')
        return null;
    return _jsx(AgentTeamsSummary, { data: node.data, openMember: openMember, sessionId: sessionId, t: t });
}
export function AgentTeamsSummary({ data, openMember, sessionId, t }) {
    // `conversation.chat.node` is session-scoped, so its framework-owned id is
    // a stable owner even while another conversation becomes current.
    const owner = data.captainSessionId || sessionId;
    const { teams, archivedTeams } = useSyncExternalStore(subscribeActivitySnapshots, getActivitySnapshotsSnapshot);
    useEffect(() => {
        return monitorAgentTeam(owner, data.teamId);
    }, [data.teamId, owner]);
    const snapshot = teams.find((team) => team.teamId === data.teamId && (owner === '' || team.captainSessionId === owner))
        ?? archivedTeams.find((team) => team.teamId === data.teamId && (owner === '' || team.captainSessionId === owner));
    const resolved = useMemo(() => ({
        ...data,
        captainSessionId: snapshot?.captainSessionId ?? owner,
        teamName: snapshot?.name ?? data.teamName,
        members: snapshot?.members.map((member) => ({ id: member.id, name: member.name, role: member.role })) ?? data.members,
    }), [data, owner, snapshot]);
    const { completed, total, percent, state } = activityStatus(snapshot);
    return (_jsxs("section", { className: css.root, "data-agent-teams-card": true, "data-team-id": resolved.teamId, children: [_jsxs("header", { className: css.head, children: [_jsx("img", { className: css.leadAvatar, src: LEAD_ART, alt: "", "aria-hidden": true }), _jsxs("div", { className: css.heading, children: [_jsx("span", { className: css.eyebrow, children: "TEAMFLOW" }), _jsx("span", { className: css.teamName, title: resolved.teamName, children: resolved.teamName }), _jsx("span", { className: css.memberCount, children: t('card.memberCount', { count: resolved.members.length }) })] })] }), snapshot?.description && _jsx("p", { className: css.description, children: snapshot.description }), total > 0 && _jsxs("div", { className: css.progressSection, children: [_jsxs("div", { className: css.progressLabel, children: [_jsx("span", { children: t(state === 'completed' ? 'activity.state.completed' : 'card.progress') }), _jsx("strong", { children: t('card.completedCount', { completed, total }) })] }), _jsx("div", { className: css.progressTrack, role: "progressbar", "aria-label": t('card.progress'), "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": percent, children: _jsx("span", { style: { width: `${percent}%` } }) })] }), resolved.members.length > 0 && (_jsx("div", { className: css.members, children: resolved.members.map((member) => (_jsxs("button", { type: "button", className: css.member, onClick: () => {
                        if (member.id !== '')
                            openMember(owner, member.id);
                    }, title: member.role === '' ? member.name : `${member.name} · ${member.role}`, children: [memberArtUrl(member.name, member.role) !== null ? (_jsx("img", { className: css.memberArt, src: memberArtUrl(member.name, member.role) ?? '', alt: "", "aria-hidden": true })) : (_jsx("span", { className: css.memberInitial, children: member.name.trim().slice(0, 1).toUpperCase() || '?' })), _jsxs("span", { className: css.memberInfo, children: [_jsx("span", { className: css.memberName, children: member.name }), member.role && _jsx("span", { className: css.memberRole, children: member.role })] })] }, member.id || member.name))) }))] }));
}
