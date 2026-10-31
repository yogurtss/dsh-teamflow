import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { briefDisplay } from "./workflow-text.js";
import { useWorkflowText } from "./workflow-i18n.js";
import { useState } from 'react';
import css from './TemplateGallery.module.css';
export function TaskLayersView({ layers, issue }) {
    const l = useWorkflowText();
    return _jsxs("div", { className: css.layers, children: [_jsxs("details", { children: [_jsxs("summary", { children: [l("通用任务 · "), layers.general.requirements.slice(0, 45) || l("尚未填写")] }), _jsx("p", { children: briefDisplay(layers.general, l) })] }), _jsx("strong", { children: l("本次任务 · 完整执行要求") }), _jsx("p", { children: briefDisplay(layers.specific, l) || l("等待统一适配") }), issue && _jsxs("p", { role: "alert", className: css.warning, children: [l("需要确认："), issue] })] });
}
export function TaskLayersEditor({ values, onChange, hasGeneral = false, issue = false }) {
    const l = useWorkflowText();
    const [unlock, setUnlock] = useState(!hasGeneral);
    const field = (key, label, disabled = false) => _jsxs("label", { children: [label, _jsx("textarea", { value: values[key] ?? '', disabled: disabled, maxLength: 16000, onChange: e => onChange({ ...values, [key]: e.target.value }) })] });
    return _jsxs("div", { className: css.layers, children: [_jsxs("details", { open: !hasGeneral, children: [_jsx("summary", { children: l("通用任务 · 可复用的方法与约束") }), hasGeneral && _jsxs("label", { className: css.toggle, children: [_jsx("input", { type: "checkbox", checked: unlock, onChange: e => setUnlock(e.target.checked) }), l("修改当前流程的通用要求")] }), _jsx("p", { className: css.muted, children: l("模板只保存此层。修改后需重新生成或确认本次任务，不会覆盖模板。") }), field('generalRequirements', l("通用任务要求"), !unlock), _jsxs("details", { children: [_jsx("summary", { children: l("通用交付物与验收要求") }), field('generalDeliverables', l("通用交付物"), !unlock), field('generalAcceptance', l("通用验收要求"), !unlock)] })] }), _jsx("strong", { children: l("本次任务 · 完整执行要求") }), _jsx("p", { className: css.muted, children: l("Agent 只读取本次要求。请包含具体化后的全部通用约束、交付物与验收条件，不要仅写补充说明。") }), field('description', l("本次任务要求")), _jsxs("details", { open: !!values['specificDeliverables'] || !!values['specificAcceptance'], children: [_jsx("summary", { children: l("本次交付物与验收要求") }), field('specificDeliverables', l("本次交付物")), field('specificAcceptance', l("本次验收要求"))] }), (issue || values['adaptationIssue']) && _jsxs(_Fragment, { children: [field('adaptationIssue', l("适配问题（处理后清空，并确认配置）")), _jsx("p", { className: css.warning, children: l("保留节点并调整要求；存在未处理问题时不能启动。") })] })] });
}
