import { jsx as _jsx } from "react/jsx-runtime";
/** Blank Web sessions hide header.actions; the additive shell seat stays mounted. */
import { useSyncExternalStore } from 'react';
import { blankTeamflowSession, openWorkflowConversation } from "./session-navigation.js";
import { WorkflowWorkbench } from "./WorkflowWorkbench.js";
import css from './BlankSessionTeamflowEntry.module.css';
export function BlankSessionTeamflowEntry({ sessionsList, modelDirectories, openMember, t, conversationVisible = true }) {
    const sessions = useSyncExternalStore(sessionsList.subscribe, sessionsList.getSnapshot);
    const id = blankTeamflowSession(sessions, conversationVisible);
    if (!id)
        return null;
    return _jsx("div", { className: css.entry, "data-teamflow-blank-entry": true, children: _jsx(WorkflowWorkbench, { sessionId: id, nativeOnly: true, t: t, modelDirectory: modelDirectories.directoryFor(id), openConversation: target => openWorkflowConversation(openMember, target), openExecution: (target, parent) => openMember((parent ?? id), target) }, id) });
}
