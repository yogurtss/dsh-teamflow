import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrandIcon } from "./BrandIcon.js";
import { adaptationLabels } from "./adaptation-progress.js";
import { useWorkflowText } from "./workflow-i18n.js";
import css from './WorkflowWorkbench.module.css';
export function AdaptationProgress({ phase, disabled, onOpen }) {
    const l = useWorkflowText(), labels = adaptationLabels[phase];
    const busy = phase === 'connecting' || phase === 'generating';
    return _jsxs("section", { className: css.adaptationProgress, "data-adaptation-state": phase, "aria-label": l('本次任务适配'), children: [_jsxs("button", { type: "button", disabled: disabled, onClick: onOpen, children: [_jsx("span", { className: busy ? css.adaptationSpinner : undefined, "aria-hidden": "true", children: _jsx(BrandIcon, {}) }), l(labels.button)] }), _jsx("p", { role: "status", "aria-live": "polite", children: l(labels.detail) })] });
}
