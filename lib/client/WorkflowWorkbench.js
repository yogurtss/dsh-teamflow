import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/** Editable task canvas and isolated configuration / human-review discussions. */
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import css from './WorkflowWorkbench.module.css';
import { WorkflowContext } from "./WorkflowContext.js";
import { taskDraftOperations } from "./workflow-draft.js";
import { connectionIssue, connectionTarget } from "./workflow-connections.js";
import { LEAD_ART, REVIEW_ART, memberArtUrl } from "./artwork.js";
async function request(payload) {
    const response = await fetch('/plugins/dsh-agent-teams/workflow', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok)
        throw new Error(result.error ?? `HTTP ${response.status}`);
    if (!result.team)
        return;
    return result;
}
const taskStatus = (task, ready) => task.workflowPaused ? '已暂停 · 可编辑'
    : task.checkpoint?.decision === 'reject' ? '已拒绝 · 等待返工'
        : ready.includes(task.id) ? '等待人工验收'
            : ({ pending: '等待执行', claimed: '已领取', in_progress: '执行中', completed: '已完成', failed: '失败', cancelled: '已取消' })[task.status];
function ReviewMaterials({ text }) {
    try {
        const material = JSON.parse(text);
        if (!Array.isArray(material.results) || !material.check)
            return _jsx("pre", { children: text });
        return _jsxs("div", { className: css.materials, children: [_jsxs("small", { children: ["\u7B2C ", material.check.round, " \u8F6E\u9A8C\u6536"] }), material.results.length === 0 && _jsx("p", { children: "\u6B64\u68C0\u67E5\u70B9\u6CA1\u6709\u4E0A\u6E38\u6267\u884C\u7ED3\u679C\uFF0C\u8BF7\u6839\u636E\u9A8C\u6536\u8981\u6C42\u786E\u8BA4\u662F\u5426\u7EE7\u7EED\u3002" }), material.results.map(result => _jsxs("section", { children: [_jsx("strong", { children: result.subject }), _jsx("p", { children: result.output || '尚未提交结果说明' }), result.commandsRun?.map((command, i) => _jsxs("p", { children: [command.status === 'passed' ? '通过' : '未通过', " \u00B7 ", command.command, command.evidence ? `\n${command.evidence}` : ''] }, i)), result.acceptanceResults?.map((item, i) => _jsxs("p", { children: [item.status === 'passed' ? '通过' : '未通过', " \u00B7 ", item.criterion, item.evidence ? `\n${item.evidence}` : ''] }, i))] }, result.id)), !!material.files?.artifacts.length && _jsxs("section", { children: [_jsx("strong", { children: "\u76F8\u5173\u6587\u4EF6" }), material.files.artifacts.map(file => _jsxs("p", { children: [file.path, file.unreadable ? ' · 无法读取' : !file.present ? ' · 文件不存在' : ''] }, file.path))] }), _jsx("p", { className: css.hint, children: material.limitation }), _jsxs("details", { children: [_jsx("summary", { children: "\u539F\u59CB\u8BC1\u636E\u8BB0\u5F55" }), _jsx("pre", { children: text })] })] });
    }
    catch {
        return _jsx("pre", { children: text });
    }
}
function describeOperation(op, team, operations = []) {
    const taskName = (id) => {
        const added = operations.find(item => item.action === 'add_task' && item.id === id);
        return added?.action === 'add_task' ? added.subject : team.tasks.find(t => t.id === id)?.subject ?? id;
    };
    const value = (v) => Array.isArray(v) ? v.map(id => taskName(String(id))).join('、') || '无' : String(v || '未设置');
    if (op.action === 'add_member')
        return `新增成员「${op.name}」\n职责概述：${op.summary}\n长期职责：${op.role || '未设置'}\n执行指令：${op.executionPrompt || '未设置'}`;
    if (op.action === 'remove_member')
        return `移除成员「${op.name}」`;
    if (op.action === 'remove_task')
        return `删除节点「${taskName(op.id)}」`;
    if (op.action === 'rework')
        return `为「${taskName(op.id)}」创建新一轮返工\n返工任务：${op.taskIds.map(taskName).join('、')}\n要求：${op.instructions}\n依赖这些结果的中间步骤也会重新执行，旧结果保留。`;
    if (op.action === 'add_task')
        return `新增${op.checkpoint ? '人工检查' : '任务'}「${op.subject}」\n说明：${op.description || '未设置'}\n负责人：${op.checkpoint ? '你与独立验收 Agent' : op.assignee || '自动分配'}\n前置任务：${value(op.dependencies)}`;
    const before = op.action === 'update_member' ? team.members.find(m => m.name === op.name) : team.tasks.find(t => t.id === op.id);
    const labels = { summary: '职责概述', role: '长期职责', executionPrompt: '执行指令', subject: '任务名称', description: '任务说明', assignee: '负责人', dependencies: '前置任务' };
    return `修改「${op.action === 'update_member' ? op.name : taskName(op.id)}」\n` + Object.entries(op).filter(([key]) => key in labels).map(([key, v]) => `${labels[key]}：${value(before?.[key])}\n→ ${value(v)}`).join('\n');
}
export function WorkflowWorkbench({ sessionId, teamId, waitingCount = 0, openExecution, openConversation, nativeOnly = false, embeddedContext = false, onNativeContext, openContext }) {
    const [opened, setOpened] = useState(false);
    const [data, setData] = useState();
    const [activeId, setActiveId] = useState(teamId);
    const [discussion, setDiscussion] = useState('graph');
    const [selectedTask, setSelectedTask] = useState();
    const [error, setError] = useState('');
    const [working, setWorking] = useState(false);
    const [note, setNote] = useState('');
    const [pane, setPane] = useState('flow');
    const [name, setName] = useState('新团队');
    const [goal, setGoal] = useState('');
    const [editor, setEditor] = useState();
    const [draft, setDraft] = useState({});
    const [dependencies, setDependencies] = useState([]);
    const [successors, setSuccessors] = useState([]);
    const [picking, setPicking] = useState('upstream');
    const [zoom, setZoom] = useState(1);
    const [positions, setPositions] = useState({});
    const [link, setLink] = useState();
    const cancelLink = useRef(undefined);
    const canvas = useRef(null);
    const dialog = useRef(null);
    const mounted = useRef(true);
    const generation = useRef(0);
    const team = data?.team;
    const conversation = team?.workflow?.discussions[`discussion:${discussion}`];
    const proposal = conversation?.proposal?.status === 'pending' ? conversation.proposal : undefined;
    const reviewTask = discussion.startsWith('check:') ? team?.tasks.find(t => t.id === discussion.slice(6)) : undefined;
    const activeTask = team?.tasks.find(t => t.id === selectedTask);
    const member = discussion.startsWith('member:') ? team?.members.find(m => m.name === discussion.slice(7)) : undefined;
    const defaultPositions = useMemo(() => {
        const tasks = team?.tasks ?? [], depths = new Map(), rows = new Map();
        function depth(id, seen = new Set()) {
            if (depths.has(id))
                return depths.get(id);
            if (seen.has(id))
                return 0;
            const next = new Set(seen).add(id), task = tasks.find(t => t.id === id);
            const value = task?.dependencies.length ? 1 + Math.max(...task.dependencies.map(dep => depth(dep, next))) : 0;
            depths.set(id, value);
            return value;
        }
        return Object.fromEntries(tasks.map(task => {
            const column = depth(task.id), row = rows.get(column) ?? 0;
            rows.set(column, row + 1);
            return [task.id, { x: 32 + column * 270, y: 32 + row * 160 }];
        }));
    }, [team?.tasks]);
    const taskEditing = !!editor && editor.type !== 'member';
    useEffect(() => { onNativeContext?.(!!data?.currentDiscussion); }, [data?.currentDiscussion, onNativeContext]);
    useEffect(() => { if (!editor)
        return; const frame = requestAnimationFrame(() => fitCanvas()); return () => cancelAnimationFrame(frame); }, [editor?.type, editor?.id]);
    const selectDiscussion = (key) => { setDiscussion(key); setPane('discussion'); };
    useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
    useEffect(() => {
        if (!opened)
            return;
        const previous = document.activeElement;
        dialog.current?.querySelector('button, input')?.focus();
        return () => previous?.focus();
    }, [opened]);
    useEffect(() => {
        if (editor)
            dialog.current?.querySelector('[data-workflow-editor] input:not(:disabled), [data-workflow-editor] textarea')?.focus();
    }, [editor]);
    useEffect(() => { if (teamId && teamId !== activeId) {
        setActiveId(teamId);
        setData(undefined);
        setDiscussion('graph');
        setPositions({});
        setSelectedTask(undefined);
        setEditor(undefined);
        generation.current++;
    } }, [sessionId, teamId]);
    const refresh = async () => {
        const token = generation.current;
        try {
            const result = await request({ sessionId, teamId: activeId, action: 'state' });
            if (!result)
                return;
            if (mounted.current && token === generation.current) {
                setData(result);
                setActiveId(result.team.id);
                if (!data && result.currentDiscussion) {
                    setDiscussion(result.currentDiscussion);
                    setPane('discussion');
                }
            }
        }
        catch (err) {
            if (mounted.current && token === generation.current && activeId)
                setError(String(err));
        }
    };
    useEffect(() => {
        if (working || (!activeId && data))
            return;
        void refresh();
        // A restored native conversation can mount before the host attaches its
        // Agent. Keep retrying discovery so that its persisted team appears without
        // requiring another navigation or accidentally offering to create a team.
        const timer = setInterval(() => { if (!working)
            void refresh(); }, 2500);
        return () => clearInterval(timer);
    }, [activeId, working]);
    async function perform(action, fields = {}) {
        setWorking(true);
        setError('');
        const token = ++generation.current;
        try {
            const result = await request({ sessionId, teamId: activeId, discussion, action, ...fields });
            if (!result)
                return;
            if (mounted.current && token === generation.current) {
                setData(result);
                setActiveId(result.team.id);
            }
            return result;
        }
        catch (err) {
            if (mounted.current)
                setError(err instanceof Error ? err.message : String(err));
            return undefined;
        }
        finally {
            if (mounted.current) {
                setWorking(false);
            }
        }
    }
    async function openDiscussion(key = discussion, targetId = activeId) {
        selectDiscussion(key);
        if (!openConversation) {
            setError('请在 DSH 中打开原生对话；开发预览不连接模型。');
            return;
        }
        const result = await perform('open_discussion', { discussion: key, teamId: targetId });
        if (result?.openedSessionId) {
            try {
                await openConversation(result.openedSessionId);
                setOpened(false);
                openContext?.();
            }
            catch (error) {
                setError(String(error));
            }
        }
    }
    async function createFlow() {
        const created = await perform('create', { name, description: goal });
        if (created)
            await openDiscussion('graph', created.team.id);
    }
    async function preview(operations, title) {
        if (await perform('preview', { operations, title, discussion: 'graph' })) {
            setEditor(undefined);
            selectDiscussion('graph');
        }
    }
    function edit(type, id, after) {
        setEditor({ type, id });
        setPane('flow');
        setError('');
        setPicking('upstream');
        const m = team?.members.find(item => item.name === id), t = team?.tasks.find(item => item.id === id);
        setDraft(type === 'member' ? { name: m?.name ?? '', summary: m?.summary ?? m?.role ?? '', role: m?.role ?? '', executionPrompt: m?.executionPrompt ?? '' }
            : { subject: t?.subject ?? '', description: t?.description ?? '', assignee: t?.assignee ?? '' });
        setDependencies(t?.dependencies ?? (after ? [after] : []));
        setSuccessors(id ? team?.tasks.filter(t => t.dependencies.includes(id)).map(t => t.id) ?? [] : after ? team?.tasks.filter(t => t.dependencies.includes(after) && t.status === 'pending' && (t.attempt ?? 0) === 0 && !t.checkpoint?.decision).map(t => t.id) ?? [] : []);
    }
    const field = (key, label, multiline = false) => _jsxs("label", { children: [label, multiline
                ? _jsx("textarea", { required: key === 'summary' && !editor?.id, value: draft[key] ?? '', onChange: e => setDraft({ ...draft, [key]: e.target.value }) })
                : _jsx("input", { required: key === 'name' || key === 'subject' || (key === 'summary' && !editor?.id), value: draft[key] ?? '', disabled: key === 'name' && !!editor?.id, onChange: e => setDraft({ ...draft, [key]: e.target.value }) })] });
    function pos(id) {
        return positions[id] ?? team?.workflow?.positions[`task:${id}`] ?? defaultPositions[id] ?? { x: 32, y: 32 };
    }
    function point(event) {
        const bounds = canvas.current.getBoundingClientRect();
        return { x: (event.clientX - bounds.left + canvas.current.scrollLeft) / zoom, y: (event.clientY - bounds.top + canvas.current.scrollTop) / zoom };
    }
    const draftPosition = editor?.id ? pos(editor.id) : {
        x: dependencies.length ? Math.max(...dependencies.map(id => pos(id).x)) + 270 : 32,
        y: dependencies.length ? Math.max(...dependencies.map(id => pos(id).y)) + 160 : Math.max(-128, ...team?.tasks.map(t => pos(t.id).y) ?? []) + 160,
    };
    const graphWidth = Math.max(580, ...team?.tasks.map(t => pos(t.id).x + 265) ?? [], taskEditing ? draftPosition.x + 265 : 0);
    const graphHeight = Math.max(260, ...team?.tasks.map(t => pos(t.id).y + 170) ?? [], taskEditing ? draftPosition.y + 170 : 0);
    function fitCanvas() {
        if (!canvas.current)
            return;
        setZoom(Math.max(.45, Math.min(1, (canvas.current.clientWidth - 20) / graphWidth)));
    }
    function pickTask(id) {
        if (!editor || !team || editor.type === 'member')
            return;
        const chosen = picking === 'upstream' ? dependencies : successors;
        if (chosen.includes(id)) {
            if (picking === 'upstream')
                setDependencies(chosen.filter(value => value !== id));
            else
                setSuccessors(chosen.filter(value => value !== id));
            return;
        }
        if (id === editor.id || (picking === 'upstream' ? successors : dependencies).includes(id)) {
            setError('同一节点不能同时作为上游和后续，也不能连接自身');
            return;
        }
        const task = team.tasks.find(t => t.id === id);
        if (picking === 'downstream' && (task.status !== 'pending' || (task.attempt ?? 0) > 0 || task.checkpoint?.decision || task.reassigning)) {
            setError('后续任务已经开始，请先停止任务，或通过返工建立新轮次');
            return;
        }
        if (editor.id) {
            const issue = picking === 'upstream' ? connectionIssue(team.tasks, id, editor.id) : connectionIssue(team.tasks, editor.id, id);
            if (issue && !issue.includes('已存在')) {
                setError(issue);
                return;
            }
        }
        setError('');
        if (picking === 'upstream')
            setDependencies([...chosen, id]);
        else
            setSuccessors([...chosen, id]);
    }
    async function openReview(id) {
        selectDiscussion(`check:${id}`);
        setSelectedTask(id);
        if (await perform('materials', { discussion: `check:${id}` }))
            await openDiscussion(`check:${id}`);
    }
    const pendingCount = Object.values(team?.workflow?.discussions ?? {}).filter(item => item.proposal?.status === 'pending').length;
    const reviewCount = data?.ready.length ?? waitingCount;
    if (nativeOnly && !data?.currentDiscussion)
        return null;
    return _jsxs(_Fragment, { children: [data?.currentDiscussion && team && _jsxs("div", { className: css.nativeBanner, children: [_jsxs("span", { children: [data.currentDiscussion.startsWith('check:') ? '独立验收对话' : '独立配置对话', " \u00B7 ", team.name] }), _jsx("button", { className: css.entry, onClick: () => void openExecution?.(team.captainSessionId, team.captainSessionId), children: "\u8FD4\u56DE\u961F\u957F\u5BF9\u8BDD \u2197" })] }), _jsxs("button", { type: "button", className: `${css.entry} ${nativeOnly ? css.compact : css.launcher}`, "aria-haspopup": "dialog", onClick: () => setOpened(true), children: [_jsxs("strong", { children: ["\u56E2\u961F\u4E0E\u6D41\u7A0B ", _jsx("span", { "aria-hidden": true, children: "\u2197" })] }), !nativeOnly && _jsx("span", { children: team?.name ?? (activeId ? '查看成员、任务交接与人工检查' : '讨论目标，创建初步团队') }), pendingCount > 0 && _jsxs("span", { children: [pendingCount, " \u9879\u4FEE\u6539\u5F85\u786E\u8BA4"] }), reviewCount > 0 && _jsxs("span", { children: [reviewCount, " \u9879\u7B49\u5F85\u4EBA\u5DE5\u9A8C\u6536"] })] }), nativeOnly && data?.currentDiscussion && openContext && _jsx("button", { className: `${css.entry} ${css.compact}`, onClick: openContext, children: "\u8BA8\u8BBA\u8D44\u6599 \u2197" }), embeddedContext && team && _jsxs("section", { className: css.contextPanel, "aria-label": "\u8BA8\u8BBA\u8D44\u6599", children: [_jsxs("header", { children: [_jsx("strong", { children: "\u8BA8\u8BBA\u8D44\u6599" }), _jsx("span", { children: "\u5F53\u524D\u5DF2\u4FDD\u5B58\u7684\u4FE1\u606F" })] }), _jsxs("label", { children: ["\u67E5\u770B\u5BF9\u8C61", _jsxs("select", { value: discussion, onChange: event => setDiscussion(event.target.value), children: [_jsx("option", { value: "graph", children: "\u56E2\u961F\u4E0E\u6D41\u7A0B" }), team.members.filter(m => m.status !== 'removed').map(m => _jsx("option", { value: `member:${m.name}`, children: m.name }, m.name)), team.tasks.filter(t => t.checkpoint).map(t => _jsxs("option", { value: `check:${t.id}`, children: ["\u9A8C\u6536 \u00B7 ", t.subject] }, t.id))] })] }), _jsx(WorkflowContext, { team: team, discussion: discussion, onSelect: setDiscussion, openExecution: openExecution }), conversation?.materials && _jsxs("details", { children: [_jsx("summary", { children: "\u672C\u8F6E\u9A8C\u6536\u8BC1\u636E" }), _jsx(ReviewMaterials, { text: conversation.materials })] }), proposal && _jsxs("section", { className: css.contextProposal, children: [_jsxs("strong", { children: ["\u5F85\u786E\u8BA4 \u00B7 ", proposal.title] }), proposal.operations.map((op, i) => _jsx("pre", { children: describeOperation(op, team, proposal.operations) }, i)), _jsx("button", { onClick: () => { setPane('discussion'); setOpened(true); }, children: "\u5728\u753B\u5E03\u67E5\u770B\u5E76\u786E\u8BA4" })] })] }), opened && createPortal(_jsxs("section", { ref: dialog, className: css.workbench, "data-editing": !!editor, role: "dialog", "aria-modal": "true", "aria-label": "TeamFlow \u7F16\u6392\u5DE5\u4F5C\u53F0", onKeyDown: event => {
                    if (event.key === 'Escape') {
                        if (cancelLink.current) {
                            cancelLink.current();
                            return;
                        }
                        ;
                        if (editor)
                            setEditor(undefined);
                        else
                            setOpened(false);
                    }
                    if (event.key === 'Tab') {
                        const scope = dialog.current;
                        const items = [...scope?.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), summary') ?? []].filter(el => el.getClientRects().length);
                        const first = items[0], last = items.at(-1);
                        if (event.shiftKey && (document.activeElement === first || !scope?.contains(document.activeElement))) {
                            event.preventDefault();
                            last?.focus();
                        }
                        else if (!event.shiftKey && document.activeElement === last) {
                            event.preventDefault();
                            first?.focus();
                        }
                    }
                }, children: [_jsxs("header", { className: css.header, children: [_jsxs("div", { className: css.title, children: [_jsx("img", { src: LEAD_ART, alt: "" }), _jsxs("div", { children: [_jsx("strong", { children: team?.name ?? '创建团队' }), _jsx("span", { children: team?.phase === 'staged' ? '准备流程 · 确认后开始执行' : '团队工作台' })] })] }), _jsxs("div", { children: [team?.phase === 'staged' && _jsx("button", { className: css.primary, disabled: working, onClick: () => void perform('start'), children: "\u786E\u8BA4\u5E76\u542F\u52A8" }), _jsx("button", { onClick: () => setOpened(false), "aria-label": "\u5173\u95ED\u7F16\u6392\u5DE5\u4F5C\u53F0", children: "\u5173\u95ED" })] })] }), team && _jsx("nav", { className: css.paneTabs, "aria-label": "\u5DE5\u4F5C\u53F0\u89C6\u56FE", children: ['members', 'flow', 'discussion'].map(value => _jsxs("button", { "aria-pressed": pane === value, onClick: () => setPane(value), children: [value === 'members' ? `成员 ${team.members.filter(m => m.status !== 'removed').length}` : value === 'flow' ? '任务流程' : '修改与验收', value === 'discussion' && proposal && _jsx("i", { "aria-label": "\u6709\u5F85\u786E\u8BA4\u7684\u4FEE\u6539" })] }, value)) }), error && _jsx("div", { className: css.error, role: "alert", children: error }), !activeId ? _jsxs("form", { className: css.create, onSubmit: e => { e.preventDefault(); void createFlow(); }, children: [_jsx("h2", { children: "\u63CF\u8FF0\u76EE\u6807\uFF0C\u4E00\u8D77\u89C4\u5212\u56E2\u961F" }), _jsxs("label", { children: ["\u56E2\u961F\u540D\u79F0", _jsx("input", { required: true, value: name, onChange: e => setName(e.target.value) })] }), _jsxs("label", { children: ["\u56E2\u961F\u76EE\u6807", _jsx("textarea", { required: true, value: goal, onChange: e => setGoal(e.target.value) })] }), _jsx("button", { className: css.primary, disabled: working, children: "\u5728 DSH \u4E2D\u8BA8\u8BBA\u65B9\u6848 \u2197" })] }) : !team ? _jsx("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u56E2\u961F\u2026" }) : _jsxs("div", { className: css.columns, "data-pane": pane, "data-editing": !!editor, children: [_jsxs("aside", { className: css.roster, children: [_jsxs("h3", { children: ["\u6210\u5458 ", _jsx("button", { "aria-label": "\u6DFB\u52A0\u6210\u5458", disabled: working || !!editor, onClick: () => edit('member'), children: "\uFF0B \u6DFB\u52A0" })] }), team.members.filter(m => m.status !== 'removed').map(m => _jsxs("article", { className: discussion === `member:${m.name}` ? css.selected : '', children: [_jsxs("button", { className: css.member, onClick: () => { selectDiscussion(`member:${m.name}`); setSelectedTask(undefined); }, children: [_jsx("img", { src: memberArtUrl(m.name, m.role ?? ''), alt: "" }), _jsxs("span", { children: [_jsx("strong", { children: m.name }), _jsx("span", { children: m.summary || m.role || '尚未填写职责概述' })] })] }), _jsx("small", { children: m.model || '继承队长模型' }), _jsxs("div", { children: [_jsx("button", { disabled: working || !!editor, onClick: () => edit('member', m.name), children: "\u7F16\u8F91\u804C\u8D23" }), _jsx("button", { disabled: working, onClick: () => void openDiscussion(`member:${m.name}`), children: "\u8BA8\u8BBA\u8C03\u6574 \u2197" }), m.id && openExecution && _jsx("button", { onClick: () => { openExecution(m.id, team.captainSessionId); setOpened(false); }, children: "\u6267\u884C\u5BF9\u8BDD \u2197" }), openExecution && m.previousSessionIds?.map((id, i) => _jsxs("button", { onClick: () => { openExecution(id, team.captainSessionId); setOpened(false); }, children: ["\u5386\u53F2\u6267\u884C ", i + 1, " \u2197"] }, id))] })] }, m.name)), _jsx("p", { className: css.hint, children: "\u70B9\u51FB\u6210\u5458\u67E5\u770B\u804C\u8D23\uFF0C\u8BA8\u8BBA\u8C03\u6574\u4F1A\u6253\u5F00 DSH \u539F\u751F\u5BF9\u8BDD\u3002\u786E\u8BA4\u4FEE\u6539\u540E\u751F\u6548\u3002" })] }), _jsxs("main", { className: css.graphArea, children: [_jsxs("nav", { className: css.toolbar, children: [_jsx("button", { className: css.primary, disabled: working || !!editor, onClick: () => void openDiscussion('graph'), children: "\u8BA8\u8BBA\u6D41\u7A0B \u2197" }), _jsx("button", { disabled: working || !!editor, onClick: () => edit('task'), children: "\uFF0B \u4EFB\u52A1" }), _jsx("button", { disabled: working || !!editor, onClick: () => edit('check'), children: "\uFF0B \u4EBA\u5DE5\u68C0\u67E5" }), _jsx("button", { "aria-label": "\u7F29\u5C0F\u753B\u5E03", onClick: () => setZoom(value => Math.max(.45, value - .1)), children: "\u2212" }), _jsx("button", { "aria-label": "\u653E\u5927\u753B\u5E03", onClick: () => setZoom(value => Math.min(1.5, value + .1)), children: "\uFF0B" }), _jsx("button", { onClick: fitCanvas, children: "\u9002\u5E94\u753B\u5E03" }), _jsx("span", { role: link || taskEditing ? 'status' : undefined, children: taskEditing ? `点击画布节点选择${picking === 'upstream' ? '上游' : '后续'} · 虚线表示尚未应用的修改` : link ? link.issue ?? (link.to ? '已吸附到输入端 · 松开查看交接预览' : '靠近下一节点以连接 · Esc 取消') : '拖动节点；从右侧端口拉线到下一节点，上游完成后下游开始' })] }), !editor && !!data?.ready.length && _jsxs("div", { className: css.notice, role: "status", children: ["\u7B49\u5F85\u4EBA\u5DE5\u9A8C\u6536\uFF1A", data.ready.map(id => _jsxs("button", { disabled: working, onClick: () => void openReview(id), children: [team.tasks.find(t => t.id === id)?.subject, " \u2192"] }, id))] }), _jsx("div", { className: css.canvas, ref: canvas, children: _jsxs("div", { className: css.plane, style: { width: graphWidth, height: graphHeight, zoom }, children: [_jsxs("svg", { className: css.edges, "aria-hidden": "true", children: [_jsx("defs", { children: _jsx("marker", { id: "workflow-arrow", markerWidth: "8", markerHeight: "8", refX: "7", refY: "4", orient: "auto", children: _jsx("path", { d: "M0,0 L8,4 L0,8", fill: "currentColor" }) }) }), team.tasks.flatMap(t => t.dependencies.filter(dep => !(taskEditing && (t.id === editor?.id || dep === editor?.id || (successors.includes(t.id) && dependencies.includes(dep))))).map(dep => { const a = pos(dep), b = pos(t.id); return _jsx("path", { d: `M${a.x + 225},${a.y + 55} C${a.x + 260},${a.y + 55} ${b.x - 35},${b.y + 55} ${b.x},${b.y + 55}`, markerEnd: "url(#workflow-arrow)" }, `${dep}-${t.id}`); })), taskEditing && _jsxs("g", { className: css.draftEdges, children: [dependencies.map(id => { const a = pos(id), b = draftPosition; return _jsx("path", { d: `M${a.x + 225},${a.y + 55} C${a.x + 265},${a.y + 55} ${b.x - 40},${b.y + 55} ${b.x},${b.y + 55}`, markerEnd: "url(#workflow-arrow)" }, id); }), successors.map(id => { const a = draftPosition, b = pos(id); return _jsx("path", { d: `M${a.x + 225},${a.y + 55} C${a.x + 265},${a.y + 55} ${b.x - 40},${b.y + 55} ${b.x},${b.y + 55}`, markerEnd: "url(#workflow-arrow)" }, id); })] }), link && _jsx("path", { d: `M${pos(link.from).x + 225},${pos(link.from).y + 55} C${pos(link.from).x + 280},${pos(link.from).y + 55} ${link.x - 55},${link.y} ${link.x},${link.y}` })] }), team.tasks.map(task => {
                                                    const p = pos(task.id);
                                                    return _jsxs("article", { "data-selection": taskEditing ? dependencies.includes(task.id) ? 'upstream' : successors.includes(task.id) ? 'downstream' : undefined : undefined, "data-connection": link?.to === task.id ? link.issue ? 'invalid' : 'valid' : undefined, className: `${css.node} ${task.checkpoint ? css.checkpoint : ''} ${selectedTask === task.id ? css.selected : ''}`, style: { left: p.x, top: p.y }, children: [_jsxs("div", { className: css.drag, onPointerDown: event => {
                                                                    if (event.button !== 0 || working || editor)
                                                                        return;
                                                                    event.currentTarget.setPointerCapture(event.pointerId);
                                                                    const start = point(event), original = pos(task.id);
                                                                    let last = original;
                                                                    const target = event.currentTarget;
                                                                    target.onpointermove = move => { const at = point(move); last = { x: Math.min(10000, Math.max(0, original.x + at.x - start.x)), y: Math.min(10000, Math.max(0, original.y + at.y - start.y)) }; setPositions(prev => ({ ...prev, [task.id]: last })); };
                                                                    target.onpointerup = () => { target.onpointermove = null; target.onpointerup = null; void perform('layout', { taskId: task.id, ...last }).then(() => setPositions(prev => { const next = { ...prev }; delete next[task.id]; return next; })); };
                                                                    target.onpointercancel = () => { target.onpointermove = null; target.onpointerup = null; setPositions(prev => { const next = { ...prev }; delete next[task.id]; return next; }); };
                                                                }, children: ["\u283F ", task.checkpoint ? '人工检查' : '执行任务', " \u00B7 ", task.id] }), _jsxs("button", { className: css.nodeBody, "aria-pressed": taskEditing ? (picking === 'upstream' ? dependencies : successors).includes(task.id) : undefined, onClick: () => { if (taskEditing) {
                                                                    pickTask(task.id);
                                                                    return;
                                                                } ; setSelectedTask(task.id); if (task.checkpoint && (data.ready.includes(task.id) || task.checkpoint.decision === 'reject'))
                                                                    void openReview(task.id); }, children: [_jsx("strong", { children: task.subject }), taskEditing && _jsx("small", { children: dependencies.includes(task.id) ? '✓ 已选上游' : successors.includes(task.id) ? '✓ 已选后续' : task.id === editor?.id ? '正在编辑此节点' : `点击选择${picking === 'upstream' ? '上游' : '后续'}` }), _jsxs("span", { className: css.taskOwner, children: [_jsx("img", { src: task.checkpoint ? REVIEW_ART : memberArtUrl(task.assignee ?? '', team.members.find(m => m.name === task.assignee)?.role ?? ''), alt: "" }), task.checkpoint ? '验收 Agent 与你' : task.assignee || '自动分配成员'] }), _jsx("small", { "data-ready": data.ready.includes(task.id), children: taskStatus(task, data.ready) })] }), _jsx("button", { className: `${css.port} ${css.input}`, "data-input-id": task.id, "aria-label": `${task.subject} 输入端` }), _jsx("button", { className: `${css.port} ${css.output}`, "aria-label": `${task.subject} 输出端`, disabled: working || !!editor, onPointerDown: event => {
                                                                    if (event.button !== 0)
                                                                        return;
                                                                    event.preventDefault();
                                                                    const target = event.currentTarget;
                                                                    target.setPointerCapture(event.pointerId);
                                                                    const update = (move) => {
                                                                        const at = point(move), to = connectionTarget(team.tasks, pos, at, task.id);
                                                                        const issue = to ? connectionIssue(team.tasks, task.id, to.id) : undefined;
                                                                        const end = to && !issue ? { x: pos(to.id).x, y: pos(to.id).y + 55 } : at;
                                                                        setLink({ from: task.id, ...end, to: to?.id, issue });
                                                                        return { to, issue };
                                                                    };
                                                                    const cleanup = () => {
                                                                        target.onpointermove = null;
                                                                        target.onpointerup = null;
                                                                        target.onpointercancel = null;
                                                                        if (target.hasPointerCapture(event.pointerId))
                                                                            target.releasePointerCapture(event.pointerId);
                                                                        cancelLink.current = undefined;
                                                                        setLink(undefined);
                                                                    };
                                                                    cancelLink.current = cleanup;
                                                                    update(event);
                                                                    target.onpointermove = move => { update(move); };
                                                                    target.onpointerup = up => {
                                                                        const { to, issue } = update(up);
                                                                        cleanup();
                                                                        if (to && !issue)
                                                                            void preview([{ action: 'update_task', id: to.id, dependencies: [...to.dependencies, task.id] }], `连接 ${task.subject} → ${to.subject}`);
                                                                    };
                                                                    target.onpointercancel = cleanup;
                                                                } })] }, task.id);
                                                }), taskEditing && !editor?.id && _jsxs("article", { className: `${css.node} ${css.draftNode}`, style: { left: draftPosition.x, top: draftPosition.y }, children: [_jsx("div", { className: css.drag, children: "\u8349\u7A3F \u00B7 \u786E\u8BA4\u540E\u52A0\u5165\u6D41\u7A0B" }), _jsxs("div", { className: css.nodeBody, children: [_jsx("strong", { children: draft['subject'] || (editor?.type === 'check' ? '新人工检查' : '新任务') }), _jsx("span", { children: editor?.type === 'check' ? '你与独立验收 Agent' : draft['assignee'] || '待指定 Agent' }), _jsx("small", { children: "\u5C1A\u672A\u5E94\u7528" })] })] }), !team.tasks.length && !editor && _jsx("p", { className: css.empty, children: "\u6DFB\u52A0\u4EFB\u52A1\u6216\u4EBA\u5DE5\u68C0\u67E5\uFF0C\u6216\u8BA9 AI \u6839\u636E\u76EE\u6807\u63D0\u51FA\u6D41\u7A0B\u65B9\u6848\u3002" })] }) }), activeTask && !editor && _jsxs("section", { className: css.details, children: [_jsx("strong", { children: activeTask.subject }), _jsx("p", { children: activeTask.description || '暂无任务说明' }), _jsxs("div", { children: [_jsx("button", { disabled: working || activeTask.status !== 'pending' || (activeTask.attempt ?? 0) > 0 || !!activeTask.checkpoint?.decision, onClick: () => edit(activeTask.checkpoint ? 'check' : 'task', activeTask.id), children: "\u7F16\u8F91\u4EFB\u52A1\u4E0E\u8FDE\u63A5" }), !activeTask.checkpoint && !['completed', 'failed', 'cancelled'].includes(activeTask.status) && _jsx("button", { disabled: working, onClick: () => void perform(activeTask.workflowPaused ? 'resume_task' : 'stop_task', { taskId: activeTask.id }), children: activeTask.workflowPaused ? '继续执行' : '停止任务以编辑' }), _jsx("button", { disabled: working || !!editor, onClick: () => edit('check', undefined, activeTask.id), children: "\u5728\u6B64\u4E4B\u540E\u63D2\u5165\u4EBA\u5DE5\u68C0\u67E5" }), _jsx("button", { className: css.danger, disabled: working || activeTask.status !== 'pending' || (activeTask.attempt ?? 0) > 0 || !!activeTask.checkpoint?.decision || team.tasks.some(t => t.dependencies.includes(activeTask.id)), onClick: () => void preview([{ action: 'remove_task', id: activeTask.id }], `删除 ${activeTask.subject}`), children: "\u5220\u9664\u8282\u70B9" })] })] })] }), _jsxs("aside", { className: css.discussion, children: [_jsxs("header", { children: [_jsx("img", { src: reviewTask ? REVIEW_ART : member ? memberArtUrl(member.name, member.role ?? '') : LEAD_ART, alt: "" }), _jsxs("div", { children: [_jsx("h3", { children: reviewTask ? `验收 · ${reviewTask.subject}` : member ? `成员职责 · ${member.name}` : '流程修改' }), _jsx("small", { children: reviewTask ? '一起检查成果，由你决定是否通过' : '讨论不影响执行，修改确认后生效' })] })] }), _jsxs("div", { className: css.messages, children: [_jsx("p", { className: css.hint, children: reviewTask ? '在原生验收对话中共同检查成果，回到这里确认验收决定。' : member ? '与独立配置顾问讨论职责、Summary、执行指令和任务。' : '在 DSH 原生对话中讨论团队与流程，修改方案会显示在这里。' }), _jsxs("button", { className: css.primary, disabled: working, onClick: () => void openDiscussion(), children: ["\u5728 DSH \u4E2D", conversation?.native ? '继续' : '开始', "\u8BA8\u8BBA \u2197"] }), _jsx(WorkflowContext, { team: team, discussion: discussion, onSelect: selectDiscussion, openExecution: openExecution }), conversation?.materials && _jsxs("details", { open: true, children: [_jsx("summary", { children: "\u672C\u8F6E\u9A8C\u6536\u6750\u6599\u4E0E\u8BC1\u636E" }), _jsx(ReviewMaterials, { text: conversation.materials })] }), data.busy.includes(discussion) && _jsx("p", { role: "status", children: "\u539F\u751F\u5BF9\u8BDD\u6B63\u5728\u6574\u7406\u65B9\u6848\u2026" })] }), proposal && _jsxs("section", { className: css.proposal, children: [_jsx("strong", { children: proposal.title }), _jsxs("details", { open: true, children: [_jsx("summary", { children: "\u4FEE\u6539\u9884\u89C8\uFF08\u4E0D\u4F1A\u7ACB\u5373\u6267\u884C\uFF09" }), proposal.operations.map((op, i) => _jsx("pre", { children: describeOperation(op, team, proposal.operations) }, i))] }), _jsx("button", { className: css.primary, disabled: working, onClick: () => void perform('apply', { proposalId: proposal.id }), children: "\u786E\u8BA4\u5E94\u7528" }), _jsx("button", { disabled: working, onClick: () => void perform('dismiss'), children: "\u653E\u5F03\u63D0\u6848" })] }), reviewTask && conversation?.evidence && conversation.materialsRound === reviewTask.checkpoint?.round && data.ready.includes(reviewTask.id) && !reviewTask.checkpoint?.decision && _jsxs("div", { className: css.decisions, children: [_jsx("button", { className: css.primary, disabled: working, onClick: () => void perform('review', { taskId: reviewTask.id, evidence: conversation.evidence, decision: 'approve', note }).then(ok => { if (ok)
                                                    setNote(''); }), children: "\u901A\u8FC7\u9A8C\u6536" }), _jsx("button", { disabled: working, onClick: () => void perform('review', { taskId: reviewTask.id, evidence: conversation.evidence, decision: 'reject', note }).then(ok => { if (ok) {
                                                    setNote('');
                                                    void openDiscussion();
                                                } }), children: "\u9000\u56DE\u5E76\u8BA8\u8BBA\u8FD4\u5DE5" })] }), reviewTask?.checkpoint?.decision === 'reject' && _jsx("p", { className: css.notice, children: "\u5DF2\u62D2\u7EDD\uFF0C\u4E0B\u6E38\u4FDD\u6301\u7B49\u5F85\u3002\u8BF7\u8BA8\u8BBA\u8FD4\u5DE5\u5BF9\u8C61\u5E76\u786E\u8BA4\u65B0\u65B9\u6848\u3002" }), reviewTask && _jsxs("div", { className: css.composer, children: [_jsxs("label", { children: ["\u9A8C\u6536\u610F\u89C1\uFF08\u968F\u51B3\u5B9A\u4FDD\u5B58\uFF09", _jsx("textarea", { "aria-label": "\u9A8C\u6536\u610F\u89C1", value: note, onChange: e => setNote(e.target.value), placeholder: "\u8BB0\u5F55\u901A\u8FC7\u6216\u9000\u56DE\u7684\u539F\u56E0\u2026" })] }), _jsx("button", { disabled: working || !data.ready.includes(reviewTask.id), onClick: () => void perform('materials'), children: "\u5237\u65B0\u9A8C\u6536\u6750\u6599" })] }), !data.currentDiscussion && _jsx("button", { disabled: working || data.busy.includes(discussion), onClick: () => void perform('new_discussion').then(ok => { if (ok)
                                            void openDiscussion(); }), children: "\u65B0\u5EFA\u72EC\u7ACB\u8BA8\u8BBA" })] }), editor && _jsxs("form", { "data-workflow-editor": true, className: css.editor, onSubmit: event => {
                                    event.preventDefault();
                                    try {
                                        const operations = editor.type === 'member' ? [editor.id ? { action: 'update_member', name: editor.id, summary: draft['summary'], role: draft['role'], executionPrompt: draft['executionPrompt'] } : { action: 'add_member', name: draft['name'] ?? '', summary: draft['summary'] ?? '', role: draft['role'], executionPrompt: draft['executionPrompt'] }]
                                            : taskDraftOperations(team, { id: editor.id, checkpoint: editor.type === 'check', subject: draft['subject'] ?? '', description: draft['description'], assignee: draft['assignee'], dependencies, successors });
                                        void preview(operations, editor.type === 'member' ? '调整团队成员' : '调整任务流程与交接');
                                    }
                                    catch (error) {
                                        setError(String(error));
                                    }
                                }, children: [_jsxs("h3", { children: [editor.id ? '编辑' : '添加', editor.type === 'member' ? '成员' : editor.type === 'check' ? '人工检查' : '任务'] }), editor.type === 'member' ? _jsxs(_Fragment, { children: [field('name', '名称'), field('summary', 'Summary · 功能概述', true), field('role', '长期职责', true), field('executionPrompt', '执行指令 / PE', true)] })
                                        : _jsxs(_Fragment, { children: [field('subject', '任务名称'), field('description', '任务要求 / 验收要求', true), editor.type !== 'check' && _jsxs("label", { children: ["\u6267\u884C Agent", _jsxs("select", { value: draft['assignee'] ?? '', onChange: e => setDraft({ ...draft, assignee: e.target.value }), children: [_jsx("option", { value: "", children: "\u7531\u7A7A\u95F2\u6210\u5458\u9886\u53D6" }), team.members.filter(m => m.status !== 'removed').map(m => _jsx("option", { children: m.name }, m.name))] })] }), _jsxs("fieldset", { className: css.picker, children: [_jsx("legend", { children: "\u5728\u753B\u5E03\u9009\u62E9\u8FDE\u63A5" }), _jsxs("div", { className: css.pickerTabs, children: [_jsxs("button", { type: "button", "aria-pressed": picking === 'upstream', onClick: () => setPicking('upstream'), children: ["\u4E0A\u6E38 \u00B7 ", dependencies.length] }), _jsxs("button", { type: "button", "aria-pressed": picking === 'downstream', onClick: () => setPicking('downstream'), children: ["\u540E\u7EED \u00B7 ", successors.length] })] }), _jsx("p", { children: picking === 'upstream' ? '哪些任务完成后，这个节点才能开始？' : '这个节点完成或验收通过后，哪些任务才能开始？' }), _jsx("div", { className: css.chips, children: (picking === 'upstream' ? dependencies : successors).map(id => _jsxs("button", { type: "button", onClick: () => pickTask(id), children: [team.tasks.find(t => t.id === id)?.subject ?? id, " \u00D7"] }, id)) }), _jsxs("details", { children: [_jsx("summary", { children: "\u6309\u540D\u79F0\u9009\u62E9" }), team.tasks.filter(t => t.id !== editor.id).map(t => _jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: (picking === 'upstream' ? dependencies : successors).includes(t.id), onChange: () => pickTask(t.id) }), t.subject] }, t.id))] }), !!successors.length && _jsx("p", { className: css.hint, children: "\u9009\u4E2D\u4E0A\u6E38\u4E0E\u540E\u7EED\u4E4B\u95F4\u7684\u76F4\u63A5\u8FDE\u7EBF\u5C06\u6539\u4E3A\u7ECF\u8FC7\u672C\u8282\u70B9\uFF1B\u540E\u7EED\u7684\u5176\u4ED6\u4E0A\u6E38\u4FDD\u6301\u4E0D\u53D8\u3002" })] })] }), _jsxs("footer", { children: [_jsx("button", { className: css.primary, disabled: working, children: "\u9884\u89C8\u4FEE\u6539" }), _jsx("button", { type: "button", onClick: () => setEditor(undefined), children: "\u53D6\u6D88" }), editor.type === 'member' && editor.id && _jsx("button", { type: "button", disabled: working, onClick: () => void preview([{ action: 'remove_member', name: editor.id }], `移除 ${editor.id}`), children: "\u79FB\u9664\u6210\u5458" })] })] })] })] }), document.body)] });
}
