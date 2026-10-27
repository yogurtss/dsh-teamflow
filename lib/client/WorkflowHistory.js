import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import css from './WorkflowWorkbench.module.css';
import { publishWorkflowActivity } from "./activity-monitor.js";
/** History comes from activity snapshots, never from the mutable workflow API. */
export function WorkflowHistory({ name, children, restore }) {
    const dialog = useRef(null);
    const [busy, setBusy] = useState(false), [error, setError] = useState(''), [restored, setRestored] = useState(false);
    async function restoreWorkflow() {
        if (!restore || busy)
            return;
        setBusy(true);
        setError('');
        try {
            const response = await fetch('/plugins/dsh-agent-teams/workflow', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'restore_archive', sessionId: restore.sessionId, teamId: restore.teamId }) });
            const result = await response.json();
            if (!response.ok || !result.activity)
                throw new Error(result.error ?? '恢复失败，请重新连接后重试');
            setRestored(true);
            dialog.current?.close();
            publishWorkflowActivity(result.activity);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
        finally {
            setBusy(false);
        }
    }
    return _jsxs(_Fragment, { children: [_jsxs("button", { type: "button", className: `${css.entry} ${css.launcher}`, "aria-haspopup": "dialog", onClick: () => dialog.current?.showModal(), children: [_jsxs("strong", { children: ["\u56E2\u961F\u4E0E\u6D41\u7A0B ", _jsx("span", { "aria-hidden": true, children: "\u2197" })] }), _jsxs("span", { children: [name, " \u00B7 \u5386\u53F2\u8BB0\u5F55\uFF0C\u53EA\u8BFB"] })] }), createPortal(_jsxs("dialog", { ref: dialog, className: `${css.entry} ${css.historyDialog}`, "aria-label": `${name} · 团队与流程（只读）`, children: [_jsxs("header", { children: [_jsxs("div", { children: [_jsx("strong", { children: name }), _jsx("p", { children: "\u5386\u53F2\u8BB0\u5F55 \u00B7 \u53EA\u8BFB" })] }), _jsx("button", { type: "button", autoFocus: true, onClick: () => dialog.current?.close(), children: "\u5173\u95ED" })] }), restore && _jsxs("section", { children: [_jsx("p", { children: "\u53EF\u6062\u590D\u4E3A\u5F85\u786E\u8BA4\u6D41\u7A0B\uFF1A\u4FDD\u7559\u5DF2\u5B8C\u6210\u6210\u679C\u4E0E\u539F\u5F52\u6863\uFF0C\u91CD\u65B0\u5EFA\u7ACB\u7A7A\u95F2\u6210\u5458\uFF1B\u4E0D\u4F1A\u81EA\u52A8\u6267\u884C\u3002\u8BF7\u786E\u8BA4\u6210\u5458\u914D\u7F6E\u540E\u542F\u52A8\uFF0C\u4EBA\u5DE5\u8282\u70B9\u4ECD\u9700\u6B63\u5F0F\u9A8C\u6536\u3002" }), _jsx("button", { type: "button", disabled: busy || restored, onClick: () => void restoreWorkflow(), children: busy ? '正在恢复…' : restored ? '已恢复，请查看当前团队' : '恢复为待确认流程' }), error && _jsx("p", { role: "alert", children: error })] }), children] }), document.body)] });
}
