import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { galleryAccessKeys } from "../gallery-access.js";
import { createWorkflowCache } from "./workflow-cache.js";
import { workflowRequest } from "./workflow-request.js";
import { briefDisplay } from "./workflow-text.js";
import { workflowMessage } from "./workflow-text.js";
import { localizeBuiltinTemplate, builtinText } from "../builtin-template-locales.js";
import { useWorkflowText } from "./workflow-i18n.js";
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { isBuiltinTemplate } from "../templates.js";
import { arrangeWorkflow, loopRegion } from "./workflow-layout.js";
import { WORKFLOW_GATE_PATH, connectionPath, connectionPort } from "./workflow-connections.js";
import { BrandIcon } from "./BrandIcon.js";
import { EmbeddedDiscussion } from "./EmbeddedDiscussion.js";
import css from './TemplateGallery.module.css';
const catalogCache = createWorkflowCache(4, 2 * 1024 * 1024);
async function api(sessionId, action, fields = {}, signal) {
    return workflowRequest({ sessionId, action, ...fields }, fetch, undefined, signal);
}
function MiniFlow({ template, large = false }) {
    const l = useWorkflowText();
    const [showAll, setShowAll] = useState(false);
    const marker = `template-arrow-${useId().replace(/:/g, '')}`;
    const layout = arrangeWorkflow(template.tasks, template.loops), pos = (id) => template.positions[`task:${id}`] ?? layout[id] ?? { x: 32, y: 32 };
    const regions = (template.loops ?? []).map(loop => ({ loop, ...loopRegion(template.tasks, loop, pos) }));
    const gateNode = (task) => task.checkpointKind === 'gate' || !!template.loops?.some(loop => loop.gateId === task.id);
    const points = template.tasks.map(task => ({ task, p: pos(task.id) }));
    const width = Math.max(580, ...points.map(({ p }) => p.x + 260)), height = Math.max(210, ...points.map(({ p }) => p.y + 180), ...regions.map(r => r.bottom + 20));
    const focus = (!large || !showAll) && regions.length === 1 ? regions[0] : undefined;
    const exits = focus ? points.filter(({ task }) => task.dependencies.includes(focus.loop.gateId)) : [];
    const focusRight = focus ? Math.max(focus.x + focus.width, ...exits.map(({ p }) => p.x + 245)) : 0;
    const focusBottom = focus ? Math.max(focus.bottom, ...exits.map(({ p }) => p.y + 170)) : 0;
    const view = focus ? `${focus.x - 15} ${focus.y - 15} ${focusRight - focus.x + 30} ${focusBottom - focus.y + 30}` : `0 0 ${width + 20} ${height + 20}`;
    const graphic = _jsxs("svg", { className: large ? css.flowLarge : css.flow, "data-loop-preview": regions.length || undefined, style: large && regions.length ? focus ? { height: 320 } : { minWidth: Math.min(1800, Math.max(900, width * .65)), height: Math.max(320, height * .65) } : undefined, viewBox: view, role: "img", "aria-label": l("流程预览，{0} 个节点", template.tasks.length), children: [_jsx("defs", { children: ['normal', 'pass', 'reject'].map(kind => _jsx("marker", { id: `${marker}-${kind}`, markerWidth: "9", markerHeight: "9", refX: "8", refY: "4.5", orient: "auto", markerUnits: "userSpaceOnUse", children: _jsx("path", { d: "M0,0 L9,4.5 L0,9", fill: kind === 'pass' ? '#15803d' : kind === 'reject' ? '#9333ea' : 'currentColor' }) }, kind)) }), regions.map(region => _jsxs("g", { "data-loop-region": region.loop.gateId, children: [_jsx("rect", { x: region.x, y: region.y, width: region.width, height: region.height, rx: "22", fill: "currentColor", fillOpacity: ".035", stroke: "currentColor", strokeOpacity: ".25", strokeDasharray: "8 6" }), _jsxs("text", { x: region.x + 16, y: region.y + 22, fontSize: "17", fill: "currentColor", children: [l.language === 'en' ? 'LOOP ·' : '循环 ·', " ", region.loop.maxRounds, " ", l.language === 'en' ? 'rounds max' : '轮上限'] })] }, region.loop.gateId)), points.flatMap(({ task, p }) => task.dependencies.map(id => { const source = template.tasks.find(t => t.id === id); if (!source)
                return null; const pass = template.loops?.some(loop => loop.gateId === id), start = connectionPort(pos(id), 'output', gateNode(source)), end = connectionPort(p, 'input', gateNode(task)); return _jsxs("g", { "data-flow-branch": pass ? 'pass' : undefined, children: [_jsx("path", { d: connectionPath(start, end), fill: "none", stroke: pass ? '#15803d' : 'currentColor', strokeWidth: "3", opacity: pass ? 1 : .45, markerEnd: `url(#${marker}-${pass ? 'pass' : 'normal'})` }), pass && _jsx("text", { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 - 14, textAnchor: "middle", fontSize: "18", fontWeight: "700", fill: "#15803d", children: "PASS" })] }, `${id}:${task.id}`); })), regions.map(region => _jsxs("g", { "data-flow-branch": "reject", children: [_jsx("path", { d: region.returnPath, fill: "none", stroke: "#9333ea", strokeWidth: "3", strokeDasharray: "9 6", markerEnd: `url(#${marker}-reject)` }), _jsxs("text", { x: region.label.x, y: region.label.y, textAnchor: "middle", fontSize: "19", fontWeight: "700", fill: "#9333ea", children: ["REJECT \u00B7 ", l.language === 'en' ? 'Revise with feedback' : '按意见改进'] })] }, `return:${region.loop.gateId}`)), points.map(({ task, p }) => _jsxs("g", { "data-preview-node": task.id, children: [_jsx("title", { children: task.subject }), gateNode(task) ? _jsx("path", { d: WORKFLOW_GATE_PATH, transform: `translate(${p.x},${p.y})`, fill: template.loops?.some(loop => loop.gateId === task.id) ? '#f3e8ff' : '#fef3c7', stroke: template.loops?.some(loop => loop.gateId === task.id) ? '#9333ea' : '#b45309', strokeWidth: "2" }) : _jsx("rect", { x: p.x, y: p.y, width: "225", height: "150", rx: "14", fill: "var(--wb-bg, white)", stroke: "currentColor", strokeOpacity: ".5", strokeWidth: "2" }), _jsxs("text", { x: p.x + 112.5, y: p.y + 80, textAnchor: "middle", fontSize: l.language === 'en' ? 17 : 20, fill: task.checkpoint ? '#581c87' : 'currentColor', children: [task.subject.slice(0, l.language === 'en' ? 19 : 9), task.subject.length > (l.language === 'en' ? 19 : 9) ? '…' : ''] })] }, task.id))] });
    return large ? _jsxs("div", { children: [regions.length === 1 && _jsxs("div", { className: css.flowViews, children: [_jsx("button", { "aria-pressed": !showAll, onClick: () => setShowAll(false), children: l.language === 'en' ? 'Loop paths' : '循环路径' }), _jsx("button", { "aria-pressed": showAll, onClick: () => setShowAll(true), children: l.language === 'en' ? 'Full workflow' : '完整流程' })] }), _jsx("div", { className: css.flowViewport, tabIndex: 0, children: graphic })] }) : graphic;
}
export function TemplateGallery({ sessionId, team, archived = false, mode = 'browse', onApply, onBack }) {
    const l = useWorkflowText();
    const [templates, setTemplates] = useState(() => catalogCache.get(sessionId ?? '')?.templates ?? []), [warnings, setWarnings] = useState([]);
    const [search, setSearch] = useState(''), [tag, setTag] = useState(''), [selection, setSelected] = useState();
    const [draft, setDraft] = useState(), [previous, setPrevious] = useState();
    const [busy, setBusy] = useState(true), [error, setError] = useState(''), [notice, setNotice] = useState(''), [goal, setGoal] = useState(''), [name, setName] = useState();
    const [extracting, setExtracting] = useState(false), [aiDraft, setAiDraft] = useState(), [deleteId, setDeleteId] = useState('');
    const selected = selection ? localizeBuiltinTemplate(selection, l.language) : undefined;
    const catalog = templates.map(item => localizeBuiltinTemplate(item, l.language));
    const goalInput = useRef(null);
    const detailHeading = useRef(null);
    const focusGoal = useRef(false);
    const gallery = useRef(null);
    const cardTrigger = useRef('');
    useLayoutEffect(() => {
        if (selection)
            (focusGoal.current ? goalInput.current : detailHeading.current)?.focus();
        else if (!draft && cardTrigger.current)
            gallery.current?.querySelector(`[data-template-choice="${CSS.escape(cardTrigger.current)}"]`)?.focus();
    }, [selection, draft]);
    const alive = useRef(true);
    useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
    async function refresh(signal) { const result = await api(sessionId, 'template_list', {}, signal); if (alive.current && !signal?.aborted) {
        catalogCache.set(sessionId ?? '', result);
        setTemplates(result.templates);
        setWarnings(result.warnings);
        setGoal(current => current || result.context || '');
    } }
    async function run(action) { setBusy(true); setError(''); setNotice(''); try {
        await action();
    }
    catch (e) {
        if (alive.current)
            setError(e instanceof Error ? e.message : String(e));
    }
    finally {
        if (alive.current)
            setBusy(false);
    } }
    useEffect(() => {
        const controller = new AbortController();
        setBusy(true);
        setError('');
        void (async () => {
            try {
                await refresh(controller.signal);
                if (mode === 'save' && team && !controller.signal.aborted) {
                    const result = await api(sessionId, 'template_seed', { teamId: team.id }, controller.signal);
                    if (!controller.signal.aborted)
                        setDraft(result.definition);
                }
            }
            catch (e) {
                if (!controller.signal.aborted)
                    setError(e instanceof Error ? e.message : String(e));
            }
            finally {
                if (!controller.signal.aborted)
                    setBusy(false);
            }
        })();
        return () => controller.abort();
    }, [sessionId, mode, team?.id]);
    useEffect(() => {
        if (!extracting || !team)
            return;
        let live = true, inFlight = false;
        const controller = new AbortController();
        const poll = () => { if (inFlight || document.hidden)
            return; inFlight = true; void api(sessionId, 'state', { teamId: team.id }, controller.signal).then(result => { const candidate = result.team?.workflow?.discussions?.['discussion:template']?.templateDraft; if (live && candidate) {
            if (candidate.base === result.base)
                setAiDraft(candidate.definition);
            else
                setError(l("源流程已变化，请重新讨论后生成模板草稿。"));
        } }).catch(e => { if (live)
            setError(e instanceof Error ? e.message : String(e)); }).finally(() => { inFlight = false; }); };
        poll();
        const timer = setInterval(poll, 2500);
        return () => { live = false; controller.abort(); clearInterval(timer); };
    }, [extracting, team?.id, sessionId]);
    function choose(item, apply = false) {
        cardTrigger.current = (apply ? 'use:' : 'view:') + item.id;
        focusGoal.current = apply && !team;
        setSelected(item);
        setName(undefined);
        setDeleteId('');
        setError('');
    }
    const tags = [...new Set(catalog.flatMap(t => t.tags))];
    const activeTag = tags.includes(tag) ? tag : builtinText(tag, l.language);
    const filtered = catalog.filter(t => (!activeTag || t.tags.includes(activeTag)) && `${t.name} ${t.description} ${t.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase()));
    function briefEditor(value, change) { return _jsxs(_Fragment, { children: [_jsxs("label", { children: [l("通用任务要求"), _jsx("textarea", { value: value.requirements, maxLength: 16000, onChange: e => change({ ...value, requirements: e.target.value }) })] }), _jsxs("details", { children: [_jsx("summary", { children: l("交付物与验收要求") }), _jsxs("label", { children: [l("通用交付物"), _jsx("textarea", { value: value.deliverables, maxLength: 16000, onChange: e => change({ ...value, deliverables: e.target.value }) })] }), _jsxs("label", { children: [l("通用验收要求"), _jsx("textarea", { value: value.acceptance, maxLength: 16000, onChange: e => change({ ...value, acceptance: e.target.value }) })] })] })] }); }
    return _jsxs("section", { ref: gallery, className: css.gallery, "aria-label": l("流程模板库"), children: [(!selected || draft) && _jsxs("header", { className: css.hero, children: [_jsx("div", { className: css.heroIcon, children: _jsx(BrandIcon, { name: "gallery", size: 38 }) }), _jsxs("div", { children: [_jsx("small", { children: "MY TEAMFLOW GALLERY" }), _jsx("h2", { children: draft ? l("编辑流程模板") : l("流程模板库") }), _jsx("p", { children: l("留下有效的方法，让下一次协作从这里开始。") })] }), onBack && _jsx("button", { onClick: onBack, disabled: busy, children: l("返回当前流程") })] }), error && _jsx("p", { className: css.warning, role: "alert", children: workflowMessage(error, l) }), notice && _jsx("p", { role: "status", children: workflowMessage(notice, l) }), warnings.map(w => _jsx("p", { role: "alert", children: workflowMessage(w, l) }, w)), draft ? _jsxs("div", { className: css.editorGrid, children: [_jsxs("div", { className: css.definition, children: [_jsxs("div", { className: css.actions, children: [_jsx("button", { onClick: () => { setDraft(undefined); setExtracting(false); setPrevious(undefined); }, disabled: busy, children: l("返回模板库") }), mode === 'save' && team && !archived && _jsx("button", { disabled: busy, onClick: () => void run(async () => { await api(sessionId, 'open_discussion', { teamId: team.id, discussion: 'template' }); setExtracting(true); }), children: l("AI 提炼通用流程") }), aiDraft && _jsx("button", { onClick: () => { setDraft(structuredClone(aiDraft)); setNotice(l("已载入 AI 草稿，请检查通用要求和成员指令。")); }, children: l("载入 AI 草稿") })] }), _jsx("p", { className: css.muted, children: l("保存成员、通用任务、连线和人工检查点。具体任务、结果、审批、模型路由和旧会话不进入模板。") }), _jsxs("label", { children: [l("模板名称"), _jsx("input", { value: draft.name, maxLength: 120, onChange: e => setDraft({ ...draft, name: e.target.value }) })] }), _jsxs("label", { children: [l("适用说明"), _jsx("textarea", { value: draft.description, maxLength: 2000, onChange: e => setDraft({ ...draft, description: e.target.value }) })] }), _jsxs("label", { children: [l("标签（逗号分隔）"), _jsx("input", { defaultValue: draft.tags.join('，'), onBlur: e => setDraft({ ...draft, tags: e.target.value.split(/[,，]/).map(s => s.trim()).filter(Boolean) }) }, draft.tags.join('，'))] }), _jsxs("label", { children: [l("应用前需要提供的信息"), _jsx("textarea", { value: draft.inputs, maxLength: 4000, onChange: e => setDraft({ ...draft, inputs: e.target.value }) })] }), _jsx(MiniFlow, { template: draft, large: true }), _jsx("h3", { children: l("成员通用职责") }), draft.members.map((m, i) => _jsxs("details", { children: [_jsxs("summary", { children: [m.name, " \u00B7 ", m.summary] }), ['summary', 'role', 'executionPrompt'].map(key => _jsxs("label", { children: [key === 'summary' ? l("职责概述") : key === 'role' ? l("长期职责") : l("通用执行指令 / PE"), _jsx("textarea", { value: m[key], maxLength: 16000, onChange: e => setDraft({ ...draft, members: draft.members.map((member, index) => index === i ? { ...member, [key]: e.target.value } : member) }) })] }, key)), galleryAccessKeys.map(key => _jsxs("label", { className: css.galleryPermission, children: [_jsx("input", { type: "checkbox", checked: m[key] !== false, disabled: busy, onChange: e => setDraft({ ...draft, members: draft.members.map((member, index) => index === i ? { ...member, [key]: e.target.checked } : member) }) }), key === 'gallerySkill' ? l("允许使用 Gallery Skill") : l("允许使用 Gallery MCP")] }, key))] }, m.name)), _jsx("h3", { children: l("节点通用任务") }), draft.tasks.map((t, i) => _jsxs("details", { open: !t.general.requirements, children: [_jsxs("summary", { children: [t.checkpoint ? t.checkpointKind === 'gate' || draft.loops?.some(loop => loop.gateId === t.id) ? l('门控节点') : l('验收节点') : l("任务"), " \u00B7 ", t.subject] }), _jsxs("label", { children: [l("通用节点名称"), _jsx("input", { value: t.subject, maxLength: 200, onChange: e => setDraft({ ...draft, tasks: draft.tasks.map((task, index) => index === i ? { ...task, subject: e.target.value } : task) }) })] }), briefEditor(t.general, general => setDraft({ ...draft, tasks: draft.tasks.map((task, index) => index === i ? { ...task, general } : task) })), mode === 'save' && team?.tasks.find(task => task.id === t.id)?.description && _jsxs("details", { children: [_jsx("summary", { children: l("原任务（仅用于对照）") }), _jsx("p", { children: team.tasks.find(task => task.id === t.id)?.description })] })] }, t.id)), _jsxs("div", { className: css.actions, children: [mode === 'save' && team?.workflow?.templateSource && !isBuiltinTemplate(team.workflow.templateSource.id) && !previous && _jsx("button", { disabled: busy, onClick: () => setPrevious({ id: team.workflow.templateSource.id, version: team.workflow.templateSource.version }), children: l("作为来源模板的新版本") }), _jsxs("button", { className: css.primary, disabled: busy || !draft.name.trim() || draft.tasks.some(t => !t.general.requirements.trim()), onClick: () => void run(async () => { const saved = await api(sessionId, 'template_save', { definition: draft, ...previous ? { templateId: previous.id, version: previous.version } : {} }); setDraft(undefined); setExtracting(false); setPrevious(undefined); await refresh(); setNotice(l("已保存「{0}」v{1}", saved.template.name, saved.template.version)); }), children: [_jsx(BrandIcon, { name: "save" }), busy ? l("处理中…") : previous ? l("保存为 v{0}", previous.version + 1) : l("保存新模板")] })] })] }), extracting && team && sessionId ? _jsxs("div", { className: css.chat, children: [_jsx("h3", { children: l("提炼通用流程") }), _jsx("p", { children: l("AI 只提出草稿，源流程保持不变。") }), _jsx(EmbeddedDiscussion, { sessionId: sessionId, teamId: team.id, discussion: "template" })] }) : _jsxs("aside", { className: css.guide, children: [_jsx(BrandIcon, { name: "save", size: 44 }), _jsx("h3", { children: l("保存做事的方法") }), _jsx("p", { children: l("通用要求保留方法、交付约定和质量标准。项目名称、路径、数值等具体要求留给下次适配。") }), _jsx("p", { children: l("可先让 AI 提炼，再检查和修改。原流程的执行记录不会被改动。") })] })] })
                : selected ? _jsxs("div", { className: css.detail, children: [_jsx("button", { onClick: () => setSelected(undefined), children: l("← 所有模板") }), _jsxs("div", { className: css.detailHeading, children: [_jsxs("div", { children: [_jsx("h2", { tabIndex: -1, ref: detailHeading, children: selected.name }), _jsx("p", { children: selected.description || l("个人流程模板") }), _jsxs("small", { children: [isBuiltinTemplate(selected.id) ? l("内置") : l("个人"), " \u00B7 v", selected.version, " \u00B7 ", selected.members.length, " ", l(" 个角色 · "), selected.tasks.length, " ", l(" 个节点")] })] }), _jsx(BrandIcon, { name: "gallery", size: 42 })] }), _jsxs("div", { className: css.applyGrid, children: [team ? _jsx("p", { className: css.warning, children: l("当前对话已有流程。请在新的对话打开 Teamflow 后应用；不会覆盖当前流程。") }) : _jsxs("form", { className: css.apply, onSubmit: e => { e.preventDefault(); void run(() => onApply(selected, name ?? selected.name, goal)); }, children: [_jsx("h3", { children: l("应用到本次任务") }), _jsx("p", { children: selected.inputs || l("描述本次目标、工作范围和特殊要求。") }), _jsxs("label", { children: [l("流程名称"), _jsx("input", { required: true, maxLength: 120, value: name ?? selected.name, onChange: e => setName(e.target.value) })] }), _jsxs("label", { children: [l("本次需求"), _jsx("textarea", { ref: goalInput, required: true, maxLength: 12000, value: goal, onChange: e => setGoal(e.target.value), placeholder: l("例如：实现算子 B，遵循当前项目接口，并验证正确性…") })] }), _jsx("small", { children: l("已有对话需求会带入适配。保留全部节点和连线，由 Captain 统一生成本次任务；确认后才执行。") }), _jsx("button", { className: css.primary, disabled: busy || !!team || !goal.trim(), children: l("使用模板并讨论本次任务") })] }), _jsxs("div", { children: [_jsx(MiniFlow, { template: selected, large: true }), _jsx("h3", { children: l("流程与通用要求") }), selected.tasks.map(t => _jsxs("details", { children: [_jsxs("summary", { children: [t.checkpoint ? t.checkpointKind === 'gate' || selected.loops?.some(loop => loop.gateId === t.id) ? l('门控节点') : l('验收节点') : l("任务"), " \u00B7 ", t.subject] }), _jsx("p", { children: briefDisplay(t.general, l) }), _jsxs("small", { children: [l("负责人："), t.assignee || selected.loops?.find(loop => loop.gateId === t.id)?.reviewer || l("人工／自动分配"), " ", l(" · 上游："), t.dependencies.map(id => selected.tasks.find(n => n.id === id)?.subject).join('、') || l("无")] })] }, t.id)), _jsx("h3", { children: l("角色分工") }), selected.members.map(m => _jsxs("details", { children: [_jsxs("summary", { children: [m.name, " \u00B7 ", m.summary] }), _jsx("p", { children: m.role }), _jsx("p", { children: m.executionPrompt })] }, m.name))] })] }), _jsxs("div", { className: css.actions, children: [_jsx("button", { onClick: () => { setDraft(structuredClone(selected)); setPrevious(isBuiltinTemplate(selected.id) ? undefined : { id: selected.id, version: selected.version }); setSelected(undefined); }, children: isBuiltinTemplate(selected.id) ? l("编辑并另存为个人模板") : l("编辑模板") }), _jsx("button", { onClick: () => { setDraft({ ...structuredClone(selected), name: l("{0} · 副本", selected.name) }); setPrevious(undefined); setSelected(undefined); }, children: l("复制模板") }), isBuiltinTemplate(selected.id) ? _jsx("small", { children: l("内置模板只读，修改后保存为个人模板。") }) : deleteId === selected.id ? _jsxs(_Fragment, { children: [_jsx("span", { children: l("删除后已创建的流程不受影响。") }), _jsx("button", { disabled: busy, onClick: () => void run(async () => { await api(sessionId, 'template_delete', { templateId: selected.id, version: selected.version }); setSelected(undefined); await refresh(); }), children: l("确认删除") }), _jsx("button", { onClick: () => setDeleteId(''), children: l("取消") })] }) : _jsx("button", { onClick: () => setDeleteId(selected.id), children: l("删除模板") })] })] }) : _jsxs(_Fragment, { children: [_jsxs("div", { className: css.filters, children: [_jsx("input", { "aria-label": l("搜索模板"), placeholder: l("搜索模板名称、用途或标签"), value: search, onChange: e => setSearch(e.target.value) }), _jsxs("select", { "aria-label": l("标签筛选"), value: activeTag, onChange: e => setTag(e.target.value), children: [_jsx("option", { value: "", children: l("所有标签") }), tags.map(t => _jsx("option", { children: t }, t))] }), _jsxs("span", { children: [filtered.length, " ", l(" 个模板")] })] }), busy && !templates.length ? _jsx("p", { role: "status", children: l("正在读取模板库…") }) : !filtered.length ? _jsxs("div", { className: css.empty, children: [_jsx(BrandIcon, { name: "gallery", size: 56 }), _jsx("h3", { children: templates.length ? l("没有匹配的模板") : l("把有效的协作流程留在这里") }), _jsx("p", { children: templates.length ? l("试试其他关键词或标签。") : l("在流程画布点击「保存为模板」，提炼一次，以后直接套用。") }), templates.length ? _jsx("button", { onClick: () => { setSearch(''); setTag(''); }, children: l("清除筛选") }) : onBack ? _jsx("button", { onClick: onBack, children: l("返回流程") }) : null] }) : _jsx("div", { className: css.cards, children: filtered.map(item => _jsxs("article", { className: css.card, children: [_jsxs("button", { className: css.cardPreview, "data-template-choice": 'view:' + item.id, onClick: () => choose(item), "aria-label": l("查看 {0}", item.name), children: [_jsx(MiniFlow, { template: item }), _jsx("h3", { children: item.name }), _jsx("p", { children: item.description || l("个人流程模板") })] }), _jsx("div", { className: css.tags, children: item.tags.map(t => _jsx("span", { children: t }, t)) }), _jsxs("small", { children: [item.members.length, " ", l(" 个角色 · "), item.tasks.length, " ", l(" 个节点 · "), item.tasks.filter(t => t.checkpoint && !item.loops?.some(loop => loop.gateId === t.id && loop.mode === 'ai')).length, " ", l(" 个人工检查点")] }), _jsxs("footer", { children: [_jsxs("small", { children: [isBuiltinTemplate(item.id) ? l("内置") : l("个人"), " \u00B7 v", item.version, " \u00B7 ", new Date(item.updatedAt).toLocaleDateString(l.language === 'en' ? 'en-US' : 'zh-CN')] }), _jsx("button", { className: css.primary, "data-template-choice": 'use:' + item.id, onClick: () => choose(item, true), children: team ? l("查看模板") : l("使用模板") })] })] }, item.id)) })] })] });
}
