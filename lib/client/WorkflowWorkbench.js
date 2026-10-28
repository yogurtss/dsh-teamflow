import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/** Editable task canvas and isolated configuration / human-review discussions. */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import css from './WorkflowWorkbench.module.css';
import { TaskRecord, WorkflowContext } from "./WorkflowContext.js";
import { connectionIssue, connectionTarget, connectionPort, connectionPath, WORKFLOW_NODE_WIDTH, WORKFLOW_PORT_Y } from "./workflow-connections.js";
import { LEAD_ART, REVIEW_ART, memberArtUrl } from "./artwork.js";
import { StagedModelPicker } from "./StagingPlanEditor.js";
import { EmbeddedDiscussion } from "./EmbeddedDiscussion.js";
import { ProposalReview } from "./ProposalReview.js";
import { TaskRerunPicker } from "./TaskRerunPicker.js";
import { rerunImpact, rerunnableTasks } from "../task-rerun.js";
import { draftSource, editorKey, editorTarget, finishWorkbenchSave, initialEditorDraft, initialWorkbenchView, selectWorkbench, targetDiscussion } from "./workbench-selection.js";
import { publishWorkflowActivity } from "./activity-monitor.js";
import { arrangeTasks, clampZoom, fitGraph } from "./workflow-layout.js";
import { decodeDrafts, draftStorageKey, pendingDrafts, propertyOperation } from "./workbench-drafts.js";
import { taskReadiness } from "./task-readiness.js";
import { IconBranchOutline16, WorkflowIcon } from "./icons.js";
async function request(payload) {
    const response = await fetch('/plugins/dsh-agent-teams/workflow', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok)
        throw new Error(result.error ?? `HTTP ${response.status}`);
    if (!result.team)
        return;
    return result;
}
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
export function WorkflowWorkbench({ sessionId, teamId, archived = false, waitingCount = 0, openExecution, openConversation, nativeOnly = false, reviewEntryOnly = false, embeddedContext = false, onNativeContext, openContext, modelDirectory, t, entryTarget, onClose }) {
    const [opened, setOpened] = useState(!!entryTarget);
    const entryOpened = useRef(false);
    const [editing, setEditing] = useState(false);
    const [archiveView, setArchiveView] = useState(archived);
    const [data, setData] = useState();
    const [activeId, setActiveId] = useState(teamId);
    const [view, setView] = useState(initialWorkbenchView);
    const viewRef = useRef(view);
    const [error, setError] = useState('');
    const [feedback, setFeedback] = useState('');
    const [reviewDrafts, setReviewDrafts] = useState({});
    const [working, setWorking] = useState(false);
    const [saveState, setSaveState] = useState('saved');
    const [storageError, setStorageError] = useState('');
    const loadedDraftScope = useRef();
    const [note, setNote] = useState('');
    const [embeddedDiscussion, setEmbeddedDiscussion] = useState();
    const [pane, setPane] = useState('flow');
    const [name, setName] = useState('新团队');
    const [goal, setGoal] = useState('');
    const [zoom, setZoom] = useState(1);
    const [library, setLibrary] = useState('tasks');
    const [panMode, setPanMode] = useState(false);
    const [maximized, setMaximized] = useState(false);
    const [inspectorWidth, setInspectorWidth] = useState(360);
    const [inspectorExpanded, setInspectorExpanded] = useState(false);
    const [inspectorHidden, setInspectorHidden] = useState(false);
    const [positions, setPositions] = useState({});
    const [link, setLink] = useState();
    const suppressNodeClick = useRef(false);
    const suppressPanClick = useRef(false);
    const cancelLink = useRef(undefined);
    const canvas = useRef(null);
    const dialog = useRef(null);
    const mounted = useRef(true);
    const generation = useRef(0);
    const initializedDiscussion = useRef(false);
    const team = data?.team;
    const selection = view.target;
    const discussion = targetDiscussion(selection);
    const selectedTask = selection.type === 'task' || selection.type === 'check' ? selection.id : undefined;
    const selectedEdge = selection.type === 'edge' ? selection : undefined;
    const editor = !archiveView && editing ? editorTarget(team, selection, true) : undefined;
    const draftId = editor ? editorKey(team?.id ?? '', editor) : undefined;
    const draftEntry = draftId ? view.drafts[draftId] : undefined;
    const draft = draftEntry?.values ?? (editor ? initialEditorDraft(team, editor).values : {});
    const draftStale = !!editor && !!draftEntry && draftEntry.source !== draftSource(team, editor);
    const highlightedTask = selectedTask ?? (discussion.startsWith('check:') ? discussion.slice(6) : discussion.startsWith('task:') ? discussion.slice(5) : undefined);
    const relatedMember = selection.type === 'member' ? selection.id : selectedTask ? team?.tasks.find(task => task.id === selectedTask)?.assignee : discussion.startsWith('member:') ? discussion.slice(7) : undefined;
    const conversation = team?.workflow?.discussions[`discussion:${discussion}`];
    const proposal = conversation?.proposal?.status === 'pending' ? conversation.proposal : undefined;
    const reviewTask = discussion.startsWith('check:') ? team?.tasks.find(t => t.id === discussion.slice(6)) : undefined;
    const discussionTask = discussion.startsWith('task:') ? team?.tasks.find(t => t.id === discussion.slice(5) && !t.checkpoint) : undefined;
    const activeTask = team?.tasks.find(t => t.id === selectedTask);
    const terminalEdit = !!editor && editor.type !== 'member' && !!activeTask && !activeTask.checkpoint && ['completed', 'failed', 'cancelled'].includes(activeTask.status);
    const member = discussion.startsWith('member:') ? team?.members.find(m => m.name === discussion.slice(7)) : undefined;
    const defaultPositions = useMemo(() => arrangeTasks(team?.tasks ?? []), [team?.tasks]);
    const taskEditing = !!editor && editor.type !== 'member';
    const unsaved = pendingDrafts(team, view.drafts);
    const currentDirty = unsaved.some(item => item.key === draftId);
    const unconfigured = team?.tasks.filter(task => task.workflowConfigPending) ?? [];
    const taskStatus = (task, _ready) => taskReadiness(team, task).label;
    useEffect(() => {
        if (!activeId || !team || team.id !== activeId)
            return;
        const scope = draftStorageKey(sessionId, activeId);
        if (loadedDraftScope.current !== scope) {
            loadedDraftScope.current = scope;
            try {
                const restored = decodeDrafts(sessionStorage.getItem(scope), activeId);
                updateView(current => ({ ...current, drafts: { ...restored, ...current.drafts } }));
                setStorageError('');
            }
            catch {
                setStorageError('当前浏览器无法保存草稿，刷新前请保存属性。');
            }
            return;
        }
        try {
            const drafts = Object.fromEntries(pendingDrafts(team, view.drafts).map(item => [item.key, item.entry]));
            if (Object.keys(drafts).length)
                sessionStorage.setItem(scope, JSON.stringify({ version: 1, drafts }));
            else
                sessionStorage.removeItem(scope);
            setStorageError('');
        }
        catch {
            setStorageError('草稿备份失败，刷新前请保存属性。');
        }
    }, [sessionId, activeId, team, view.drafts]);
    useEffect(() => {
        if (!storageError || !unsaved.length)
            return;
        const warn = (event) => { event.preventDefault(); event.returnValue = ''; };
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [storageError, unsaved.length]);
    useEffect(() => { onNativeContext?.(!!data?.currentDiscussion); }, [data?.currentDiscussion, onNativeContext]);
    useEffect(() => {
        if (!entryTarget || entryOpened.current || !team)
            return;
        entryOpened.current = true;
        const task = team.tasks.find(task => task.id === entryTarget.taskId);
        if (!task) {
            setError('节点已不存在，请刷新任务列表');
            return;
        }
        choose({ type: task.checkpoint ? 'check' : 'task', id: task.id });
        if (entryTarget.rerun && !archiveView && !team.halted && team.phase !== 'staged' && !task.checkpoint && ['completed', 'failed', 'cancelled'].includes(task.status))
            setEditing(true);
        if (entryTarget.review && data?.ready.includes(task.id))
            void openReview(task.id);
    }, [team, entryTarget]);
    function updateView(update) { const next = update(viewRef.current); viewRef.current = next; setView(next); }
    function choose(target, overrides) {
        updateView(current => selectWorkbench(current, target, team, overrides));
        setError('');
        setFeedback('');
        setInspectorHidden(false);
        if (target.type === 'member')
            setLibrary('agents');
        if (target.type === 'task' || target.type === 'check')
            setLibrary('tasks');
        setPane(target.type === 'member' ? 'discussion' : target.type === 'task' || target.type === 'check' || target.type === 'edge' ? 'flow' : 'discussion');
    }
    const selectDiscussion = (key) => choose({ type: 'discussion', key });
    function closeWorkbench() { updateView(current => ({ ...current, revision: current.revision + 1 })); setOpened(false); onClose?.(); }
    function setDraft(update) {
        if (!editor || !draftId)
            return;
        updateView(current => { const entry = current.drafts[draftId] ?? initialEditorDraft(team, editor); return { ...current, drafts: { ...current.drafts, [draftId]: { ...entry, values: typeof update === 'function' ? update(entry.values) : update } } }; });
    }
    function cancelEdit() {
        if (draftId)
            updateView(current => { const drafts = { ...current.drafts }; delete drafts[draftId]; return { ...current, drafts }; });
        selectDiscussion(editor?.type === 'member' && editor.id ? `member:${editor.id}` : 'graph');
    }
    useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
    useEffect(() => { setArchiveView(archived); }, [archived]);
    useEffect(() => {
        if (!opened)
            return;
        const previous = document.activeElement;
        const overflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        dialog.current?.querySelector('button, input')?.focus();
        return () => { document.body.style.overflow = overflow; previous?.focus(); };
    }, [opened]);
    useEffect(() => {
        if (editor && !editor.id)
            dialog.current?.querySelector('[data-workflow-editor] input:not(:disabled), [data-workflow-editor] textarea')?.focus();
    }, [editor]);
    useEffect(() => { if (teamId && teamId !== activeId) {
        setActiveId(teamId);
        setData(undefined);
        updateView(current => ({ ...initialWorkbenchView(), revision: current.revision + 1 }));
        setPositions({});
        initializedDiscussion.current = false;
        generation.current++;
    } }, [sessionId, teamId]);
    const refresh = async () => {
        const token = generation.current;
        try {
            const result = await request({ sessionId, teamId: activeId, action: archiveView ? 'archive_state' : 'state' });
            if (!result)
                return;
            if (mounted.current && token === generation.current) {
                setData(result);
                setActiveId(result.team.id);
                if (!initializedDiscussion.current && result.currentDiscussion) {
                    initializedDiscussion.current = true;
                    if (viewRef.current.revision === 0)
                        selectDiscussion(result.currentDiscussion);
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
    }, [activeId, working, archiveView]);
    async function perform(action, fields = {}) {
        if (archiveView && action !== 'restore_archive') {
            setError('请先恢复归档，再修改或重新执行。');
            return;
        }
        setWorking(true);
        const saving = action === 'edit' || action === 'layout';
        if (saving)
            setSaveState('saving');
        setError('');
        setFeedback('');
        const token = ++generation.current;
        try {
            const result = await request({ sessionId, teamId: activeId, discussion, action, ...fields });
            if (!result) {
                if (saving)
                    setSaveState('error');
                return;
            }
            if (saving)
                setSaveState('saved');
            if (action === 'restore_archive') {
                setArchiveView(false);
                setEditing(false);
                setFeedback('已恢复为待确认流程。已完成成果保留；确认成员配置并启动后，可修改和重跑。');
            }
            if (result.activity)
                publishWorkflowActivity(result.activity);
            if (mounted.current && token === generation.current) {
                setData(result);
                setActiveId(result.team.id);
            }
            return result;
        }
        catch (err) {
            if (mounted.current) {
                setError(err instanceof Error ? err.message : String(err));
                if (saving)
                    setSaveState('error');
            }
            ;
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
        const revision = viewRef.current.revision;
        if (!openConversation) {
            setError('请在 DSH 中打开原生对话；开发预览不连接模型。');
            return;
        }
        const result = await perform('open_discussion', { discussion: key, teamId: targetId, fresh, message });
        if (result?.openedSessionId && viewRef.current.revision === revision) {
            if (result.openedSessionId === team?.captainSessionId || !result.openedSessionId.startsWith('session-at-discussion-')) {
                setError('宿主未返回独立讨论会话，已取消跳转');
                return;
            }
            try {
                await openConversation(result.openedSessionId);
                closeWorkbench();
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
        if (finishEditing && draftStale) {
            setError('当前对象已变化。草稿已保留，请先核对最新资料，或点击「重新载入」后编辑。');
            return;
        }
        const revision = viewRef.current.revision, submitted = draftId && editor ? (viewRef.current.drafts[draftId] ?? initialEditorDraft(team, editor)) : undefined;
        const result = await perform('edit', { operations, title, base: data?.base, positions: Object.fromEntries(team?.tasks.map(task => [task.id, pos(task.id)]) ?? []) });
        if (result && finishEditing) {
            let nextTarget;
            if (editor?.id && (editor.type === 'member' ? !result.team.members.some(m => m.name === editor.id && m.status !== 'removed') : !result.team.tasks.some(task => task.id === editor.id)))
                nextTarget = { type: 'discussion', key: 'graph' };
            if (editor && !editor.id) {
                if (editor.type === 'member') {
                    const added = operations.find(op => op.action === 'add_member');
                    if (added?.action === 'add_member')
                        nextTarget = { type: 'member', id: added.name.trim() };
                }
                else {
                    const added = result.team.tasks.find(task => !team?.tasks.some(old => old.id === task.id));
                    if (added)
                        nextTarget = { type: added.checkpoint ? 'check' : 'task', id: added.id };
                }
            }
            updateView(current => finishWorkbenchSave(current, draftId, submitted, revision, result.team, nextTarget, editor));
            if (viewRef.current.revision === revision)
                setFeedback(draftId && viewRef.current.drafts[draftId] ? '已保存本次提交；后续修改仍为草稿。' : '已保存。');
        }
        return result;
    }
    async function saveAllProperties() {
        if (!team || working || archiveView)
            return;
        const submitted = pendingDrafts(team, viewRef.current.drafts), revision = viewRef.current.revision;
        if (!submitted.length)
            return;
        try {
            if (submitted.length > 50)
                throw new Error('一次最多保存 50 个对象，请先逐项保存部分草稿。');
            const operations = submitted.map(item => propertyOperation(team, item.target, item.entry));
            const result = await saveEdit(operations, '保存全部属性草稿');
            if (!result)
                return;
            updateView(current => {
                let next = current;
                for (const item of submitted)
                    next = finishWorkbenchSave(next, item.key, item.entry, revision, result.team, undefined, item.target);
                if (current.revision === revision && selection.type === 'member' && !selection.id) {
                    const added = submitted.find(item => item.target.type === 'member' && !item.target.id);
                    if (added)
                        next = selectWorkbench(next, { type: 'member', id: added.entry.values['name'].trim() }, result.team);
                }
                return next;
            });
            setFeedback('本次提交的属性已保存；待配置节点仍需单独完成配置，任务不会自动重跑。');
        }
        catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
    }
    function locateTask(id) {
        const task = team?.tasks.find(item => item.id === id);
        if (!task)
            return;
        choose({ type: task.checkpoint ? 'check' : 'task', id });
        requestAnimationFrame(() => { const p = pos(id); canvas.current?.scrollTo({ left: Math.max(0, p.x * zoom - 48), top: Math.max(0, p.y * zoom - 48), behavior: 'smooth' }); });
    }
    function renderReadiness(task) {
        if (!team)
            return null;
        const state = taskReadiness(team, task);
        return _jsxs("section", { className: css.readiness, "aria-label": "\u6267\u884C\u6761\u4EF6", children: [_jsx("strong", { children: state.label }), _jsx("p", { children: state.detail }), state.dependencies.map(id => _jsxs("button", { type: "button", onClick: () => locateTask(id), children: ["\u5B9A\u4F4D \u00B7 ", team.tasks.find(item => item.id === id)?.subject ?? id] }, id))] });
    }
    async function startEmbedded(key, targetId = activeId, fresh = false) {
        selectDiscussion(key);
        const revision = viewRef.current.revision;
        const result = await perform('open_discussion', { discussion: key, teamId: targetId, fresh });
        if (revision !== viewRef.current.revision)
            return;
        if (result?.openedSessionId && result.openedSessionId.startsWith('session-at-discussion-') && result.openedSessionId !== team?.captainSessionId)
            setEmbeddedDiscussion(key);
        else if (result)
            setError('宿主未返回独立讨论会话');
    }
    function prepareDiscussion(name) { void startEmbedded(`member:${name}`, activeId); }
    async function deleteEdge() {
        const target = team?.tasks.find(task => task.id === selectedEdge?.to);
        if (!target || !selectedEdge || working || archiveView || !editing)
            return;
        const revision = viewRef.current.revision;
        if (await saveEdit([{ action: 'update_task', id: target.id, dependencies: target.dependencies.filter(id => id !== selectedEdge.from) }], '删除任务交接') && revision === viewRef.current.revision)
            selectDiscussion('graph');
    }
    async function deleteNode(id) {
        if (!team || working || archiveView || !editing)
            return;
        const updates = team.tasks.filter(task => task.dependencies.includes(id)).map(task => ({ action: 'update_task', id: task.id, dependencies: task.dependencies.filter(dep => dep !== id) }));
        updates.push({ action: 'remove_task', id });
        const revision = viewRef.current.revision;
        if (await perform('edit', { operations: updates, title: '删除节点及其连接', base: data?.base, positions: Object.fromEntries(team.tasks.map(task => [task.id, pos(task.id)])) })) {
            updateView(current => { const drafts = { ...current.drafts }; delete drafts[editorKey(team.id, { type: 'task', id })]; delete drafts[editorKey(team.id, { type: 'check', id })]; return { ...current, drafts }; });
            if (revision === viewRef.current.revision)
                selectDiscussion('graph');
        }
    }
    function beginNodeDrag(event, task) {
        suppressNodeClick.current = false;
        if (panMode || event.button !== 0 || working || archiveView || !editing || event.target.closest('[data-connection-handle]'))
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
            if (!moved)
                edit(task.checkpoint ? 'check' : 'task', task.id);
            moved = true;
            suppressNodeClick.current = true;
            last = { x: Math.min(10000, Math.max(0, original.x + at.x - start.x)), y: Math.min(10000, Math.max(0, original.y + at.y - start.y)) };
            setPositions(prev => ({ ...prev, [task.id]: last }));
        };
        target.onpointerup = () => { cleanup(); if (moved)
            void perform('layout', { taskId: task.id, ...last }).then(() => setPositions(prev => { const next = { ...prev }; delete next[task.id]; return next; })); };
        target.onpointercancel = () => { cleanup(); suppressNodeClick.current = false; setPositions(prev => { const next = { ...prev }; delete next[task.id]; return next; }); };
    }
    function edit(type, id, overrides) { if (!archiveView)
        setEditing(true); choose({ type, id }, overrides); }
    const field = (key, label, multiline = false) => _jsxs("label", { children: [label, multiline
                ? _jsx("textarea", { required: (key === 'summary' && !editor?.id) || (key === 'description' && !!activeTask?.workflowConfigPending), value: draft[key] ?? '', onChange: e => setDraft({ ...draft, [key]: e.target.value }) })
                : _jsx("input", { required: key === 'name' || key === 'subject' || (key === 'summary' && !editor?.id), value: draft[key] ?? '', disabled: key === 'name' && (!!editor?.id || working), onChange: e => setDraft({ ...draft, [key]: e.target.value }) })] });
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
        setZoom(fitGraph(canvas.current.clientWidth, canvas.current.clientHeight, graphWidth, graphHeight));
        canvas.current.scrollTo(0, 0);
    }
    function changeZoom(value, clientX, clientY) {
        const viewport = canvas.current;
        if (!viewport)
            return;
        const bounds = viewport.getBoundingClientRect(), next = clampZoom(value);
        const x = clientX === undefined ? viewport.clientWidth / 2 : clientX - bounds.left;
        const y = clientY === undefined ? viewport.clientHeight / 2 : clientY - bounds.top;
        const left = (viewport.scrollLeft + x) * next / zoom - x;
        const top = (viewport.scrollTop + y) * next / zoom - y;
        setZoom(next);
        requestAnimationFrame(() => viewport.scrollTo(Math.max(0, left), Math.max(0, top)));
    }
    useEffect(() => {
        const viewport = canvas.current;
        if (!opened || !viewport)
            return;
        const wheel = (event) => {
            if (event.deltaY === 0)
                return;
            event.preventDefault();
            const pixels = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport.clientHeight : 1);
            const delta = Math.max(-120, Math.min(120, pixels));
            changeZoom(zoom * Math.exp(-delta * .002), event.clientX, event.clientY);
        };
        viewport.addEventListener('wheel', wheel, { passive: false });
        return () => viewport.removeEventListener('wheel', wheel);
    }, [opened, zoom, !!team]);
    useLayoutEffect(() => {
        // CSS zoom rounds borders to device pixels. Use the rendered border widths
        // so ports remain on the SVG's outer-box anchors at fractional zoom too.
        const measured = Array.from(canvas.current?.querySelectorAll('[data-canvas-node]') ?? []).map(node => {
            const style = getComputedStyle(node);
            return { node, side: style.borderLeftWidth, top: style.borderTopWidth };
        });
        for (const { node, side, top } of measured) {
            node.style.setProperty('--node-side-border', side);
            node.style.setProperty('--node-top-border', top);
        }
    }, [opened, zoom, team?.tasks]);
    function beginPan(event) {
        if (event.button !== 0 && event.button !== 1)
            return;
        const blank = event.target === event.currentTarget || event.target.classList.contains(css.plane);
        if (event.button !== 1 && !panMode && !blank && editing && !archiveView)
            return;
        if (event.target.closest('[data-connection-handle]'))
            return;
        const immediate = blank || panMode || event.button === 1;
        if (immediate) {
            event.preventDefault();
            event.stopPropagation();
        }
        const target = event.currentTarget, x = event.clientX, y = event.clientY;
        const left = target.scrollLeft, top = target.scrollTop;
        let moved = false;
        suppressPanClick.current = false;
        if (immediate)
            target.setPointerCapture(event.pointerId);
        target.onpointermove = move => {
            if (!moved && Math.hypot(move.clientX - x, move.clientY - y) <= 4)
                return;
            if (!moved) {
                moved = true;
                target.setPointerCapture(event.pointerId);
                target.dataset.dragging = 'true';
            }
            move.preventDefault();
            suppressPanClick.current = true;
            target.scrollTo(left - move.clientX + x, top - move.clientY + y);
        };
        const cleanup = () => { target.onpointermove = null; target.onpointerup = null; target.onpointercancel = null; delete target.dataset.dragging; if (target.hasPointerCapture(event.pointerId))
            target.releasePointerCapture(event.pointerId); };
        target.onpointerup = () => { cleanup(); if (!moved && blank && !panMode)
            selectDiscussion('graph'); };
        target.onpointercancel = () => { cleanup(); suppressPanClick.current = false; };
    }
    function resizeInspector(event) {
        if (event.button !== 0)
            return;
        event.preventDefault();
        const target = event.currentTarget, right = target.parentElement.getBoundingClientRect().right;
        setInspectorExpanded(false);
        target.setPointerCapture(event.pointerId);
        target.onpointermove = move => setInspectorWidth(Math.max(300, Math.min(720, right - move.clientX)));
        const cleanup = () => { target.onpointermove = null; target.onpointerup = null; target.onpointercancel = null; if (target.hasPointerCapture(event.pointerId))
            target.releasePointerCapture(event.pointerId); };
        target.onpointerup = cleanup;
        target.onpointercancel = cleanup;
    }
    async function arrangeCanvas() {
        if (!team || working || archiveView)
            return;
        const result = await perform('layout', { positions: defaultPositions });
        if (result) {
            setPositions({});
            setFeedback('已按任务依赖整理布局。');
        }
    }
    async function createNode(type) {
        if (!team || working || archiveView)
            return;
        const revision = viewRef.current.revision;
        const label = type === 'check' ? '人工检查' : '新任务';
        let number = team.tasks.length + 1;
        while (team.tasks.some(task => task.subject === `${label} ${number}`))
            number++;
        const result = await saveEdit([{ action: 'add_task', subject: `${label} ${number}`, checkpoint: type === 'check', configurationPending: true, dependencies: [] }], `创建${label}`);
        if (!result || revision !== viewRef.current.revision)
            return;
        const added = result.team.tasks.find(task => !team.tasks.some(old => old.id === task.id));
        if (!added)
            return;
        setEditing(true);
        setPanMode(false);
        updateView(current => selectWorkbench(current, { type, id: added.id }, result.team));
        setLibrary('tasks');
        setPane('flow');
        setInspectorHidden(false);
        setFeedback('节点已保存，可直接连线；填写要求并完成配置前不会执行或进入验收。');
        requestAnimationFrame(() => {
            const p = result.team.workflow?.positions[`task:${added.id}`];
            if (p)
                canvas.current?.scrollTo({ left: Math.max(0, p.x * zoom - 48), top: Math.max(0, p.y * zoom - 48), behavior: 'smooth' });
        });
    }
    async function openReview(id) {
        selectDiscussion(`check:${id}`);
        const revision = viewRef.current.revision;
        if (await perform('materials', { discussion: `check:${id}` }) && revision === viewRef.current.revision) {
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
    const pendingProposals = Object.entries(team?.workflow?.discussions ?? {}).filter(([key, item]) => !archiveView && key.startsWith('discussion:') && item.proposal?.status === 'pending').map(([, item]) => item);
    const pendingCount = pendingProposals.length;
    const pendingNotice = pendingCount > 0 && _jsxs("div", { className: css.pendingNotice, role: "status", children: [_jsxs("strong", { children: ["\u6709 ", pendingCount, " \u9879\u4FEE\u6539\u7B49\u5F85\u786E\u8BA4"] }), pendingProposals.map(item => _jsxs("button", { type: "button", onClick: () => { selectDiscussion(item.key); setOpened(true); }, children: ["\u67E5\u770B\u5E76\u51B3\u5B9A \u00B7 ", item.proposal.title] }, item.key)), !!editor && _jsx("small", { children: "\u5207\u6362\u67E5\u770B\u4F1A\u4FDD\u7559\u5F53\u524D\u8349\u7A3F\u3002" })] });
    const reviewCount = archiveView ? 0 : data?.ready.length ?? waitingCount;
    const reviewNotice = !archiveView && !!data?.ready.length && _jsxs("div", { className: css.reviewNotice, role: "status", "aria-label": "\u7B49\u5F85\u4F60\u9A8C\u6536", children: [_jsxs("strong", { children: [_jsx("span", { className: css.reviewDot, "aria-hidden": true }), "\u7B49\u5F85\u4F60\u9A8C\u6536"] }), data.ready.map(id => _jsxs("button", { type: "button", disabled: working, onClick: () => void openReview(id), children: ["\u9A8C\u6536 \u00B7 ", team?.tasks.find(t => t.id === id)?.subject, " \u2197"] }, id)), !reviewEntryOnly && _jsx("small", { children: "\u4E0A\u6E38\u5DF2\u5B8C\u6210 \u00B7 \u6253\u5F00\u72EC\u7ACB\u5BF9\u8BDD\u67E5\u770B\u6750\u6599\u4E0E AI \u603B\u7ED3" })] });
    if (reviewEntryOnly && !opened)
        return _jsxs(_Fragment, { children: [reviewNotice, error && _jsx("span", { role: "alert", children: error })] });
    if (nativeOnly && !data?.currentDiscussion)
        return null;
    return _jsxs(_Fragment, { children: [data?.currentDiscussion && team && _jsxs("div", { className: css.nativeBanner, children: [_jsxs("span", { children: [data.currentDiscussion.startsWith('check:') ? '独立验收对话' : '独立配置对话', " \u00B7 ", team.name] }), _jsx("button", { className: css.entry, onClick: () => void openExecution?.(team.captainSessionId, team.captainSessionId), children: "\u8FD4\u56DE\u56E2\u961F\u5BF9\u8BDD \u2197" })] }), !reviewEntryOnly && _jsxs("button", { type: "button", className: `${css.entry} ${nativeOnly ? css.compact : css.launcher}`, "aria-haspopup": "dialog", onClick: () => setOpened(true), children: [_jsxs("strong", { children: [_jsxs("span", { className: css.iconLabel, children: [_jsx(IconBranchOutline16, {}), "\u56E2\u961F\u4E0E\u6D41\u7A0B"] }), _jsx("span", { "aria-hidden": true, children: "\u2197" })] }), !nativeOnly && _jsxs("span", { children: [archiveView ? '归档画布 · ' : '', team?.name ?? (activeId ? '查看成员、任务交接与人工检查' : '讨论目标，创建初步团队')] }), pendingCount > 0 && _jsxs("span", { children: [pendingCount, " \u9879\u4FEE\u6539\u5F85\u786E\u8BA4"] }), reviewCount > 0 && _jsxs("span", { children: [reviewCount, " \u9879\u7B49\u5F85\u4EBA\u5DE5\u9A8C\u6536"] })] }), !nativeOnly && !reviewEntryOnly && !archiveView && team?.phase === 'staged' && _jsx("button", { type: "button", className: `${css.entry} ${css.startEntry}`, disabled: working || unsaved.length > 0 || unconfigured.length > 0 || pendingCount > 0, title: unsaved.length ? '请先保存属性草稿' : unconfigured.length ? '请先完成待配置节点' : pendingCount ? '请先处理待确认的修改' : undefined, onClick: () => void perform('start'), children: "\u786E\u8BA4\u5E76\u542F\u52A8\u56E2\u961F" }), !opened && !nativeOnly && !reviewEntryOnly && pendingNotice, error && !opened && _jsx("div", { className: css.error, role: "alert", children: error }), !nativeOnly && reviewNotice, nativeOnly && data?.currentDiscussion && openContext && _jsx("button", { className: `${css.entry} ${css.compact}`, onClick: openContext, children: proposal ? '查看待确认修改 ↗' : '团队与讨论资料 ↗' }), embeddedContext && team && _jsxs("section", { className: css.contextPanel, "aria-label": "\u8BA8\u8BBA\u8D44\u6599", children: [_jsxs("header", { children: [_jsx("strong", { children: "\u8BA8\u8BBA\u8D44\u6599" }), _jsx("span", { children: "\u5F53\u524D\u5DF2\u4FDD\u5B58\u7684\u4FE1\u606F" })] }), _jsxs("label", { children: ["\u67E5\u770B\u5BF9\u8C61", _jsxs("select", { value: discussion, onChange: event => selectDiscussion(event.target.value), children: [_jsx("option", { value: "graph", children: "\u56E2\u961F\u4E0E\u6D41\u7A0B" }), team.members.filter(m => m.status !== 'removed').map(m => _jsx("option", { value: `member:${m.name}`, children: m.name }, m.name)), team.tasks.map(t => _jsxs("option", { value: `${t.checkpoint ? 'check' : 'task'}:${t.id}`, children: [t.checkpoint ? '验收' : '任务', " \u00B7 ", t.subject] }, t.id))] })] }), feedback && _jsx("p", { role: "status", children: feedback }), conversation?.materials && _jsxs("details", { children: [_jsx("summary", { children: "\u672C\u8F6E\u9A8C\u6536\u8BC1\u636E" }), _jsx(ReviewMaterials, { text: conversation.materials })] }), proposal && !opened && _jsxs("section", { className: css.contextProposal, "aria-label": "\u5F85\u786E\u8BA4\u4FEE\u6539", children: [renderProposalReview(), _jsx("button", { onClick: () => { setPane('discussion'); setOpened(true); }, children: "\u5728\u753B\u5E03\u67E5\u770B \u2197" })] }), _jsx(WorkflowContext, { team: team, discussion: discussion, onSelect: selectDiscussion, openExecution: openExecution })] }), opened && createPortal(_jsxs("section", { ref: dialog, className: css.workbench, style: { '--wb-node-width': `${WORKFLOW_NODE_WIDTH}px`, '--wb-port-y': `${WORKFLOW_PORT_Y}px` }, "data-maximized": maximized, "data-editing": !!editor || !!selectedEdge || !!activeTask, role: "dialog", "aria-modal": "true", "aria-label": "TeamFlow \u7F16\u6392\u5DE5\u4F5C\u53F0", onKeyDown: event => {
                    if (!archiveView && editing && (event.key === 'Delete' || event.key === 'Backspace') && (selectedEdge || selectedTask) && !event.target.closest('input,textarea,select,[contenteditable="true"]')) {
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
                        if (editor) {
                            setEditing(false);
                            setFeedback('已退出编辑，未保存的草稿已保留。');
                        }
                        else
                            closeWorkbench();
                    }
                    if (event.key === 'Tab') {
                        const scope = dialog.current;
                        const items = [...scope?.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), summary, [tabindex="0"]') ?? []].filter(el => el.getClientRects().length);
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
                }, children: [_jsxs("header", { className: css.header, children: [_jsxs("div", { className: css.title, children: [_jsx("img", { src: LEAD_ART, alt: "" }), _jsxs("div", { children: [_jsx("strong", { children: team?.name ?? '创建团队' }), _jsx("span", { children: archiveView ? '归档画布 · 成果与详情完整保留' : team?.phase === 'staged' ? '准备流程 · 确认后开始执行' : '团队工作台' })] })] }), _jsxs("div", { children: [archiveView ? _jsxs("button", { className: css.primary, disabled: working, onClick: () => void perform('restore_archive'), children: [_jsx(WorkflowIcon, { name: "edit" }), "\u6062\u590D\u5E76\u7F16\u8F91\u6D41\u7A0B"] }) : _jsxs("button", { "aria-pressed": editing, onClick: () => { setEditing(!editing); updateView(current => ({ ...current, revision: current.revision + 1 })); }, children: [editing ? _jsx(IconBranchOutline16, {}) : _jsx(WorkflowIcon, { name: "edit" }), editing ? '查看流程' : '编辑流程'] }), !archiveView && team?.phase === 'staged' && _jsx("button", { className: css.primary, disabled: working || unsaved.length > 0 || unconfigured.length > 0 || pendingCount > 0, title: unsaved.length ? '请先保存属性草稿' : unconfigured.length ? '请先完成待配置节点' : pendingCount ? '请先处理待确认的修改' : undefined, onClick: () => void perform('start'), children: "\u786E\u8BA4\u5E76\u542F\u52A8" }), _jsxs("button", { "aria-pressed": maximized, onClick: () => setMaximized(!maximized), children: [_jsx(WorkflowIcon, { name: "expand" }), maximized ? '退出全屏' : '全屏'] }), _jsx("button", { onClick: closeWorkbench, "aria-label": "\u5173\u95ED\u7F16\u6392\u5DE5\u4F5C\u53F0", children: "\u5173\u95ED" })] })] }), team && _jsxs("nav", { className: css.commandBar, "aria-label": "\u521B\u5EFA\u4E0E\u89C6\u56FE", children: [_jsx("strong", { children: "\u521B\u5EFA" }), _jsxs("button", { disabled: working || archiveView, onClick: () => void createNode('task'), children: [_jsx(WorkflowIcon, { name: "task" }), "\u4EFB\u52A1\u8282\u70B9"] }), _jsxs("button", { disabled: working || archiveView, onClick: () => void createNode('check'), children: [_jsx(WorkflowIcon, { name: "review" }), "\u4EBA\u5DE5\u8282\u70B9"] }), _jsxs("button", { disabled: working || archiveView, onClick: () => edit('member'), children: [_jsx(WorkflowIcon, { name: "agent" }), "Agent"] }), _jsx("span", { className: css.commandSpacer }), _jsx("button", { "aria-pressed": !inspectorHidden, onClick: () => { setPane(inspectorHidden ? 'discussion' : 'flow'); setInspectorHidden(!inspectorHidden); }, children: inspectorHidden ? '显示右侧面板' : '收起右侧面板' })] }), team && _jsxs("section", { className: css.saveBar, "aria-label": "\u4FDD\u5B58\u72B6\u6001", children: [_jsxs("span", { role: "status", children: [saveState === 'saving' ? '正在保存画布…' : saveState === 'error' ? '上次保存失败，请重试' : '节点与连线自动保存', " \u00B7 ", unsaved.length ? `${unsaved.length} 个对象有未保存属性` : '属性已保存'] }), !!unsaved.length && _jsxs(_Fragment, { children: [_jsx("button", { disabled: working || archiveView, onClick: () => void saveAllProperties(), children: "\u4FDD\u5B58\u5168\u90E8\u5C5E\u6027" }), _jsxs("details", { children: [_jsx("summary", { children: "\u67E5\u770B\u672A\u4FDD\u5B58\u5BF9\u8C61" }), unsaved.map(item => _jsxs("button", { onClick: () => edit(item.target.type, item.target.id), children: [item.label, " \u00B7 \u672A\u4FDD\u5B58"] }, item.key))] })] }), !!unconfigured.length && _jsxs("details", { children: [_jsxs("summary", { children: [unconfigured.length, " \u4E2A\u8282\u70B9\u5F85\u914D\u7F6E"] }), unconfigured.map(task => _jsxs("button", { onClick: () => { setEditing(true); locateTask(task.id); }, children: [task.subject, " \u00B7 \u53BB\u914D\u7F6E"] }, task.id))] }), storageError && _jsx("span", { role: "alert", children: storageError })] }), team && _jsx("nav", { className: css.paneTabs, "aria-label": "\u5DE5\u4F5C\u53F0\u89C6\u56FE", children: ['members', 'flow', 'discussion'].map(value => _jsxs("button", { "aria-pressed": pane === value, onClick: () => { setPane(value); setInspectorExpanded(false); if (value === 'discussion')
                                setInspectorHidden(false); }, children: [value === 'members' ? '对象列表' : value === 'flow' ? '任务流程' : '修改与验收', value === 'discussion' && proposal && _jsx("i", { "aria-label": "\u6709\u5F85\u786E\u8BA4\u7684\u4FEE\u6539" })] }, value)) }), pendingNotice, !!team?.tasks.some(task => task.workflowRerunRequired) && _jsxs("details", { className: css.suspendedNotice, open: true, children: [_jsxs("summary", { children: ["\u4E0A\u6E38\u5DF2\u91CD\u8DD1 \u00B7 ", team.tasks.filter(task => task.workflowRerunRequired).length, " \u4E2A\u4E0B\u6E38\u8282\u70B9\u7B49\u5F85\u4F60\u786E\u8BA4"] }), _jsx("p", { children: "\u6B64\u524D\u7ED3\u679C\u5DF2\u5931\u6548\u3002\u4E0A\u6E38\u5B8C\u6210\u540E\uFF0C\u70B9\u51FB\u8282\u70B9\u53EF\u4FEE\u6539\u8981\u6C42\uFF0C\u518D\u786E\u8BA4\u6267\u884C\u6216\u91CD\u65B0\u9A8C\u6536\u3002" }), team.tasks.filter(task => task.workflowRerunRequired).map(task => _jsxs("button", { onClick: () => { edit(task.checkpoint ? 'check' : 'task', task.id); }, children: [task.subject, " \u00B7 ", task.dependencies.every(id => team.tasks.find(item => item.id === id)?.status === 'completed') ? '可确认' : '等待上游'] }, task.id))] }), error && _jsx("div", { className: css.error, role: "alert", children: error }), archiveView && _jsx("p", { className: css.notice, children: "\u5F52\u6863\u753B\u5E03 \u00B7 \u53EF\u67E5\u770B\u5168\u90E8\u8282\u70B9\u3001\u8FDE\u63A5\u4E0E\u6210\u679C\u3002\u6062\u590D\u5E76\u7F16\u8F91\u5C06\u4FDD\u7559\u539F\u5F52\u6863\u548C\u5DF2\u5B8C\u6210\u6210\u679C\uFF0C\u5EFA\u7ACB\u5F85\u786E\u8BA4\u6D41\u7A0B\uFF0C\u4E0D\u4F1A\u81EA\u52A8\u6267\u884C\u3002" }), feedback && !editor && _jsx("p", { className: css.notice, role: "status", children: feedback }), !activeId ? _jsxs("form", { className: css.create, onSubmit: e => { e.preventDefault(); void createFlow(); }, children: [_jsx("h2", { children: "\u63CF\u8FF0\u76EE\u6807\uFF0C\u4E00\u8D77\u89C4\u5212\u56E2\u961F" }), _jsxs("label", { children: ["\u56E2\u961F\u540D\u79F0", _jsx("input", { required: true, value: name, onChange: e => setName(e.target.value) })] }), _jsxs("label", { children: ["\u56E2\u961F\u76EE\u6807", _jsx("textarea", { required: true, value: goal, onChange: e => setGoal(e.target.value) })] }), _jsx("button", { className: css.primary, disabled: working, children: "\u5728 DSH \u4E2D\u8BA8\u8BBA\u65B9\u6848 \u2197" })] }) : !team ? _jsx("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u56E2\u961F\u2026" }) : _jsxs("div", { className: css.columns, style: { '--inspector-width': `${inspectorWidth}px` }, "data-inspector-hidden": inspectorHidden, "data-inspector-expanded": inspectorExpanded, "data-pane": pane, "data-editing": !!editor || !!selectedEdge || !!activeTask, children: [_jsxs("aside", { className: css.roster, "aria-label": "\u5BF9\u8C61\u5217\u8868", children: [_jsxs("nav", { className: css.libraryTabs, "aria-label": "\u5BF9\u8C61\u5206\u7C7B", children: [_jsxs("button", { "aria-pressed": library === 'tasks', onClick: () => setLibrary('tasks'), children: [_jsx(WorkflowIcon, { name: "task" }), "\u4EFB\u52A1 ", team.tasks.length] }), _jsxs("button", { "aria-pressed": library === 'agents', onClick: () => setLibrary('agents'), children: [_jsx(WorkflowIcon, { name: "agent" }), "Agent ", team.members.filter(m => archiveView || m.status !== 'removed').length] })] }), library === 'tasks' ? _jsxs("section", { className: css.taskList, children: [_jsx("h3", { children: "\u4EFB\u52A1\u6D41\u7A0B" }), _jsx("p", { className: css.hint, children: "\u4EFB\u52A1\u51B3\u5B9A\u505A\u4EC0\u4E48\uFF0CAgent \u51B3\u5B9A\u7531\u8C01\u6267\u884C\u3002" }), team.tasks.map(task => _jsxs("button", { "data-kind": task.checkpoint ? 'check' : 'task', "aria-pressed": selectedTask === task.id, onClick: () => {
                                                    choose({ type: task.checkpoint ? 'check' : 'task', id: task.id });
                                                    setPane('flow');
                                                    requestAnimationFrame(() => { const p = pos(task.id); canvas.current?.scrollTo({ left: Math.max(0, p.x * zoom - 48), top: Math.max(0, p.y * zoom - 48), behavior: 'smooth' }); });
                                                }, children: [_jsxs("small", { className: css.iconLabel, children: [_jsx(WorkflowIcon, { name: task.checkpoint ? 'review' : 'task' }), task.checkpoint ? '人工节点' : '任务节点', " \u00B7 ", task.id] }), _jsxs("strong", { children: [task.subject, unsaved.some(item => item.target.id === task.id && item.target.type !== 'member') && _jsx("em", { className: css.dirtyDot, children: " \u00B7 \u672A\u4FDD\u5B58" })] }), _jsx("span", { title: taskReadiness(team, task).detail, children: taskStatus(task, data.ready) })] }, task.id)), !team.tasks.length && _jsx("p", { className: css.hint, children: "\u4ECE\u9876\u90E8\u521B\u5EFA\u4EFB\u52A1\u8282\u70B9\u6216\u4EBA\u5DE5\u8282\u70B9\u3002" })] }) : _jsxs(_Fragment, { children: [_jsxs("h3", { children: ["Agent \u6210\u5458 ", _jsx("button", { disabled: working || archiveView, "aria-label": "\u6DFB\u52A0\u6210\u5458", onClick: () => edit('member'), children: "\uFF0B \u6DFB\u52A0" })] }), team.members.filter(m => archiveView || m.status !== 'removed').map(m => _jsxs("article", { className: relatedMember === m.name ? css.selected : '', onClick: event => { if (!event.target.closest('button')) {
                                                    edit('member', m.name);
                                                } }, children: [_jsxs("button", { className: css.member, "aria-pressed": selection.type === 'member' && selection.id === m.name, onClick: () => { edit('member', m.name); }, children: [_jsx("img", { src: memberArtUrl(m.name, m.role ?? ''), alt: "" }), _jsxs("span", { children: [_jsxs("strong", { children: [m.name, unsaved.some(item => item.target.type === 'member' && item.target.id === m.name) && _jsx("em", { className: css.dirtyDot, children: " \u00B7 \u672A\u4FDD\u5B58" })] }), _jsx("span", { children: m.summary || m.role || '尚未填写职责概述' })] })] }), _jsxs("small", { className: css.iconLabel, children: [_jsx(WorkflowIcon, { name: "agent" }), "Agent \u00B7 ", m.model || '继承队长模型'] }), _jsxs("div", { children: [_jsxs("button", { disabled: working || archiveView, onClick: () => prepareDiscussion(m.name), children: [_jsx(WorkflowIcon, { name: "chat" }), "\u8BA8\u8BBA\u8C03\u6574 \u2197"] }), m.id && openExecution && _jsx("button", { onClick: () => { openExecution(m.id, team.captainSessionId); closeWorkbench(); }, children: "\u6267\u884C\u5BF9\u8BDD \u2197" }), openExecution && m.previousSessionIds?.map((id, i) => _jsxs("button", { onClick: () => { openExecution(id, team.captainSessionId); closeWorkbench(); }, children: ["\u5386\u53F2\u6267\u884C ", i + 1, " \u2197"] }, id))] })] }, m.name)), _jsx("p", { className: css.hint, children: archiveView ? '点击成员查看保存的配置与执行记录；恢复并编辑后可调整。' : '点击成员卡片直接编辑；讨论调整默认继续该成员的独立讨论，保留历史上下文。' })] })] }), _jsxs("main", { className: css.graphArea, children: [_jsxs("nav", { className: css.toolbar, "aria-label": "\u753B\u5E03\u5DE5\u5177", children: [_jsxs("button", { "aria-pressed": !panMode, onClick: () => setPanMode(false), children: [_jsx(WorkflowIcon, { name: "select" }), "\u9009\u62E9"] }), _jsxs("button", { "aria-pressed": panMode, onClick: () => setPanMode(true), children: [_jsx(WorkflowIcon, { name: "pan" }), "\u5E73\u79FB"] }), _jsx("button", { "aria-label": "\u7F29\u5C0F\u753B\u5E03", disabled: zoom <= .1, onClick: () => changeZoom(zoom - .1), children: "\u2212" }), _jsxs("button", { title: "\u6062\u590D 100%", "aria-label": `缩放 ${Math.round(zoom * 100)}%，点击恢复 100%`, onClick: () => changeZoom(1), children: [Math.round(zoom * 100), "%"] }), _jsx("button", { "aria-label": "\u653E\u5927\u753B\u5E03", disabled: zoom >= 2, onClick: () => changeZoom(zoom + .1), children: "\uFF0B" }), _jsxs("button", { onClick: fitCanvas, children: [_jsx(WorkflowIcon, { name: "fit" }), "\u9002\u5E94\u753B\u5E03"] }), _jsxs("button", { disabled: working || archiveView || !team.tasks.length, onClick: () => void arrangeCanvas(), children: [_jsx(WorkflowIcon, { name: "arrange" }), "\u81EA\u52A8\u6574\u7406"] })] }), reviewNotice, _jsx("div", { className: css.canvas, "data-pan": panMode || !editing || archiveView, "data-linking": !!link, ref: canvas, onPointerDownCapture: beginPan, onClickCapture: event => { if (suppressPanClick.current) {
                                            suppressPanClick.current = false;
                                            event.preventDefault();
                                            event.stopPropagation();
                                        } }, children: _jsxs("div", { className: css.plane, style: { width: graphWidth, height: graphHeight, zoom }, children: [_jsxs("svg", { className: css.edges, "aria-label": "\u4EFB\u52A1\u4EA4\u63A5\u8FDE\u7EBF", children: [_jsxs("defs", { children: [_jsx("marker", { id: "workflow-arrow", markerUnits: "userSpaceOnUse", markerWidth: "8", markerHeight: "8", refX: "8", refY: "4", orient: "auto", children: _jsx("path", { d: "M0,0 L8,4 L0,8", fill: "var(--wb-muted)" }) }), _jsx("marker", { id: "workflow-arrow-active", markerUnits: "userSpaceOnUse", markerWidth: "8", markerHeight: "8", refX: "8", refY: "4", orient: "auto", children: _jsx("path", { d: "M0,0 L8,4 L0,8", fill: "var(--wb-accent)" }) })] }), team.tasks.flatMap(t => t.dependencies.map(dep => {
                                                            const path = connectionPath(connectionPort(pos(dep), 'output'), connectionPort(pos(t.id), 'input'));
                                                            const selected = selectedEdge?.from === dep && selectedEdge.to === t.id;
                                                            const related = highlightedTask === dep || highlightedTask === t.id;
                                                            return _jsxs("g", { "data-selected": selected, "data-related": related, "data-dimmed": (!!highlightedTask || !!selectedEdge) && !related && !selected, className: css.edge, children: [_jsx("path", { d: path, markerEnd: selected ? 'url(#workflow-arrow-active)' : 'url(#workflow-arrow)' }), _jsx("path", { className: css.edgeHit, d: path, role: "button", tabIndex: 0, "aria-label": `交接：${team.tasks.find(task => task.id === dep)?.subject ?? dep} → ${t.subject}`, "aria-pressed": selectedEdge?.from === dep && selectedEdge.to === t.id, onClick: () => { choose({ type: 'edge', from: dep, to: t.id }); }, onKeyDown: event => { if (event.key === 'Enter' || event.key === ' ') {
                                                                            event.preventDefault();
                                                                            choose({ type: 'edge', from: dep, to: t.id });
                                                                        } } })] }, `${dep}-${t.id}`);
                                                        })), link && _jsx("path", { d: connectionPath(connectionPort(pos(link.from), 'output'), link) })] }), team.tasks.map(task => {
                                                    const p = pos(task.id);
                                                    return _jsxs("article", { "data-canvas-node": task.id, "data-status": task.status, "data-member-match": selection.type === 'member' && !!selection.id && task.assignee === selection.id || undefined, "data-connection": link?.to === task.id ? link.issue ? 'invalid' : 'valid' : undefined, "data-review-ready": !!task.checkpoint && !task.checkpoint.decision && data.ready.includes(task.id), "data-config-pending": task.workflowConfigPending || undefined, "data-suspended": task.workflowRerunRequired || undefined, className: `${css.node} ${task.checkpoint ? css.checkpoint : ''} ${highlightedTask === task.id ? css.selected : ''}`, style: { left: p.x, top: p.y }, onPointerDown: event => beginNodeDrag(event, task), onClick: event => { if (event.target.closest('[data-connection-handle]'))
                                                            return; if (suppressNodeClick.current) {
                                                            suppressNodeClick.current = false;
                                                            return;
                                                        } ; if (editing && !archiveView)
                                                            edit(task.checkpoint ? 'check' : 'task', task.id);
                                                        else
                                                            choose({ type: task.checkpoint ? 'check' : 'task', id: task.id }); }, children: [_jsxs("div", { className: `${css.drag} ${css.iconLabel}`, children: [_jsx(WorkflowIcon, { name: task.checkpoint ? 'review' : 'task' }), task.checkpoint ? '人工节点' : '任务节点', " \u00B7 ", task.id] }), _jsxs("button", { className: css.nodeBody, children: [_jsx("strong", { title: task.subject, children: task.subject }), _jsx("span", { className: css.taskOwner, title: task.assignee, children: task.checkpoint ? '人工验收 · 由你确认' : `执行 Agent · ${task.assignee || '自动分配'}` }), _jsx("small", { title: taskReadiness(team, task).detail, "data-ready": data.ready.includes(task.id), children: taskStatus(task, data.ready) })] }), _jsx("button", { className: `${css.port} ${css.input}`, "data-connection-handle": true, "data-input-id": task.id, "aria-label": `${task.subject} 输入端` }), _jsx("button", { className: `${css.port} ${css.output}`, "data-connection-handle": true, "aria-label": `${task.subject} 输出端`, disabled: working || archiveView || !editing || (taskEditing && !editor?.id), title: "\u4ECE\u5706\u70B9\u62D6\u51FA\u8FDE\u63A5\u7EBF", onPointerDown: event => {
                                                                    if (event.button !== 0)
                                                                        return;
                                                                    event.preventDefault();
                                                                    const target = event.currentTarget;
                                                                    target.setPointerCapture(event.pointerId);
                                                                    const update = (move) => {
                                                                        const at = point(move), to = connectionTarget(team.tasks, pos, at, task.id);
                                                                        const issue = to ? connectionIssue(team.tasks, task.id, to.id) : undefined;
                                                                        const end = to && !issue ? connectionPort(pos(to.id), 'input') : at;
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
                                                }), taskEditing && !editor?.id && _jsxs("article", { className: `${css.node} ${css.draftNode}`, style: { left: draftPosition.x, top: draftPosition.y }, children: [_jsx("div", { className: css.drag, children: "\u8349\u7A3F \u00B7 \u786E\u8BA4\u540E\u52A0\u5165\u6D41\u7A0B" }), _jsxs("div", { className: css.nodeBody, children: [_jsx("strong", { children: draft['subject'] || (editor?.type === 'check' ? '新人工检查' : '新任务') }), _jsx("span", { children: editor?.type === 'check' ? '你与独立验收 Agent' : draft['assignee'] || '待指定 Agent' }), _jsx("small", { children: "\u5C1A\u672A\u5E94\u7528" })] })] }), !team.tasks.length && !editor && _jsx("p", { className: css.empty, children: "\u6DFB\u52A0\u4EFB\u52A1\u6216\u4EBA\u5DE5\u68C0\u67E5\uFF0C\u6216\u8BA9 AI \u6839\u636E\u76EE\u6807\u63D0\u51FA\u6D41\u7A0B\u65B9\u6848\u3002" })] }) }), _jsx("footer", { className: css.canvasStatus, role: "status", children: link ? link.issue ?? (link.to ? '已吸附 · 松开连接' : '拖到下游节点 · Esc 取消') : `${team.tasks.length} 个任务节点 · ${editing ? '拖动空白处平移' : '拖动画布平移'} · 滚轮缩放（以鼠标位置为中心）${editing ? ' · 靠近节点显示圆点，拖动连线 · Delete 删除' : ' · 单击节点查看详情'}` })] }), _jsx("div", { className: css.resizeHandle, role: "separator", "aria-label": "\u8C03\u6574\u53F3\u4FA7\u9762\u677F\u5BBD\u5EA6", "aria-orientation": "vertical", "aria-valuemin": 300, "aria-valuemax": 720, "aria-valuenow": inspectorWidth, tabIndex: inspectorHidden ? -1 : 0, onPointerDown: resizeInspector, onKeyDown: event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                                    event.preventDefault();
                                    setInspectorExpanded(false);
                                    setInspectorWidth(value => Math.max(300, Math.min(720, value + (event.key === 'ArrowLeft' ? 40 : -40))));
                                } } }), _jsxs("section", { className: css.inspector, "aria-label": "\u5C5E\u6027\u4E0E\u8BA8\u8BBA\u9762\u677F", children: [_jsxs("header", { className: css.inspectorHeader, children: [_jsx("strong", { children: editor ? '编辑属性' : activeTask || selectedEdge ? '节点与连接' : '讨论与验收' }), _jsx("button", { "aria-pressed": inspectorExpanded, onClick: () => setInspectorExpanded(!inspectorExpanded), children: inspectorExpanded ? '还原面板' : '放大面板' })] }), selectedEdge && _jsxs("aside", { className: css.editor, "aria-label": "\u4EA4\u63A5\u8BE6\u60C5", children: [_jsxs("strong", { children: [team.tasks.find(task => task.id === selectedEdge.from)?.subject, " \u2192 ", team.tasks.find(task => task.id === selectedEdge.to)?.subject] }), _jsx("p", { children: "\u4E0A\u6E38\u5B8C\u6210\u540E\uFF0C\u4E0B\u6E38\u624D\u5F00\u59CB\u3002\u7F16\u8F91\u65F6\u6309 Delete \u5220\u9664\uFF1B\u5DF2\u5F00\u59CB\u7684\u4E0B\u6E38\u9700\u5148\u505C\u6B62\u3002" }), _jsx("button", { disabled: working || archiveView || !editing, onClick: () => void deleteEdge(), children: "\u5220\u9664\u8FDE\u7EBF" })] }), activeTask && !editor && !selectedEdge && _jsxs("aside", { className: css.editor, "aria-label": activeTask.checkpoint ? '人工验收属性' : '任务属性', children: [_jsx("h3", { children: activeTask.checkpoint ? '人工验收属性' : '任务属性' }), _jsx("strong", { children: activeTask.subject }), renderReadiness(activeTask), _jsx("p", { children: activeTask.description || '暂无任务说明' }), _jsxs("p", { children: [taskStatus(activeTask, data.ready), " \u00B7 ", activeTask.id] }), activeTask.checkpoint && _jsxs("p", { children: ["\u7B2C ", activeTask.checkpoint.round, " \u8F6E \u00B7 ", activeTask.checkpoint.note || '暂无验收意见'] }), _jsxs("div", { children: [!archiveView && !activeTask.checkpoint && _jsxs("button", { className: css.primary, disabled: working, onClick: () => void startEmbedded(`task:${activeTask.id}`), children: [_jsx(WorkflowIcon, { name: "chat" }), "\u4E0E AI \u8BA8\u8BBA\u4EFB\u52A1"] }), !archiveView && !activeTask.checkpoint && activeTask.assignee && rerunnableTasks(team.tasks, activeTask.assignee).some(task => task.id === activeTask.id) && _jsx("button", { disabled: working, onClick: () => { edit('member', activeTask.assignee, { rerunTaskId: activeTask.id }); }, children: "\u4FEE\u6539\u8D1F\u8D23\u4EBA\u5E76\u91CD\u8DD1\u6B64\u4EFB\u52A1" }), !archiveView && !activeTask.checkpoint && !['completed', 'failed', 'cancelled'].includes(activeTask.status) && _jsx("button", { disabled: working || activeTask.workflowConfigPending, onClick: () => void perform(activeTask.workflowPaused ? 'resume_task' : 'stop_task', { taskId: activeTask.id, base: data.base }), children: activeTask.workflowPaused ? '继续执行' : '停止任务以编辑' })] }), _jsx(TaskRecord, { task: activeTask, team: team, expanded: true }), !archiveView && editorTarget(team, selection, true) && _jsx("button", { onClick: () => setEditing(true), children: !activeTask.checkpoint && ['completed', 'failed', 'cancelled'].includes(activeTask.status) ? '修改并重跑' : '编辑节点' }), !archiveView && activeTask.checkpoint && data.ready.includes(activeTask.id) && _jsx("button", { className: css.primary, disabled: working, onClick: () => void openReview(activeTask.id), children: "\u5F00\u59CB\u9A8C\u6536" })] }), !editor && !selectedEdge && !activeTask && _jsxs("aside", { className: css.discussion, children: [_jsxs("header", { children: [_jsx("img", { src: reviewTask ? REVIEW_ART : member ? memberArtUrl(member.name, member.role ?? '') : LEAD_ART, alt: "" }), _jsxs("div", { children: [_jsx("h3", { children: reviewTask ? `验收 · ${reviewTask.subject}` : discussionTask ? `任务讨论 · ${discussionTask.subject}` : member ? `成员职责 · ${member.name}` : '流程修改' }), _jsx("small", { children: reviewTask ? '一起检查成果，由你决定是否通过' : '讨论不影响执行，修改确认后生效' })] })] }), _jsxs("div", { className: css.messages, children: [_jsx("p", { className: css.hint, children: reviewTask ? '在原生验收对话中共同检查成果，回到这里确认验收决定。' : discussionTask ? '基于已保存的任务要求、负责人、上下游和提交结果讨论；未保存草稿不会发送给 AI。' : member ? '在这里与独立配置顾问讨论；队长对话保持独立。' : '在 DSH 原生对话中讨论团队与流程，修改方案会显示在这里。' }), discussionTask && _jsxs("div", { children: [_jsx("button", { onClick: () => locateTask(discussionTask.id), children: "\u8FD4\u56DE\u4EFB\u52A1\u5C5E\u6027" }), _jsx("button", { disabled: working || archiveView, onClick: () => void startEmbedded('graph'), children: "\u8BA8\u8BBA\u6574\u4F53\u6D41\u7A0B\u4E0E\u62C6\u5206" })] }), archiveView ? _jsx("p", { className: css.hint, children: "\u6062\u590D\u5E76\u7F16\u8F91\u6D41\u7A0B\u540E\u53EF\u7EE7\u7EED\u8BA8\u8BBA\u3002" }) : embeddedDiscussion === discussion && activeId ? _jsx(EmbeddedDiscussion, { sessionId: sessionId, teamId: activeId, discussion: discussion }, `${activeId}:${discussion}:${conversation?.native?.sessionId}`) : _jsxs("button", { className: css.primary, disabled: working, onClick: () => member ? prepareDiscussion(member.name) : void startEmbedded(discussion), children: ["\u5728\u6B64\u5904", conversation?.native ? '继续' : '开始', "\u8BA8\u8BBA"] }), embeddedDiscussion === discussion && conversation?.native && openConversation && _jsx("button", { disabled: working, onClick: () => void openDiscussion(discussion), children: "\u6253\u5F00\u5B8C\u6574 DSH \u5BF9\u8BDD \u2197" }), _jsxs("details", { open: archiveView || selection.type === 'member', children: [_jsx("summary", { children: "\u67E5\u770B\u5F53\u524D\u8D44\u6599" }), _jsx(WorkflowContext, { team: team, discussion: discussion, onSelect: key => key.startsWith('member:') ? edit('member', key.slice(7)) : selectDiscussion(key), openExecution: openExecution })] }), conversation?.materials && _jsxs("details", { open: true, children: [_jsx("summary", { children: "\u672C\u8F6E\u9A8C\u6536\u6750\u6599\u4E0E\u8BC1\u636E" }), _jsx(ReviewMaterials, { text: conversation.materials })] }), data.busy.includes(discussion) && _jsx("p", { role: "status", children: "\u539F\u751F\u5BF9\u8BDD\u6B63\u5728\u6574\u7406\u65B9\u6848\u2026" })] }), !archiveView && proposal && _jsx("section", { className: css.proposal, children: renderProposalReview() }), !archiveView && reviewTask && conversation?.evidence && conversation.materialsRound === reviewTask.checkpoint?.round && data.ready.includes(reviewTask.id) && !reviewTask.checkpoint?.decision && _jsxs("div", { className: css.decisions, children: [_jsx("button", { className: css.primary, disabled: working, onClick: () => void perform('review', { taskId: reviewTask.id, evidence: conversation.evidence, decision: 'approve', note }).then(ok => { if (ok)
                                                            setNote(''); }), children: "\u901A\u8FC7\u9A8C\u6536" }), _jsx("button", { disabled: working, onClick: () => void perform('review', { taskId: reviewTask.id, evidence: conversation.evidence, decision: 'reject', note }).then(ok => { if (ok) {
                                                            setNote('');
                                                            void startEmbedded(discussion);
                                                        } }), children: "\u9000\u56DE\u5E76\u8BA8\u8BBA\u8FD4\u5DE5" })] }), reviewTask?.checkpoint?.decision === 'reject' && _jsx("p", { className: css.notice, children: "\u5DF2\u9000\u56DE\uFF0C\u4E0B\u6E38\u4FDD\u6301\u7B49\u5F85\u3002\u53EF\u5C06\u65B0\u8FD4\u5DE5\u8282\u70B9\u8FDE\u5165\u6B64\u5BA1\u6838\u8282\u70B9\uFF0C\u81EA\u52A8\u8FDB\u5165\u4E0B\u4E00\u8F6E\u5BA1\u6838\uFF1B\u4E5F\u53EF\u8BA8\u8BBA\u8FD4\u5DE5\u5BF9\u8C61\u5E76\u786E\u8BA4\u65B0\u65B9\u6848\u3002" }), !archiveView && reviewTask && _jsxs("div", { className: css.composer, children: [_jsxs("label", { children: ["\u9A8C\u6536\u610F\u89C1\uFF08\u968F\u51B3\u5B9A\u4FDD\u5B58\uFF09", _jsx("textarea", { "aria-label": "\u9A8C\u6536\u610F\u89C1", value: note, onChange: e => setNote(e.target.value), placeholder: "\u8BB0\u5F55\u901A\u8FC7\u6216\u9000\u56DE\u7684\u539F\u56E0\u2026" })] }), _jsx("button", { disabled: working || !data.ready.includes(reviewTask.id), onClick: () => void perform('materials'), children: "\u5237\u65B0\u9A8C\u6536\u6750\u6599" })] }), !archiveView && !data.currentDiscussion && _jsxs("details", { children: [_jsx("summary", { children: "\u91CD\u65B0\u5F00\u59CB\u8BA8\u8BBA" }), _jsx("p", { className: css.hint, children: "\u65B0\u5EFA\u72EC\u7ACB\u8BA8\u8BBA\u4F1A\u5F52\u6863\u5F53\u524D\u8BA8\u8BBA\uFF0C\u4ECE\u5F53\u524D\u8D44\u6599\u91CD\u65B0\u5F00\u59CB\u3002" }), _jsx("button", { disabled: working || data.busy.includes(discussion), onClick: () => void startEmbedded(discussion, activeId, true), children: "\u65B0\u5EFA\u72EC\u7ACB\u8BA8\u8BBA" })] })] }), editor && _jsxs("form", { "data-workflow-editor": true, className: css.editor, onSubmit: event => {
                                            event.preventDefault();
                                            try {
                                                const route = draft['routeChanged'] ? { provider: draft['provider'], model: draft['model'], reasoningEffort: draft['reasoningEffort'] || 'default' } : {};
                                                const operations = editor.type === 'member' ? [editor.id ? { action: 'update_member', name: editor.id, summary: draft['summary'], role: draft['role'], executionPrompt: draft['executionPrompt'], ...route } : { action: 'add_member', name: draft['name'] ?? '', summary: draft['summary'] ?? '', role: draft['role'], executionPrompt: draft['executionPrompt'], ...route }]
                                                    : [editor.id ? { action: terminalEdit ? 'rerun_task' : 'update_task', id: editor.id, ...!terminalEdit && activeTask?.workflowConfigPending ? { confirmConfiguration: true } : {}, subject: draft['subject'] ?? '', description: draft['description'], assignee: editor.type === 'check' ? undefined : draft['assignee'] } : { action: 'add_task', checkpoint: editor.type === 'check', subject: draft['subject'] ?? '', description: draft['description'], assignee: editor.type === 'check' ? undefined : draft['assignee'], dependencies: [] }];
                                                const rerun = event.nativeEvent.submitter?.getAttribute('data-rerun') === 'true';
                                                if (rerun) {
                                                    if (!editor.id || !draft['rerunTaskId'] || !team.tasks.some(task => task.id === draft['rerunTaskId'] && task.assignee === editor.id))
                                                        throw new Error('请选择该成员的已结束任务');
                                                    operations.push({ action: 'rerun_task', id: draft['rerunTaskId'], instructions: draft['rerunInstructions'] });
                                                }
                                                const resumeId = event.nativeEvent.submitter?.getAttribute('data-resume') === 'true' ? editor.id : undefined;
                                                const resumeCheck = editor.type === 'check', revision = viewRef.current.revision;
                                                void saveEdit(operations, rerun ? '调整成员并单独重跑任务' : editor.type === 'member' ? '调整团队成员' : '调整任务', true).then(async (saved) => { if (saved && resumeId && await perform('resume_task', { taskId: resumeId, base: saved.base }) && resumeCheck && revision === viewRef.current.revision)
                                                    await openReview(resumeId); });
                                            }
                                            catch (error) {
                                                setError(String(error));
                                            }
                                        }, children: [_jsxs("h3", { children: [editor.id ? '编辑' : '添加', editor.type === 'member' ? '成员' : editor.type === 'check' ? '人工检查' : '任务', " ", _jsx("small", { className: currentDirty ? css.dirtyDot : css.hint, children: currentDirty ? '未保存' : editor.id ? '已保存' : '尚未创建' })] }), editor.type !== 'member' && activeTask && renderReadiness(activeTask), editor.type === 'task' && activeTask && _jsxs(_Fragment, { children: [_jsxs("button", { type: "button", disabled: working, onClick: () => void startEmbedded(`task:${activeTask.id}`), children: [_jsx(WorkflowIcon, { name: "chat" }), "\u4E0E AI \u8BA8\u8BBA\u4EFB\u52A1"] }), _jsx("small", { className: css.hint, children: "\u8BA8\u8BBA\u4F7F\u7528\u5DF2\u4FDD\u5B58\u7684\u8D44\u6599\uFF1B\u5F53\u524D\u8349\u7A3F\u4F1A\u4FDD\u7559\u3002" })] }), editor.type === 'member' ? _jsxs(_Fragment, { children: [field('name', '名称'), _jsxs("div", { className: css.memberModelSettings, children: [_jsx("strong", { children: "\u6A21\u578B\u4E0E Thinking" }), modelDirectory && t ? _jsx(StagedModelPicker, { directory: modelDirectory, t: t, provider: draft['provider'] ?? '', model: draft['model'] ?? '', reasoningEffort: draft['reasoningEffort'] ?? '', busy: working, onChange: selection => setDraft(prev => ({ ...prev, ...selection, routeChanged: 'yes' })) }) : _jsx("p", { className: css.hint, children: "\u6A21\u578B\u76EE\u5F55\u6682\u4E0D\u53EF\u7528\uFF0C\u8BF7\u5728 DSH \u56E2\u961F\u6D3B\u52A8\u9875\u9762\u6253\u5F00\u7F16\u8F91\u3002" })] }), field('summary', 'Summary · 功能概述', true), field('role', '长期职责', true), field('executionPrompt', '执行指令 / PE', true)] })
                                                : _jsxs(_Fragment, { children: [field('subject', '任务名称'), field('description', '任务要求 / 验收要求', true), editor.type !== 'check' && _jsxs("label", { children: ["\u6267\u884C Agent", _jsxs("select", { value: draft['assignee'] ?? '', onChange: e => setDraft({ ...draft, assignee: e.target.value }), children: [_jsx("option", { value: "", children: "\u7531\u7A7A\u95F2\u6210\u5458\u9886\u53D6" }), team.members.filter(m => m.status !== 'removed').map(m => _jsx("option", { children: m.name }, m.name))] })] }), _jsx("p", { className: css.hint, children: "\u8282\u70B9\u5DF2\u5728\u753B\u5E03\u4E2D\uFF0C\u9760\u8FD1\u8282\u70B9\u540E\u53EF\u62D6\u52A8\u53F3\u4FA7\u5706\u70B9\u8FDE\u7EBF\u3002\u4FEE\u6539\u540D\u79F0\u6216\u8981\u6C42\u540E\u70B9\u51FB\u4FDD\u5B58\u3002" })] }), editor.type !== 'member' && activeTask && _jsx(TaskRecord, { task: activeTask, team: team, expanded: true }), terminalEdit && activeTask && _jsx(_Fragment, { children: _jsxs("p", { className: css.notice, children: ["\u4FDD\u5B58\u5C06\u5F00\u542F\u65B0\u4E00\u8F6E\u6267\u884C\uFF0C\u539F\u6709\u72B6\u6001\u4E0E\u7ED3\u679C\u4FDD\u5B58\u5728\u5386\u53F2\u6267\u884C\u8BB0\u5F55\u4E2D\uFF0C\u5E76\u6302\u8D77\u4E0B\u6E38\uFF1A", rerunImpact(team.tasks, activeTask.id).descendants.map(task => task.subject).join('、') || '无', "\u3002\u5176\u4ED6\u5206\u652F\u4FDD\u7559\uFF1B\u4E0B\u6E38\u9700\u9010\u4E2A\u786E\u8BA4\u3002", team.phase === 'staged' ? '请先查看流程并确认启动团队，再重跑。' : ''] }) }), editor.type === 'member' && editor.id && _jsx(TaskRerunPicker, { tasks: team.tasks, member: editor.id, taskId: draft['rerunTaskId'] ?? '', instructions: draft['rerunInstructions'] ?? '', disabled: working, onTask: id => setDraft(prev => ({ ...prev, rerunTaskId: id })), onInstructions: text => setDraft(prev => ({ ...prev, rerunInstructions: text })) }), editor.type !== 'member' && team.tasks.find(task => task.id === editor.id)?.workflowRerunRequired && _jsxs("p", { className: css.hint, children: ["\u4E0A\u6E38\u91CD\u8DD1\u540E\uFF0C\u6B64\u8282\u70B9\u7B49\u5F85\u4F60\u786E\u8BA4\u3002", team.tasks.find(task => task.id === editor.id).dependencies.some(id => team.tasks.find(task => task.id === id)?.status !== 'completed') ? `尚未完成：${team.tasks.find(task => task.id === editor.id).dependencies.filter(id => team.tasks.find(task => task.id === id)?.status !== 'completed').map(id => team.tasks.find(task => task.id === id)?.subject ?? id).join('、')}` : '上游已完成，确认后使用最新结果。'] }), feedback && _jsx("p", { role: "status", children: feedback }), _jsx("p", { className: css.hint, children: "\u5C5E\u6027\u9700\u70B9\u51FB\u4FDD\u5B58\uFF1B\u8349\u7A3F\u4FDD\u5B58\u5728\u6B64\u6807\u7B7E\u9875\uFF0C\u5237\u65B0\u53EF\u6062\u590D\u3002Esc \u9000\u51FA\u7F16\u8F91\u5E76\u4FDD\u7559\u8349\u7A3F\u3002" }), draftStale && _jsxs("p", { role: "alert", children: ["\u5F53\u524D\u5BF9\u8C61\u5DF2\u53D8\u5316\uFF0C\u8349\u7A3F\u4ECD\u4FDD\u7559\u3002", _jsx("button", { type: "button", onClick: () => { if (draftId)
                                                            updateView(current => { const drafts = { ...current.drafts }; delete drafts[draftId]; return { ...current, drafts }; }); }, children: "\u91CD\u65B0\u8F7D\u5165" })] }), _jsxs("footer", { children: [_jsx("button", { className: css.primary, disabled: working || (terminalEdit && team.phase === 'staged'), children: terminalEdit ? '保存并重跑此任务' : activeTask?.workflowConfigPending && editor.type !== 'member' ? '保存并完成配置' : '保存' }), editor.type === 'member' && editor.id && rerunnableTasks(team.tasks, editor.id).some(task => task.id === draft['rerunTaskId']) && _jsx("button", { type: "submit", "data-rerun": "true", disabled: working, children: "\u4FDD\u5B58\u5E76\u4EC5\u91CD\u8DD1\u6240\u9009\u4EFB\u52A1" }), editor.id && editor.type !== 'member' && !terminalEdit && !activeTask?.workflowConfigPending && team.tasks.find(task => task.id === editor.id)?.workflowPaused && _jsxs("button", { type: "submit", "data-resume": "true", disabled: working || (team.tasks.find(task => task.id === editor.id)?.workflowRerunRequired && team.tasks.find(task => task.id === editor.id).dependencies.some(id => team.tasks.find(task => task.id === id)?.status !== 'completed')), children: ["\u4FDD\u5B58\u5E76\u786E\u8BA4", editor.type === 'check' ? '重新验收' : '执行'] }), editor.id && editor.type !== 'member' && !terminalEdit && _jsx("button", { type: "button", disabled: working, onClick: () => void deleteNode(editor.id), children: "\u5220\u9664\u8282\u70B9" }), editor.type === 'check' && editor.id && data.ready.includes(editor.id) && _jsx("button", { type: "button", disabled: working, onClick: () => void openReview(editor.id), children: "\u5F00\u59CB\u9A8C\u6536 \u2197" }), _jsx("button", { type: "button", onClick: cancelEdit, children: "\u653E\u5F03\u4FEE\u6539" }), editor.type === 'member' && editor.id && _jsx("button", { type: "button", disabled: working, onClick: () => void saveEdit([{ action: 'remove_member', name: editor.id }], `移除 ${editor.id}`, true), children: "\u79FB\u9664\u6210\u5458" })] })] }, `${editor.type}:${editor.id ?? 'new'}`)] })] })] }), document.body)] });
}
