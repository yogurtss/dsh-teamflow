import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/** Native workspace content; discovery remains mounted independently of tab lifetime. */
import { useEffect, useState, useSyncExternalStore } from 'react';
import { ActivityPanel, TeamSection, historicCardTeam } from "./ActivityPanel.js";
import { openWorkflowConversation } from "./session-navigation.js";
import { getActivitySnapshotsSnapshot, startActivityPolling, subscribeActivitySnapshots } from "./activity-monitor.js";
import { LEAD_ART } from "./artwork.js";
import css from './WorkspaceActivity.module.css';
import { WorkflowHistory } from "./WorkflowHistory.js";
import { WorkflowWorkbench } from "./WorkflowWorkbench.js";
export const TEAM_TAB_KIND = 'agent-teams';
export const TEAM_TAB_ID = '@yogurtss/dsh-teamflow/activity';
/** Optional host integration tracks whether the host renders durable turn-tail cards. */
export function createWorkspaceBridge() {
    let sidebar;
    const listeners = new Set();
    return {
        getSnapshot: () => sidebar,
        subscribe: (listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
        set(value) { sidebar = value; for (const listener of listeners)
            listener(); },
    };
}
/** The activity dot is the primary monitor on every host; native tabs are supplementary. */
export function ActivitySurface({ state, ...props }) {
    return _jsx(ActivityPanel, { ...props, onMonitorStatus: state.status, onRememberTeam: state.remember });
}
export function WorkspaceActivity({ sessionId, useTabInfo, t, state, modelDirectories, openMember, openContext }) {
    const { tab } = useTabInfo();
    const snapshots = useSyncExternalStore(subscribeActivitySnapshots, getActivitySnapshotsSnapshot);
    const local = useSyncExternalStore(state.subscribe, state.getSnapshot);
    const [retry, setRetry] = useState(0);
    const [isNativeContext, setIsNativeContext] = useState(false);
    const live = snapshots.teams.filter(team => team.captainSessionId === sessionId);
    const archived = snapshots.archivedTeams.filter(team => team.captainSessionId === sessionId && !live.some(item => item.teamId === team.teamId));
    const historic = [...local.history.values()].filter(team => team.captainSessionId === sessionId
        && !live.some(item => item.teamId === team.teamId) && !archived.some(item => item.teamId === team.teamId))
        .map(team => historicCardTeam(team, sessionId));
    const records = [...live, ...archived, ...historic];
    const selected = records.find(team => team.teamId === local.selected.get(sessionId)) ?? records[0];
    const history = selected !== undefined && !live.includes(selected);
    const status = local.statuses.get(sessionId) ?? 'loading';
    // Explicit reconnect is bounded and cleaned up; ordinary polling is owned by the monitor.
    useEffect(() => {
        if (retry === 0 || !tab.visible)
            return;
        const controller = startActivityPolling([], { discoverySessionId: sessionId, onStatus: value => state.status(sessionId, value) });
        void controller.firstTick.finally(() => { controller.stop(); });
        return () => { controller.stop(); };
    }, [retry, sessionId, state, tab.visible]);
    const backToChat = () => {
        // Closing this occurrence does not cancel a team or destroy other workspace tabs.
        tab.actions.close();
        requestAnimationFrame(() => document.querySelector('[data-composer-card] [contenteditable="true"][role="textbox"], [data-composer-card] textarea')?.focus());
    };
    return (_jsx("div", { className: css.root, "data-agent-teams-workspace": true, "data-session-id": sessionId, children: _jsxs("div", { className: css.content, children: [_jsxs("header", { className: css.heading, children: [_jsx("img", { src: LEAD_ART, alt: "", "aria-hidden": true }), _jsx("h2", { children: "TeamFlow" }), _jsx("span", { children: t('workspace.title') })] }), history && selected && !archived.includes(selected) && _jsx(WorkflowHistory, { name: selected.name, children: _jsx(TeamSection, { team: selected, workspace: true, historic: true, onNavigate: openMember, t: t }) }), (!history || !!selected && archived.includes(selected)) && _jsx(WorkflowWorkbench, { sessionId: sessionId, teamId: selected?.teamId, archived: history, embeddedContext: isNativeContext, onNativeContext: setIsNativeContext, openContext: openContext, modelDirectory: modelDirectories.directoryFor(sessionId), t: t, waitingCount: selected?.phase !== 'staged' && !selected?.halted ? selected?.tasks.filter(task => task.checkpoint && !task.workflowConfigPending && !task.workflowPaused && !task.checkpoint.decision && task.status === 'pending' && task.dependencies.every(id => selected.tasks.some(t => t.id === id && t.status === 'completed'))).length : 0, openConversation: id => openWorkflowConversation(openMember, id), openExecution: (id, parentId) => openMember((parentId ?? sessionId), id) }, `${sessionId}:${selected?.teamId ?? ''}`), !isNativeContext && status === 'error' && _jsxs("div", { className: css.error, role: "alert", children: [_jsx("span", { children: t('workspace.error') }), _jsx("button", { onClick: () => setRetry(value => value + 1), children: t('workspace.retry') })] }), records.length > 1 && _jsx("nav", { className: css.selector, "aria-label": t('workspace.title'), children: records.map(team => _jsxs("button", { "aria-pressed": selected?.teamId === team.teamId, onClick: () => state.select(sessionId, team.teamId), children: [team.name, _jsx("span", { children: t(live.includes(team) ? 'workspace.current' : 'workspace.history') })] }, team.teamId)) }), selected === undefined ? isNativeContext ? null : status === 'loading' ? _jsxs("div", { className: css.skeleton, role: "status", "aria-label": t('workspace.loading'), children: [_jsx("i", {}), _jsx("i", {}), _jsx("i", {})] }) : _jsxs("section", { className: css.empty, children: [_jsx("span", { className: css.emptyMark, "aria-hidden": true, children: "\u21B3" }), _jsx("h3", { children: t('workspace.emptyTitle') }), _jsx("p", { children: t('workspace.emptyBody') }), _jsx("button", { onClick: backToChat, children: t('workspace.back') })] }) : _jsx(_Fragment, { children: _jsx(TeamSection, { team: selected, workspace: true, historic: history, modelDirectory: !history ? modelDirectories.directoryFor(sessionId) : undefined, onContinuePlanning: backToChat, onDiscarded: backToChat, onNavigate: openMember, t: t }, `${sessionId}:${selected.teamId}`) })] }) }));
}
