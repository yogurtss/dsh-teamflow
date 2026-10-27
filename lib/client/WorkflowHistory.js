import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useRef } from 'react';
import { createPortal } from 'react-dom';
import css from './WorkflowWorkbench.module.css';
/** History comes from activity snapshots, never from the mutable workflow API. */
export function WorkflowHistory({ name, children }) {
    const dialog = useRef(null);
    return _jsxs(_Fragment, { children: [_jsxs("button", { type: "button", className: `${css.entry} ${css.launcher}`, "aria-haspopup": "dialog", onClick: () => dialog.current?.showModal(), children: [_jsxs("strong", { children: ["\u56E2\u961F\u4E0E\u6D41\u7A0B ", _jsx("span", { "aria-hidden": true, children: "\u2197" })] }), _jsxs("span", { children: [name, " \u00B7 \u5386\u53F2\u8BB0\u5F55\uFF0C\u53EA\u8BFB"] })] }), createPortal(_jsxs("dialog", { ref: dialog, className: `${css.entry} ${css.historyDialog}`, "aria-label": `${name} · 团队与流程（只读）`, children: [_jsxs("header", { children: [_jsxs("div", { children: [_jsx("strong", { children: name }), _jsx("p", { children: "\u5386\u53F2\u8BB0\u5F55 \u00B7 \u53EA\u8BFB" })] }), _jsx("button", { type: "button", autoFocus: true, onClick: () => dialog.current?.close(), children: "\u5173\u95ED" })] }), children] }), document.body)] });
}
