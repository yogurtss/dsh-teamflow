import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { zh } from "./locales.js";
import css from './TaskStateBadge.module.css';
export const taskStateNodeClass = `${css.state} ${css.node}`;
const symbols = {
    configurationPending: '✎', awaitingStart: '▷', staged: '▷', waiting: '⌛', blocked: '!', queued: '⋯',
    claimed: '◷', inProgress: '▶', stopping: '◷', paused: 'Ⅱ', reviewReady: '◇', reviewRejected: '↩',
    reviewPassed: '✓', rerunRequired: '↻', completed: '✓', failed: '!', cancelled: '×', stopped: '■', notRun: '—', stale: '!',
};
export function TaskStateBadge({ control, t, className = '', detail, discarded = false, stale = false }) {
    const visual = discarded ? 'notRun' : stale ? 'stale' : control.visual;
    const key = discarded ? 'task.status.notRun' : stale ? 'workspace.verdictStale' : control.label;
    const label = t ? t(key) : zh[key];
    return _jsxs("span", { className: `${css.state} ${css.badge} ${className}`, "data-lifecycle": visual, title: detail || label, children: [_jsx("span", { "aria-hidden": "true", className: css.symbol, children: symbols[visual] ?? '•' }), _jsx("span", { children: label })] });
}
