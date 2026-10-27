import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/** Editable task canvas and isolated configuration / human-review discussions. */
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import css from './WorkflowWorkbench.module.css';
import { WorkflowContext } from "./WorkflowContext.js";
import { connectionIssue, connectionTarget } from "./workflow-connections.js";
import { LEAD_ART, REVIEW_ART, memberArtUrl } from "./artwork.js";
import { StagedModelPicker } from "./StagingPlanEditor.js";
import { EmbeddedDiscussion } from "./EmbeddedDiscussion.js";
import { ProposalReview } from "./ProposalReview.js";
import { TaskRerunPicker } from "./TaskRerunPicker.js";
import { rerunnableTasks } from "../task-rerun.js";
async function request(payload) {
    const response = await fetch('/plugins/dsh-agent-teams/workflow', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok)
        throw new Error(result.error ?? `HTTP ${response.status}`);
    if (!result.team)
        return;
    return result;
}
const taskStatus = (task, ready) => task.workflowRerunRequired ? '下游挂起 · 待你确认' : task.workflowPaused ? '已暂停 · 可编辑'
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
export function WorkflowWorkbench({ sessionId, teamId, waitingCount = 0, openExecution, openConversation, nativeOnly = false, reviewEntryOnly = false, embeddedContext = false, onNativeContext, openContext, modelDirectory, t }) {
    const [opened, setOpened] = useState(false);
    const [data, setData] = useState();
    const [activeId, setActiveId] = useState(teamId);
    const [discussion, setDiscussion] = useState('graph');
    const [selectedTask, setSelectedTask] = useState();
    const [error, setError] = useState('');
    const [feedback, setFeedback] = useState('');
    const [reviewDrafts, setReviewDrafts] = useState({});
    const [working, setWorking] = useState(false);
    const [note, setNote] = useState('');
    const [embeddedDiscussion, setEmbeddedDiscussion] = useState();
    const [pane, setPane] = useState('flow');
    const [name, setName] = useState('新团队');
    const [goal, setGoal] = useState('');
    const [editor, setEditor] = useState();
    const [draft, setDraft] = useState({});
    const [selectedEdge, setSelectedEdge] = useState();
    const [zoom, setZoom] = useState(1);
    const [positions, setPositions] = useState({});
    const [link, setLink] = useState();
    const suppressNodeClick = useRef(false);
    const cancelLink = useRef(undefined);
    const canvas = useRef(null);
    const dialog = useRef(null);
    const mounted = useRef(true);
    const generation = useRef(0);
    const initializedDiscussion = useRef(false);
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
        if (editor && !editor.id)
            dialog.current?.querySelector('[data-workflow-editor] input:not(:disabled), [data-workflow-editor] textarea')?.focus();
    }, [editor]);
    useEffect(() => { if (teamId && teamId !== activeId) {
        setActiveId(teamId);
        setData(undefined);
        setDiscussion('graph');
        setPositions({});
        setSelectedTask(undefined);
        setEditor(undefined);
        initializedDiscussion.current = false;
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
                if (!initializedDiscussion.current && result.currentDiscussion) {
                    initializedDiscussion.current = true;
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
        setFeedback('');
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
    async function openDiscussion(key = discussion, targetId = activeId, fresh = false, message) {
        selectDiscussion(key);
        if (!openConversation) {
            setError('请在 DSH 中打开原生对话；开发预览不连接模型。');
            return;
        }
        const result = await perform('open_discussion', { discussion: key, teamId: targetId, fresh, message });
        if (result?.openedSessionId) {
            if (result.openedSessionId === team?.captainSessionId || !result.openedSessionId.startsWith('session-at-discussion-')) {
                setError('宿主未返回独立讨论会话，已取消跳转');
                return;
            }
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
            await startEmbedded('graph', created.team.id);
    }
    async function saveEdit(operations, title, finishEditing = false) {
        const result = await perform('edit', { operations, title, base: data?.base, positions: Object.fromEntries(team?.tasks.map(task => [task.id, pos(task.id)]) ?? []) });
        if (result) {
            if (finishEditing)
                setEditor(undefined);
            setSelectedEdge(undefined);
        }
        return result;
    }
    async function startEmbedded(key, targetId = activeId, fresh = false) {
        setEditor(undefined);
        setSelectedEdge(undefined);
        setSelectedTask(undefined);
        selectDiscussion(key);
        const result = await perform('open_discussion', { discussion: key, teamId: targetId, fresh });
        if (result?.openedSessionId && result.openedSessionId.startsWith('session-at-discussion-') && result.openedSessionId !== team?.captainSessionId)
            setEmbeddedDiscussion(key);
        else if (result)
            setError('宿主未返回独立讨论会话');
    }
    function prepareDiscussion(name) { void startEmbedded(`member:${name}`, activeId); }
    async function deleteEdge() {
        const target = team?.tasks.find(task => task.id === selectedEdge?.to);
        if (!target || !selectedEdge || working)
            return;
        await saveEdit([{ action: 'update_task', id: target.id, dependencies: target.dependencies.filter(id => id !== selectedEdge.from) }], '删除任务交接');
    }
    async function deleteNode(id) {
        if (!team || working)
            return;
        const updates = team.tasks.filter(task => task.dependencies.includes(id)).map(task => ({ action: 'update_task', id: task.id, dependencies: task.dependencies.filter(dep => dep !== id) }));
        updates.push({ action: 'remove_task', id });
        if (await perform('edit', { operations: updates, title: '删除节点及其连接', base: data?.base, positions: Object.fromEntries(team.tasks.map(task => [task.id, pos(task.id)])) })) {
            setEditor(undefined);
            setSelectedTask(undefined);
        }
    }
    function beginNodeDrag(event, task) {
        if (event.button !== 0 || working || event.target.closest('[data-connection-handle]'))
            return;
        const target = event.currentTarget, start = point(event), original = pos(task.id);
        let last = original, moved = false;
        target.setPointerCapture(event.pointerId);
        const cleanup = () => { target.onpointermove = null; target.onpointerup = null; target.onpointercancel = null; if (target.hasPointerCapture(event.pointerId))
            target.releasePointerCapture(event.pointerId); };
        target.onpointermove = move => {
            const at = point(move);
            if (!moved && Math.hypot(at.x - start.x, at.y - start.y) < 4 / zoom)
                return;
            moved = true;
            suppressNodeClick.current = true;
            setSelectedTask(task.id);
            setSelectedEdge(undefined);
            last = { x: Math.min(10000, Math.max(0, original.x + at.x - start.x)), y: Math.min(10000, Math.max(0, original.y + at.y - start.y)) };
            setPositions(prev => ({ ...prev, [task.id]: last }));
        };
        target.onpointerup = () => { cleanup(); if (moved)
            void perform('layout', { taskId: task.id, ...last }).then(() => setPositions(prev => { const next = { ...prev }; delete next[task.id]; return next; })); };
        target.onpointercancel = () => { cleanup(); suppressNodeClick.current = false; setPositions(prev => { const next = { ...prev }; delete next[task.id]; return next; }); };
    }
    function edit(type, id) {
        setEditor({ type, id });
        setPane(type === 'member' ? 'members' : 'flow');
        setError('');
        setSelectedEdge(undefined);
        const m = team?.members.find(item => item.name === id), t = team?.tasks.find(item => item.id === id);
        setDraft(type === 'member' ? { name: m?.name ?? '', summary: m?.summary ?? m?.role ?? '', role: m?.role ?? '', executionPrompt: m?.executionPrompt ?? '', provider: m?.provider ?? '', model: m?.model ?? '', reasoningEffort: m?.reasoningEffort ?? '', routeChanged: '', rerunTaskId: m ? rerunnableTasks(team?.tasks ?? [], m.name).at(-1)?.id ?? '' : '', rerunInstructions: '' }
            : { subject: t?.subject ?? '', description: t?.description ?? '', assignee: t?.assignee ?? '' });
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
        x: 32,
        y: Math.max(-128, ...team?.tasks.map(t => pos(t.id).y) ?? []) + 160,
    };
    const graphWidth = Math.max(580, ...team?.tasks.map(t => pos(t.id).x + 265) ?? [], taskEditing ? draftPosition.x + 265 : 0);
    const graphHeight = Math.max(260, ...team?.tasks.map(t => pos(t.id).y + 170) ?? [], taskEditing ? draftPosition.y + 170 : 0);
    function fitCanvas() {
        if (!canvas.current)
            return;
        setZoom(Math.max(.45, Math.min(1, (canvas.current.clientWidth - 20) / graphWidth)));
    }
    async function openReview(id) {
        selectDiscussion(`check:${id}`);
        setSelectedTask(id);
        if (await perform('materials', { discussion: `check:${id}` })) {
            setOpened(true);
            await startEmbedded(`check:${id}`);
        }
    }
    function renderProposalReview() {
        if (!proposal || !team || !data)
            return null;
        return _jsx(ProposalReview, { team: team, proposal: proposal, base: data.base, busy: working, draft: reviewDrafts[proposal.id], onChange: draft => setReviewDrafts(prev => ({ ...prev, [proposal.id]: draft })), onApply: operations => void perform('apply', { proposalId: proposal.id, operations }).then(result => { if (result)
                setFeedback('修改已应用，可继续讨论。'); }), onDismiss: () => void perform('dismiss', { proposalId: proposal.id }).then(result => { if (result)
                setFeedback('修改已放弃，可以继续讨论。'); }) }, proposal.id);
    }
    const pendingProposals = Object.entries(team?.workflow?.discussions ?? {}).filter(([key, item]) => key.startsWith('discussion:') && item.proposal?.status === 'pending').map(([, item]) => item);
    const pendingCount = pendingProposals.length;
    const pendingNotice = pendingCount > 0 && _jsxs("div", { className: css.pendingNotice, role: "status", children: [_jsxs("strong", { children: ["\u6709 ", pendingCount, " \u9879\u4FEE\u6539\u7B49\u5F85\u786E\u8BA4"] }), pendingProposals.map(item => _jsxs("button", { type: "button", disabled: working || !!editor, onClick: () => { setSelectedTask(undefined); setSelectedEdge(undefined); selectDiscussion(item.key); setOpened(true); }, children: ["\u67E5\u770B\u5E76\u51B3\u5B9A \u00B7 ", item.proposal.title] }, item.key)), !!editor && _jsx("small", { children: "\u5148\u4FDD\u5B58\u6216\u53D6\u6D88\u5F53\u524D\u7F16\u8F91\uFF0C\u518D\u67E5\u770B\u5F85\u786E\u8BA4\u4FEE\u6539\u3002" })] });
    const reviewCount = data?.ready.length ?? waitingCount;
    const reviewNotice = !!data?.ready.length && _jsxs("div", { className: css.reviewNotice, role: "status", "aria-label": "\u7B49\u5F85\u4F60\u9A8C\u6536", children: [_jsxs("strong", { children: [_jsx("span", { className: css.reviewDot, "aria-hidden": true }), "\u7B49\u5F85\u4F60\u9A8C\u6536"] }), data.ready.map(id => _jsxs("button", { type: "button", disabled: working, onClick: () => void openReview(id), children: ["\u9A8C\u6536 \u00B7 ", team?.tasks.find(t => t.id === id)?.subject, " \u2197"] }, id)), !reviewEntryOnly && _jsx("small", { children: "\u4E0A\u6E38\u5DF2\u5B8C\u6210 \u00B7 \u6253\u5F00\u72EC\u7ACB\u5BF9\u8BDD\u67E5\u770B\u6750\u6599\u4E0E AI \u603B\u7ED3" })] });
    if (reviewEntryOnly && !opened)
        return _jsxs(_Fragment, { children: [reviewNotice, error && _jsx("span", { role: "alert", children: error })] });
    if (nativeOnly && !data?.currentDiscussion)
        return null;
    return _jsxs(_Fragment, { children: [data?.currentDiscussion && team && _jsxs("div", { className: css.nativeBanner, children: [_jsxs("span", { children: [data.currentDiscussion.startsWith('check:') ? '独立验收对话' : '独立配置对话', " \u00B7 ", team.name] }), _jsx("button", { className: css.entry, onClick: () => void openExecution?.(team.captainSessionId, team.captainSessionId), children: "\u8FD4\u56DE\u56E2\u961F\u5BF9\u8BDD \u2197" })] }), !reviewEntryOnly && _jsxs("button", { type: "button", className: `${css.entry} ${nativeOnly ? css.compact : css.launcher}`, "aria-haspopup": "dialog", onClick: () => setOpened(true), children: [_jsxs("strong", { children: ["\u56E2\u961F\u4E0E\u6D41\u7A0B ", _jsx("span", { "aria-hidden": true, children: "\u2197" })] }), !nativeOnly && _jsx("span", { children: team?.name ?? (activeId ? '查看成员、任务交接与人工检查' : '讨论目标，创建初步团队') }), pendingCount > 0 && _jsxs("span", { children: [pendingCount, " \u9879\u4FEE\u6539\u5F85\u786E\u8BA4"] }), reviewCount > 0 && _jsxs("span", { children: [reviewCount, " \u9879\u7B49\u5F85\u4EBA\u5DE5\u9A8C\u6536"] })] }), !nativeOnly && !reviewEntryOnly && team?.phase === 'staged' && _jsx("button", { type: "button", className: `${css.entry} ${css.startEntry}`, disabled: working || !!editor || pendingCount > 0, title: editor ? '请在工作台保存或取消当前编辑' : pendingCount ? '请先处理待确认的修改' : undefined, onClick: () => void perform('start'), children: "\u786E\u8BA4\u5E76\u542F\u52A8\u56E2\u961F" }), !opened && !nativeOnly && !reviewEntryOnly && pendingNotice, error && !opened && _jsx("div", { className: css.error, role: "alert", children: error }), !nativeOnly && reviewNotice, nativeOnly && data?.currentDiscussion && openContext && _jsx("button", { className: `${css.entry} ${css.compact}`, onClick: openContext, children: proposal ? '查看待确认修改 ↗' : '团队与讨论资料 ↗' }), embeddedContext && team && _jsxs("section", { className: css.contextPanel, "aria-label": "\u8BA8\u8BBA\u8D44\u6599", children: [_jsxs("header", { children: [_jsx("strong", { children: "\u8BA8\u8BBA\u8D44\u6599" }), _jsx("span", { children: "\u5F53\u524D\u5DF2\u4FDD\u5B58\u7684\u4FE1\u606F" })] }), _jsxs("label", { children: ["\u67E5\u770B\u5BF9\u8C61", _jsxs("select", { value: discussion, onChange: event => setDiscussion(event.target.value), children: [_jsx("option", { value: "graph", children: "\u56E2\u961F\u4E0E\u6D41\u7A0B" }), team.members.filter(m => m.status !== 'removed').map(m => _jsx("option", { value: `member:${m.name}`, children: m.name }, m.name)), team.tasks.filter(t => t.checkpoint).map(t => _jsxs("option", { value: `check:${t.id}`, children: ["\u9A8C\u6536 \u00B7 ", t.subject] }, t.id))] })] }), feedback && _jsx("p", { role: "status", children: feedback }), conversation?.materials && _jsxs("details", { children: [_jsx("summary", { children: "\u672C\u8F6E\u9A8C\u6536\u8BC1\u636E" }), _jsx(ReviewMaterials, { text: conversation.materials })] }), proposal && !opened && _jsxs("section", { className: css.contextProposal, "aria-label": "\u5F85\u786E\u8BA4\u4FEE\u6539", children: [renderProposalReview(), _jsx("button", { onClick: () => { setPane('discussion'); setOpened(true); }, children: "\u5728\u753B\u5E03\u67E5\u770B \u2197" })] }), _jsx(WorkflowContext, { team: team, discussion: discussion, onSelect: setDiscussion, openExecution: openExecution })] }), opened && createPortal(_jsxs("section", { ref: dialog, className: css.workbench, "data-editing": !!editor || !!selectedEdge || !!activeTask, role: "dialog", "aria-modal": "true", "aria-label": "TeamFlow \u7F16\u6392\u5DE5\u4F5C\u53F0", onKeyDown: event => {
                    if ((event.key === 'Delete' || event.key === 'Backspace') && (selectedEdge || selectedTask) && !event.target.closest('input,textarea,select,[contenteditable="true"]')) {
                        event.preventDefault();
                        if (selectedEdge)
                            void deleteEdge();
                        else if (selectedTask)
                            void deleteNode(selectedTask);
                        return;
                    }
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
                }, children: [_jsxs("header", { className: css.header, children: [_jsxs("div", { className: css.title, children: [_jsx("img", { src: LEAD_ART, alt: "" }), _jsxs("div", { children: [_jsx("strong", { children: team?.name ?? '创建团队' }), _jsx("span", { children: team?.phase === 'staged' ? '准备流程 · 确认后开始执行' : '团队工作台' })] })] }), _jsxs("div", { children: [team?.phase === 'staged' && _jsx("button", { className: css.primary, disabled: working || !!editor || pendingCount > 0, title: editor ? '请先保存或取消当前编辑' : pendingCount ? '请先处理待确认的修改' : undefined, onClick: () => void perform('start'), children: "\u786E\u8BA4\u5E76\u542F\u52A8" }), _jsx("button", { onClick: () => setOpened(false), "aria-label": "\u5173\u95ED\u7F16\u6392\u5DE5\u4F5C\u53F0", children: "\u5173\u95ED" })] })] }), team && _jsx("nav", { className: css.paneTabs, "aria-label": "\u5DE5\u4F5C\u53F0\u89C6\u56FE", children: ['members', 'flow', 'discussion'].map(value => _jsxs("button", { "aria-pressed": pane === value, onClick: () => setPane(value), children: [value === 'members' ? `成员 ${team.members.filter(m => m.status !== 'removed').length}` : value === 'flow' ? '任务流程' : '修改与验收', value === 'discussion' && proposal && _jsx("i", { "aria-label": "\u6709\u5F85\u786E\u8BA4\u7684\u4FEE\u6539" })] }, value)) }), pendingNotice, !!team?.tasks.some(task => task.workflowRerunRequired) && _jsxs("details", { className: css.suspendedNotice, open: true, children: [_jsxs("summary", { children: ["\u4E0A\u6E38\u5DF2\u91CD\u8DD1 \u00B7 ", team.tasks.filter(task => task.workflowRerunRequired).length, " \u4E2A\u4E0B\u6E38\u8282\u70B9\u7B49\u5F85\u4F60\u786E\u8BA4"] }), _jsx("p", { children: "\u6B64\u524D\u7ED3\u679C\u5DF2\u5931\u6548\u3002\u4E0A\u6E38\u5B8C\u6210\u540E\uFF0C\u70B9\u51FB\u8282\u70B9\u53EF\u4FEE\u6539\u8981\u6C42\uFF0C\u518D\u786E\u8BA4\u6267\u884C\u6216\u91CD\u65B0\u9A8C\u6536\u3002" }), team.tasks.filter(task => task.workflowRerunRequired).map(task => _jsxs("button", { disabled: working, onClick: () => { setSelectedTask(task.id); edit(task.checkpoint ? 'check' : 'task', task.id); }, children: [task.subject, " \u00B7 ", task.dependencies.every(id => team.tasks.find(item => item.id === id)?.status === 'completed') ? '可确认' : '等待上游'] }, task.id))] }), error && _jsx("div", { className: css.error, role: "alert", children: error }), !activeId ? _jsxs("form", { className: css.create, onSubmit: e => { e.preventDefault(); void createFlow(); }, children: [_jsx("h2", { children: "\u63CF\u8FF0\u76EE\u6807\uFF0C\u4E00\u8D77\u89C4\u5212\u56E2\u961F" }), _jsxs("label", { children: ["\u56E2\u961F\u540D\u79F0", _jsx("input", { required: true, value: name, onChange: e => setName(e.target.value) })] }), _jsxs("label", { children: ["\u56E2\u961F\u76EE\u6807", _jsx("textarea", { required: true, value: goal, onChange: e => setGoal(e.target.value) })] }), _jsx("button", { className: css.primary, disabled: working, children: "\u5728 DSH \u4E2D\u8BA8\u8BBA\u65B9\u6848 \u2197" })] }) : !team ? _jsx("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u56E2\u961F\u2026" }) : _jsxs("div", { className: css.columns, "data-approving": !!proposal && !editor && !activeTask && !selectedEdge, "data-pane": pane, "data-editing": !!editor || !!selectedEdge || !!activeTask, children: [_jsxs("aside", { className: css.roster, children: [_jsxs("h3", { children: ["\u6210\u5458 ", _jsx("button", { "aria-label": "\u6DFB\u52A0\u6210\u5458", disabled: working, onClick: () => edit('member'), children: "\uFF0B \u6DFB\u52A0" })] }), team.members.filter(m => m.status !== 'removed').map(m => _jsxs("article", { className: editor?.type === 'member' && editor.id === m.name ? css.selected : '', onClick: event => { if (!event.target.closest('button')) {
                                            selectDiscussion(`member:${m.name}`);
                                            setSelectedTask(undefined);
                                            edit('member', m.name);
                                        } }, children: [_jsxs("button", { className: css.member, disabled: working, onClick: () => { selectDiscussion(`member:${m.name}`); setSelectedTask(undefined); edit('member', m.name); }, children: [_jsx("img", { src: memberArtUrl(m.name, m.role ?? ''), alt: "" }), _jsxs("span", { children: [_jsx("strong", { children: m.name }), _jsx("span", { children: m.summary || m.role || '尚未填写职责概述' })] })] }), _jsx("small", { children: m.model || '继承队长模型' }), _jsxs("div", { children: [_jsx("button", { disabled: working, onClick: () => prepareDiscussion(m.name), children: "\u8BA8\u8BBA\u8C03\u6574 \u2197" }), m.id && openExecution && _jsx("button", { onClick: () => { openExecution(m.id, team.captainSessionId); setOpened(false); }, children: "\u6267\u884C\u5BF9\u8BDD \u2197" }), openExecution && m.previousSessionIds?.map((id, i) => _jsxs("button", { onClick: () => { openExecution(id, team.captainSessionId); setOpened(false); }, children: ["\u5386\u53F2\u6267\u884C ", i + 1, " \u2197"] }, id))] })] }, m.name)), _jsx("p", { className: css.hint, children: "\u70B9\u51FB\u6210\u5458\u5361\u7247\u76F4\u63A5\u7F16\u8F91\uFF1B\u8BA8\u8BBA\u8C03\u6574\u9ED8\u8BA4\u7EE7\u7EED\u8BE5\u6210\u5458\u7684\u72EC\u7ACB\u8BA8\u8BBA\uFF0C\u4FDD\u7559\u5386\u53F2\u4E0A\u4E0B\u6587\u3002" })] }), _jsxs("main", { className: css.graphArea, children: [_jsxs("nav", { className: css.toolbar, children: [_jsx("button", { disabled: working || !!editor, onClick: () => edit('task'), children: "\uFF0B \u4EFB\u52A1" }), _jsx("button", { disabled: working || !!editor, onClick: () => edit('check'), children: "\uFF0B \u4EBA\u5DE5\u68C0\u67E5" }), _jsx("button", { "aria-label": "\u7F29\u5C0F\u753B\u5E03", onClick: () => setZoom(value => Math.max(.45, value - .1)), children: "\u2212" }), _jsx("button", { "aria-label": "\u653E\u5927\u753B\u5E03", onClick: () => setZoom(value => Math.min(1.5, value + .1)), children: "\uFF0B" }), _jsx("button", { onClick: fitCanvas, children: "\u9002\u5E94\u753B\u5E03" }), _jsx("span", { role: link || taskEditing ? 'status' : undefined, children: link ? link.issue ?? (link.to ? '已吸附到输入端 · 松开连接' : '靠近下一节点以连接 · Esc 取消') : '拖动节点右侧中心连接柄建立交接；点击节点编辑属性、点击连线查看；Delete 删除选中对象' })] }), reviewNotice, _jsx("div", { className: css.canvas, ref: canvas, onPointerDown: event => { if (event.target === event.currentTarget || event.target.classList.contains(css.plane)) {
                                            setSelectedEdge(undefined);
                                            setSelectedTask(undefined);
                                            setEditor(undefined);
                                        } }, children: _jsxs("div", { className: css.plane, style: { width: graphWidth, height: graphHeight, zoom }, children: [_jsxs("svg", { className: css.edges, "aria-label": "\u4EFB\u52A1\u4EA4\u63A5\u8FDE\u7EBF", children: [_jsx("defs", { children: _jsx("marker", { id: "workflow-arrow", markerWidth: "8", markerHeight: "8", refX: "7", refY: "4", orient: "auto", children: _jsx("path", { d: "M0,0 L8,4 L0,8", fill: "currentColor" }) }) }), team.tasks.flatMap(t => t.dependencies.map(dep => {
                                                            const a = pos(dep), b = pos(t.id);
                                                            const path = `M${a.x + 225},${a.y + 55} C${a.x + 260},${a.y + 55} ${b.x - 35},${b.y + 55} ${b.x},${b.y + 55}`;
                                                            return _jsxs("g", { "data-selected": selectedEdge?.from === dep && selectedEdge.to === t.id, className: css.edge, children: [_jsx("path", { d: path, markerEnd: "url(#workflow-arrow)" }), _jsx("path", { className: css.edgeHit, d: path, role: "button", tabIndex: 0, "aria-label": `交接：${team.tasks.find(task => task.id === dep)?.subject ?? dep} → ${t.subject}`, "aria-pressed": selectedEdge?.from === dep && selectedEdge.to === t.id, onClick: () => { setSelectedEdge({ from: dep, to: t.id }); setSelectedTask(undefined); setEditor(undefined); setDiscussion('graph'); }, onKeyDown: event => { if (event.key === 'Enter' || event.key === ' ') {
                                                                            event.preventDefault();
                                                                            setSelectedEdge({ from: dep, to: t.id });
                                                                            setSelectedTask(undefined);
                                                                        } } })] }, `${dep}-${t.id}`);
                                                        })), link && _jsx("path", { d: `M${pos(link.from).x + 225},${pos(link.from).y + 55} C${pos(link.from).x + 280},${pos(link.from).y + 55} ${link.x - 55},${link.y} ${link.x},${link.y}` })] }), team.tasks.map(task => {
                                                    const p = pos(task.id);
                                                    return _jsxs("article", { "data-member-match": !!editor?.id && editor.type === 'member' && task.assignee === editor.id || undefined, "data-connection": link?.to === task.id ? link.issue ? 'invalid' : 'valid' : undefined, "data-review-ready": !!task.checkpoint && data.ready.includes(task.id), "data-suspended": task.workflowRerunRequired || undefined, className: `${css.node} ${task.checkpoint ? css.checkpoint : ''} ${selectedTask === task.id ? css.selected : ''}`, style: { left: p.x, top: p.y }, onPointerDown: event => beginNodeDrag(event, task), onClick: event => { if (working || event.target.closest('[data-connection-handle]'))
                                                            return; if (suppressNodeClick.current) {
                                                            suppressNodeClick.current = false;
                                                            return;
                                                        } ; setSelectedEdge(undefined); setSelectedTask(task.id); if (task.status === 'pending' && ((task.attempt ?? 0) === 0 || task.workflowRerunRequired) && !task.checkpoint?.decision)
                                                            edit(task.checkpoint ? 'check' : 'task', task.id);
                                                        else
                                                            setEditor(undefined); }, children: [_jsxs("div", { className: css.drag, children: ["\u283F ", task.checkpoint ? '◇ 人工验收' : '执行任务', " \u00B7 ", task.id] }), _jsxs("button", { className: css.nodeBody, children: [_jsx("strong", { children: task.subject }), _jsxs("span", { className: css.taskOwner, children: [_jsx("img", { src: task.checkpoint ? REVIEW_ART : memberArtUrl(task.assignee ?? '', team.members.find(m => m.name === task.assignee)?.role ?? ''), alt: "" }), task.checkpoint ? '验收 Agent 与你' : task.assignee || '自动分配成员'] }), _jsx("small", { "data-ready": data.ready.includes(task.id), children: taskStatus(task, data.ready) })] }), _jsx("button", { className: `${css.port} ${css.input}`, "data-connection-handle": true, "data-input-id": task.id, "aria-label": `${task.subject} 输入端` }), _jsx("button", { className: `${css.port} ${css.output}`, "data-connection-handle": true, "aria-label": `${task.subject} 输出端`, disabled: working || (taskEditing && !editor?.id), title: "\u4ECE\u8FD9\u91CC\u62D6\u51FA\u8FDE\u63A5\u7EBF", onPointerDown: event => {
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
                                                                        if (issue)
                                                                            setError(issue);
                                                                        if (to && !issue)
                                                                            void saveEdit([{ action: 'update_task', id: to.id, dependencies: [...to.dependencies, task.id] }], `连接 ${task.subject} → ${to.subject}`);
                                                                    };
                                                                    target.onpointercancel = cleanup;
                                                                } })] }, task.id);
                                                }), taskEditing && !editor?.id && _jsxs("article", { className: `${css.node} ${css.draftNode}`, style: { left: draftPosition.x, top: draftPosition.y }, children: [_jsx("div", { className: css.drag, children: "\u8349\u7A3F \u00B7 \u786E\u8BA4\u540E\u52A0\u5165\u6D41\u7A0B" }), _jsxs("div", { className: css.nodeBody, children: [_jsx("strong", { children: draft['subject'] || (editor?.type === 'check' ? '新人工检查' : '新任务') }), _jsx("span", { children: editor?.type === 'check' ? '你与独立验收 Agent' : draft['assignee'] || '待指定 Agent' }), _jsx("small", { children: "\u5C1A\u672A\u5E94\u7528" })] })] }), !team.tasks.length && !editor && _jsx("p", { className: css.empty, children: "\u6DFB\u52A0\u4EFB\u52A1\u6216\u4EBA\u5DE5\u68C0\u67E5\uFF0C\u6216\u8BA9 AI \u6839\u636E\u76EE\u6807\u63D0\u51FA\u6D41\u7A0B\u65B9\u6848\u3002" })] }) })] }), selectedEdge && _jsxs("aside", { className: css.editor, "aria-label": "\u4EA4\u63A5\u8BE6\u60C5", children: [_jsxs("strong", { children: [team.tasks.find(task => task.id === selectedEdge.from)?.subject, " \u2192 ", team.tasks.find(task => task.id === selectedEdge.to)?.subject] }), _jsx("p", { children: "\u4E0A\u6E38\u5B8C\u6210\u540E\uFF0C\u4E0B\u6E38\u624D\u5F00\u59CB\u3002\u6309 Delete \u5220\u9664\u6B64\u8FDE\u7EBF\u3002" }), _jsx("button", { disabled: working, onClick: () => void deleteEdge(), children: "\u5220\u9664\u8FDE\u7EBF" })] }), activeTask && !editor && !selectedEdge && _jsxs("aside", { className: css.editor, children: [_jsx("strong", { children: activeTask.subject }), _jsx("p", { children: activeTask.description || '暂无任务说明' }), _jsxs("div", { children: [!activeTask.checkpoint && activeTask.assignee && rerunnableTasks(team.tasks, activeTask.assignee).some(task => task.id === activeTask.id) && _jsx("button", { disabled: working, onClick: () => { selectDiscussion(`member:${activeTask.assignee}`); edit('member', activeTask.assignee); setDraft(prev => ({ ...prev, rerunTaskId: activeTask.id })); }, children: "\u4FEE\u6539\u8D1F\u8D23\u4EBA\u5E76\u91CD\u8DD1\u6B64\u4EFB\u52A1" }), !activeTask.checkpoint && !['completed', 'failed', 'cancelled'].includes(activeTask.status) && _jsx("button", { disabled: working, onClick: () => void perform(activeTask.workflowPaused ? 'resume_task' : 'stop_task', { taskId: activeTask.id, base: data.base }), children: activeTask.workflowPaused ? '继续执行' : '停止任务以编辑' })] })] }), !editor && !selectedEdge && !activeTask && _jsxs("aside", { className: css.discussion, children: [_jsxs("header", { children: [_jsx("img", { src: reviewTask ? REVIEW_ART : member ? memberArtUrl(member.name, member.role ?? '') : LEAD_ART, alt: "" }), _jsxs("div", { children: [_jsx("h3", { children: reviewTask ? `验收 · ${reviewTask.subject}` : member ? `成员职责 · ${member.name}` : '流程修改' }), _jsx("small", { children: reviewTask ? '一起检查成果，由你决定是否通过' : '讨论不影响执行，修改确认后生效' })] })] }), _jsxs("div", { className: css.messages, children: [_jsx("p", { className: css.hint, children: reviewTask ? '在原生验收对话中共同检查成果，回到这里确认验收决定。' : member ? '在这里与独立配置顾问讨论；队长对话保持独立。' : '在 DSH 原生对话中讨论团队与流程，修改方案会显示在这里。' }), embeddedDiscussion === discussion && activeId ? _jsx(EmbeddedDiscussion, { sessionId: sessionId, teamId: activeId, discussion: discussion }, `${activeId}:${discussion}:${conversation?.native?.sessionId}`) : _jsxs("button", { className: css.primary, disabled: working, onClick: () => member ? prepareDiscussion(member.name) : void startEmbedded(discussion), children: ["\u5728\u6B64\u5904", conversation?.native ? '继续' : '开始', "\u8BA8\u8BBA"] }), embeddedDiscussion === discussion && conversation?.native && openConversation && _jsx("button", { disabled: working, onClick: () => void openDiscussion(discussion), children: "\u6253\u5F00\u5B8C\u6574 DSH \u5BF9\u8BDD \u2197" }), _jsxs("details", { children: [_jsx("summary", { children: "\u67E5\u770B\u5F53\u524D\u8D44\u6599" }), _jsx(WorkflowContext, { team: team, discussion: discussion, onSelect: key => { selectDiscussion(key); if (key.startsWith('member:'))
                                                            edit('member', key.slice(7)); }, openExecution: openExecution })] }), conversation?.materials && _jsxs("details", { open: true, children: [_jsx("summary", { children: "\u672C\u8F6E\u9A8C\u6536\u6750\u6599\u4E0E\u8BC1\u636E" }), _jsx(ReviewMaterials, { text: conversation.materials })] }), data.busy.includes(discussion) && _jsx("p", { role: "status", children: "\u539F\u751F\u5BF9\u8BDD\u6B63\u5728\u6574\u7406\u65B9\u6848\u2026" })] }), proposal && _jsx("section", { className: css.proposal, children: renderProposalReview() }), reviewTask && conversation?.evidence && conversation.materialsRound === reviewTask.checkpoint?.round && data.ready.includes(reviewTask.id) && !reviewTask.checkpoint?.decision && _jsxs("div", { className: css.decisions, children: [_jsx("button", { className: css.primary, disabled: working, onClick: () => void perform('review', { taskId: reviewTask.id, evidence: conversation.evidence, decision: 'approve', note }).then(ok => { if (ok)
                                                    setNote(''); }), children: "\u901A\u8FC7\u9A8C\u6536" }), _jsx("button", { disabled: working, onClick: () => void perform('review', { taskId: reviewTask.id, evidence: conversation.evidence, decision: 'reject', note }).then(ok => { if (ok) {
                                                    setNote('');
                                                    void startEmbedded(discussion);
                                                } }), children: "\u9000\u56DE\u5E76\u8BA8\u8BBA\u8FD4\u5DE5" })] }), reviewTask?.checkpoint?.decision === 'reject' && _jsx("p", { className: css.notice, children: "\u5DF2\u62D2\u7EDD\uFF0C\u4E0B\u6E38\u4FDD\u6301\u7B49\u5F85\u3002\u8BF7\u8BA8\u8BBA\u8FD4\u5DE5\u5BF9\u8C61\u5E76\u786E\u8BA4\u65B0\u65B9\u6848\u3002" }), reviewTask && _jsxs("div", { className: css.composer, children: [_jsxs("label", { children: ["\u9A8C\u6536\u610F\u89C1\uFF08\u968F\u51B3\u5B9A\u4FDD\u5B58\uFF09", _jsx("textarea", { "aria-label": "\u9A8C\u6536\u610F\u89C1", value: note, onChange: e => setNote(e.target.value), placeholder: "\u8BB0\u5F55\u901A\u8FC7\u6216\u9000\u56DE\u7684\u539F\u56E0\u2026" })] }), _jsx("button", { disabled: working || !data.ready.includes(reviewTask.id), onClick: () => void perform('materials'), children: "\u5237\u65B0\u9A8C\u6536\u6750\u6599" })] }), !data.currentDiscussion && _jsxs("details", { children: [_jsx("summary", { children: "\u91CD\u65B0\u5F00\u59CB\u8BA8\u8BBA" }), _jsx("p", { className: css.hint, children: "\u65B0\u5EFA\u72EC\u7ACB\u8BA8\u8BBA\u4F1A\u5F52\u6863\u5F53\u524D\u8BA8\u8BBA\uFF0C\u4ECE\u5F53\u524D\u8D44\u6599\u91CD\u65B0\u5F00\u59CB\u3002" }), _jsx("button", { disabled: working || data.busy.includes(discussion), onClick: () => void startEmbedded(discussion, activeId, true), children: "\u65B0\u5EFA\u72EC\u7ACB\u8BA8\u8BBA" })] })] }), editor && _jsxs("form", { "data-workflow-editor": true, className: css.editor, onSubmit: event => {
                                    event.preventDefault();
                                    try {
                                        const route = draft['routeChanged'] ? { provider: draft['provider'], model: draft['model'], reasoningEffort: draft['reasoningEffort'] || 'default' } : {};
                                        const operations = editor.type === 'member' ? [editor.id ? { action: 'update_member', name: editor.id, summary: draft['summary'], role: draft['role'], executionPrompt: draft['executionPrompt'], ...route } : { action: 'add_member', name: draft['name'] ?? '', summary: draft['summary'] ?? '', role: draft['role'], executionPrompt: draft['executionPrompt'], ...route }]
                                            : [editor.id ? { action: 'update_task', id: editor.id, subject: draft['subject'] ?? '', description: draft['description'], assignee: editor.type === 'check' ? undefined : draft['assignee'] } : { action: 'add_task', checkpoint: editor.type === 'check', subject: draft['subject'] ?? '', description: draft['description'], assignee: editor.type === 'check' ? undefined : draft['assignee'], dependencies: [] }];
                                        const rerun = event.nativeEvent.submitter?.getAttribute('data-rerun') === 'true';
                                        if (rerun) {
                                            if (!editor.id || !draft['rerunTaskId'] || !team.tasks.some(task => task.id === draft['rerunTaskId'] && task.assignee === editor.id))
                                                throw new Error('请选择该成员的已结束任务');
                                            operations.push({ action: 'rerun_task', id: draft['rerunTaskId'], instructions: draft['rerunInstructions'] });
                                        }
                                        const resumeId = event.nativeEvent.submitter?.getAttribute('data-resume') === 'true' ? editor.id : undefined;
                                        const resumeCheck = editor.type === 'check';
                                        void saveEdit(operations, rerun ? '调整成员并单独重跑任务' : editor.type === 'member' ? '调整团队成员' : '调整任务', true).then(async (saved) => { if (saved && resumeId && await perform('resume_task', { taskId: resumeId, base: saved.base }) && resumeCheck)
                                            await openReview(resumeId); });
                                    }
                                    catch (error) {
                                        setError(String(error));
                                    }
                                }, children: [_jsxs("h3", { children: [editor.id ? '编辑' : '添加', editor.type === 'member' ? '成员' : editor.type === 'check' ? '人工检查' : '任务'] }), editor.type === 'member' ? _jsxs(_Fragment, { children: [field('name', '名称'), _jsxs("div", { className: css.memberModelSettings, children: [_jsx("strong", { children: "\u6A21\u578B\u4E0E Thinking" }), modelDirectory && t ? _jsx(StagedModelPicker, { directory: modelDirectory, t: t, provider: draft['provider'] ?? '', model: draft['model'] ?? '', reasoningEffort: draft['reasoningEffort'] ?? '', busy: working, onChange: selection => setDraft(prev => ({ ...prev, ...selection, routeChanged: 'yes' })) }) : _jsx("p", { className: css.hint, children: "\u6A21\u578B\u76EE\u5F55\u6682\u4E0D\u53EF\u7528\uFF0C\u8BF7\u5728 DSH \u56E2\u961F\u6D3B\u52A8\u9875\u9762\u6253\u5F00\u7F16\u8F91\u3002" })] }), field('summary', 'Summary · 功能概述', true), field('role', '长期职责', true), field('executionPrompt', '执行指令 / PE', true)] })
                                        : _jsxs(_Fragment, { children: [field('subject', '任务名称'), field('description', '任务要求 / 验收要求', true), editor.type !== 'check' && _jsxs("label", { children: ["\u6267\u884C Agent", _jsxs("select", { value: draft['assignee'] ?? '', onChange: e => setDraft({ ...draft, assignee: e.target.value }), children: [_jsx("option", { value: "", children: "\u7531\u7A7A\u95F2\u6210\u5458\u9886\u53D6" }), team.members.filter(m => m.status !== 'removed').map(m => _jsx("option", { children: m.name }, m.name))] })] }), _jsx("p", { className: css.hint, children: "\u4FDD\u5B58\u8282\u70B9\u540E\uFF0C\u76F4\u63A5\u62D6\u52A8\u753B\u5E03\u4E2D\u7684\u8FDE\u63A5\u67C4\u5EFA\u7ACB\u5173\u7CFB\u3002\u70B9\u51FB\u8FDE\u7EBF\u53EF\u67E5\u770B\u4E24\u7AEF\u5E76\u5220\u9664\u3002" })] }), editor.type === 'member' && editor.id && _jsx(TaskRerunPicker, { tasks: team.tasks, member: editor.id, taskId: draft['rerunTaskId'] ?? '', instructions: draft['rerunInstructions'] ?? '', disabled: working, onTask: id => setDraft(prev => ({ ...prev, rerunTaskId: id })), onInstructions: text => setDraft(prev => ({ ...prev, rerunInstructions: text })) }), editor.type !== 'member' && team.tasks.find(task => task.id === editor.id)?.workflowRerunRequired && _jsxs("p", { className: css.hint, children: ["\u4E0A\u6E38\u91CD\u8DD1\u540E\uFF0C\u6B64\u8282\u70B9\u7B49\u5F85\u4F60\u786E\u8BA4\u3002", team.tasks.find(task => task.id === editor.id).dependencies.some(id => team.tasks.find(task => task.id === id)?.status !== 'completed') ? `尚未完成：${team.tasks.find(task => task.id === editor.id).dependencies.filter(id => team.tasks.find(task => task.id === id)?.status !== 'completed').map(id => team.tasks.find(task => task.id === id)?.subject ?? id).join('、')}` : '上游已完成，确认后使用最新结果。'] }), _jsxs("footer", { children: [_jsx("button", { className: css.primary, disabled: working, children: "\u4FDD\u5B58" }), editor.type === 'member' && editor.id && draft['rerunTaskId'] && _jsx("button", { type: "submit", "data-rerun": "true", disabled: working, children: "\u4FDD\u5B58\u5E76\u4EC5\u91CD\u8DD1\u6240\u9009\u4EFB\u52A1" }), editor.id && editor.type !== 'member' && team.tasks.find(task => task.id === editor.id)?.workflowPaused && _jsxs("button", { type: "submit", "data-resume": "true", disabled: working || (team.tasks.find(task => task.id === editor.id)?.workflowRerunRequired && team.tasks.find(task => task.id === editor.id).dependencies.some(id => team.tasks.find(task => task.id === id)?.status !== 'completed')), children: ["\u4FDD\u5B58\u5E76\u786E\u8BA4", editor.type === 'check' ? '重新验收' : '执行'] }), editor.id && editor.type !== 'member' && _jsx("button", { type: "button", disabled: working, onClick: () => void deleteNode(editor.id), children: "\u5220\u9664\u8282\u70B9" }), editor.type === 'check' && editor.id && data.ready.includes(editor.id) && _jsx("button", { type: "button", disabled: working, onClick: () => void openReview(editor.id), children: "\u5F00\u59CB\u9A8C\u6536 \u2197" }), _jsx("button", { type: "button", onClick: () => setEditor(undefined), children: "\u53D6\u6D88" }), editor.type === 'member' && editor.id && _jsx("button", { type: "button", disabled: working, onClick: () => void saveEdit([{ action: 'remove_member', name: editor.id }], `移除 ${editor.id}`, true), children: "\u79FB\u9664\u6210\u5458" })] })] }, `${editor.type}:${editor.id ?? 'new'}`)] })] }), document.body)] });
}
