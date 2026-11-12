import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { canChangeGateReview, canStartLoopWithFlow } from "../workflow-loop-types.js";
import { upstreamIds } from "../workflow-loop-config.js";
import { draftTaskId } from "./workflow-draft.js";
import { WorkbenchGuide } from "./WorkbenchGuide.js";
import { CanvasTaskCard } from "./CanvasTaskCard.js";
import { CARD_WIDTH, CARD_HEIGHT, CARD_PORT_Y, displayPoint, storedPoint, connectionTarget, connectionPort } from "./canvas-card-geometry.js";
import { AdaptationProgress } from "./AdaptationProgress.js";
import { adaptationPhase, adaptationConflicts } from "./adaptation-progress.js";
import { reviewHistoryEdges } from "./workflow-layout.js";
import { isGateTask } from "../workflow-node-kind.js";
import { LoopPanel } from "./LoopPanel.js";
import { ArchiveRecords } from "./ArchiveRecords.js";
import { archiveDraft, draftGalleryAccess } from "./workbench-drafts.js";
import { galleryAccessKeys } from "../gallery-access.js";
import { workflowRequest } from "./workflow-request.js";
import { createWorkflowCache, workflowCacheKey } from "./workflow-cache.js";
import { workflowMessage } from "./workflow-text.js";
import { useWorkflowText, WorkflowLocale } from "./workflow-i18n.js";
/** Editable task canvas and isolated configuration / human-review discussions. */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import css from './WorkflowWorkbench.module.css';
import { TaskRecord, WorkflowContext } from "./WorkflowContext.js";
import { WORKFLOW_GATE_PATH, connectionIssue, connectionPath, WORKFLOW_GATE_PORT_Y } from "./workflow-connections.js";
import { LEAD_ART, REVIEW_ART, memberArtUrl } from "./artwork.js";
import { StagedModelPicker } from "./StagingPlanEditor.js";
import { EmbeddedDiscussion } from "./EmbeddedDiscussion.js";
import { ProposalReview } from "./ProposalReview.js";
import { TaskStateBadge, taskStateNodeClass } from "./TaskStateBadge.js";
import { TaskRerunPicker } from "./TaskRerunPicker.js";
import { canRestartTask, rerunPath, resumeRerunPath, rerunImpact, rerunnableTasks } from "../task-rerun.js";
import { draftSource, editorKey, editorTarget, finishWorkbenchSave, initialEditorDraft, initialWorkbenchView, selectWorkbench, targetDiscussion } from "./workbench-selection.js";
import { publishWorkflowActivity } from "./activity-monitor.js";
import { arrangeWorkflow, loopRegion, clampZoom, fitGraph } from "./workflow-layout.js";
import { decodeDrafts, draftStorageKey, pendingDrafts, propertyOperation } from "./workbench-drafts.js";
import { taskReadiness } from "./task-readiness.js";
import { flowControlState, flowControlVersion, taskControlState } from "./task-control.js";
import { zh } from "./locales.js";
import { awaitsFirstStart } from "../task-start-state.js";
import { IconBranchOutline16, WorkflowIcon } from "./icons.js";
import { BrandIcon } from "./BrandIcon.js";
import { TemplateGallery } from "./TemplateGallery.js";
import { OutcomeShowcase } from "./OutcomeShowcase.js";
import { ReviewWorkbench } from "./ReviewWorkbench.js";
const viewCache = createWorkflowCache();
async function request(payload, signal) {
    const reading = payload['action'] === 'state' || payload['action'] === 'archive_state';
    const key = workflowCacheKey(String(payload['sessionId']), String(payload['teamId'] ?? ''), payload['action'] === 'archive_state');
    const previous = reading ? viewCache.get(key) : undefined;
    const result = await workflowRequest({ ...payload, ...reading ? { conditionalState: true, knownRevision: previous?.revision } : {} }, fetch, undefined, signal);
    if (result.notModified && previous)
        return previous;
    if (reading && !result.team)
        viewCache.remove(key);
    if (!result.team)
        return;
    return result;
}
function ReviewMaterials({ text }) {
    const l = useWorkflowText();
    try {
        const material = JSON.parse(text);
        if (!Array.isArray(material.results) || !material.check)
            return _jsx("pre", { children: text });
        return _jsxs("div", { className: css.materials, children: [_jsxs("small", { children: [l("第 "), material.check.round, " ", l(" 轮验收")] }), material.results.length === 0 && _jsx("p", { children: l("此检查点没有上游执行结果，请根据验收要求确认是否继续。") }), material.results.map(result => _jsxs("section", { children: [_jsx("strong", { children: result.subject }), _jsx("p", { children: result.output || l("尚未提交结果说明") }), result.commandsRun?.map((command, i) => _jsxs("p", { children: [command.status === 'passed' ? l("通过") : l("未通过"), " \u00B7 ", command.command, command.evidence ? `\n${command.evidence}` : ''] }, i)), result.acceptanceResults?.map((item, i) => _jsxs("p", { children: [item.status === 'passed' ? l("通过") : l("未通过"), " \u00B7 ", item.criterion, item.evidence ? `\n${item.evidence}` : ''] }, i))] }, result.id)), !!material.files?.artifacts.length && _jsxs("section", { children: [_jsx("strong", { children: l("相关文件") }), material.files.artifacts.map(file => _jsxs("p", { children: [file.path, file.skipped ? l(" · 按策略跳过内容审计，请在本机检查") : file.unreadable ? l(" · 无法读取") : !file.present ? l(" · 文件不存在") : ''] }, file.path))] }), _jsx("p", { className: css.hint, children: workflowMessage(material.limitation ?? '', l) }), _jsxs("details", { children: [_jsx("summary", { children: l("原始证据记录") }), _jsx("pre", { children: text })] })] });
    }
    catch {
        return _jsx("pre", { children: text });
    }
}
function Workbench({ sessionId, teamId, archived = false, waitingCount = 0, openExecution, nativeOnly = false, reviewEntryOnly = false, embeddedContext = false, onNativeContext, openContext, modelDirectory, t, entryTarget, entryDiscussion, initiallyOpen = false, onClose }) {
    const l = useWorkflowText(t);
    const [guideDismissed, setGuideDismissed] = useState(() => {
        try {
            return localStorage.getItem('teamflow.workbench.guideDismissed') === '1';
        }
        catch {
            return false;
        }
    });
    function dismissGuide() {
        setGuideDismissed(true);
        try {
            localStorage.setItem('teamflow.workbench.guideDismissed', '1');
        }
        catch { /* Storage may be disabled. */ }
    }
    const [opened, setOpened] = useState(initiallyOpen || !!entryTarget);
    const [connectionError, setConnectionError] = useState('');
    const refreshInFlight = useRef(false), mutationInFlight = useRef(false);
    const [showOutcomes, setShowOutcomes] = useState(false);
    const [galleryMode, setGalleryMode] = useState(teamId ? undefined : 'browse');
    const entryOpened = useRef(false);
    const [showLoopSteps, setShowLoopSteps] = useState(true);
    const [returnDraft, setReturnDraft] = useState();
    const [editing, setEditing] = useState(false);
    const [archiveView, setArchiveView] = useState(archived);
    const [cached] = useState(() => teamId ? viewCache.get(workflowCacheKey(sessionId, teamId, archived)) : undefined);
    const [data, setData] = useState(cached);
    const [revalidating, setRevalidating] = useState(!!cached);
    const [activeId, setActiveId] = useState(teamId);
    const [view, setView] = useState(initialWorkbenchView);
    const viewRef = useRef(view);
    const [error, setError] = useState('');
    const [feedback, setFeedback] = useState('');
    const [reviewDrafts, setReviewDrafts] = useState({});
    const [proposalFocus, setProposalFocus] = useState(0);
    const [attentionFocus, setAttentionFocus] = useState();
    const [mutating, setWorking] = useState(false);
    const [adaptationOpening, setAdaptationOpening] = useState();
    const [adaptationOpenError, setAdaptationOpenError] = useState();
    const adaptationRequest = useRef();
    const adaptationBusy = (!!adaptationOpening && adaptationOpening === data?.team.id) || !!data?.busy.includes('adapt');
    const working = mutating || revalidating || adaptationBusy;
    const [saveState, setSaveState] = useState('saved');
    const [storageError, setStorageError] = useState('');
    const loadedDraftScope = useRef();
    const [reviewNotes, setReviewNotes] = useState({});
    const [embeddedDiscussion, setEmbeddedDiscussion] = useState();
    const [pane, setPane] = useState('flow');
    const [name, setName] = useState();
    const [goal, setGoal] = useState('');
    const [zoom, setZoom] = useState(1);
    const [library, setLibrary] = useState('tasks');
    const [panMode, setPanMode] = useState(false);
    const [maximized, setMaximized] = useState(false);
    const [inspectorWidth, setInspectorWidth] = useState(420);
    const [inspectorExpanded, setInspectorExpanded] = useState(false);
    const [inspectorHidden, setInspectorHidden] = useState(true);
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
    const flow = team ? flowControlState(team) : undefined;
    const adaptationDiscussion = team?.workflow?.discussions['discussion:adapt'];
    const adaptationStatus = adaptationPhase({ opening: !!team && adaptationOpening === team.id, busy: !!data?.busy.includes('adapt'), disconnected: !!connectionError || revalidating, error: !!team && adaptationOpenError === team.id, hasSession: !!adaptationDiscussion?.native, proposal: adaptationDiscussion?.proposal, base: data?.base });
    const selection = view.target;
    const discussion = targetDiscussion(selection);
    const selectedTask = selection.type === 'task' || selection.type === 'check' ? selection.id : undefined;
    const selectedEdge = selection.type === 'edge' ? selection : undefined;
    const editor = !archiveView && editing ? editorTarget(team, selection) : undefined;
    const draftId = editor ? editorKey(team?.id ?? '', editor) : undefined;
    const draftEntry = draftId ? view.drafts[draftId] : undefined;
    const draft = draftEntry?.values ?? (editor ? initialEditorDraft(team, editor).values : {});
    const draftStale = !!editor && !!draftEntry && draftEntry.source !== draftSource(team, editor);
    const highlightedTask = selectedTask ?? (discussion.startsWith('check:') ? discussion.slice(6) : discussion.startsWith('task:') ? discussion.slice(5) : undefined);
    const relatedMember = selection.type === 'member' ? selection.id : selectedTask ? team?.tasks.find(task => task.id === selectedTask)?.assignee : discussion.startsWith('member:') ? discussion.slice(7) : undefined;
    const conversation = team?.workflow?.discussions[`discussion:${discussion}`];
    const proposal = conversation?.proposal?.status === 'pending' ? conversation.proposal : undefined;
    const reviewingTemplate = discussion === 'adapt' && !!proposal;
    const MessageArea = reviewingTemplate ? 'details' : 'div';
    const reviewTask = discussion.startsWith('check:') ? team?.tasks.find(t => t.id === discussion.slice(6)) : undefined;
    const reviewScope = `${team?.id}:${reviewTask?.id}:${reviewTask?.checkpoint?.round}`;
    const note = reviewNotes[reviewScope] ?? '';
    const setNote = (value) => setReviewNotes(notes => ({ ...notes, [reviewScope]: value }));
    const reviewingCheckpoint = !!reviewTask && !editor && !selectedTask && !selectedEdge;
    const discussionTask = discussion.startsWith('task:') ? team?.tasks.find(t => t.id === discussion.slice(5) && !t.checkpoint) : undefined;
    const activeTask = team?.tasks.find(t => t.id === selectedTask);
    const activeLoop = team?.workflow?.loops?.find(loop => loop.gateId === activeTask?.id || loop.bodyIds.includes(activeTask?.id ?? ''));
    const loopLabel = l('门控节点');
    const gateNode = (task) => !!task && isGateTask(task, team?.workflow?.loops);
    const terminalEdit = !activeLoop && !!editor && editor.type !== 'member' && !!activeTask && canRestartTask(activeTask);
    const member = discussion.startsWith('member:') ? team?.members.find(m => m.name === discussion.slice(7)) : undefined;
    const defaultPositions = useMemo(() => arrangeWorkflow(team?.tasks ?? [], team?.workflow?.loops), [team?.tasks, team?.workflow?.loops]);
    const taskEditing = !!editor && editor.type !== 'member';
    const unsaved = pendingDrafts(team, view.drafts, l);
    const currentDirty = unsaved.some(item => item.key === draftId);
    const unconfigured = team?.tasks.filter(task => task.workflowConfigPending) ?? [];
    const taskStatus = (task, _ready) => taskReadiness(team, task, l).label;
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
                setStorageError(l("当前浏览器无法保存草稿，刷新前请保存属性。"));
            }
            return;
        }
        try {
            const drafts = Object.fromEntries(pendingDrafts(team, view.drafts, l).map(item => [item.key, item.entry]));
            if (Object.keys(drafts).length)
                sessionStorage.setItem(scope, JSON.stringify({ version: 1, drafts }));
            else
                sessionStorage.removeItem(scope);
            setStorageError('');
        }
        catch {
            setStorageError(l("草稿备份失败，刷新前请保存属性。"));
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
            setError(l("节点已不存在，请刷新任务列表"));
            return;
        }
        choose({ type: task.checkpoint ? 'check' : 'task', id: task.id });
        if (entryTarget.rerun && !archiveView && !team.halted && team.phase !== 'staged' && !task.checkpoint && ['completed', 'failed', 'cancelled'].includes(task.status))
            setEditing(true);
        if (entryTarget.review && task.checkpoint)
            void openReview(task.id);
    }, [team, entryTarget]);
    useEffect(() => {
        if (!entryDiscussion || entryOpened.current || !team)
            return;
        entryOpened.current = true;
        void startEmbedded(entryDiscussion);
    }, [entryDiscussion, team]);
    function updateView(update) { const next = update(viewRef.current); viewRef.current = next; setView(next); }
    function choose(target, overrides) {
        setReturnDraft(draft => draft && target.type === 'check' && target.id === draft.gate ? draft : undefined);
        updateView(current => selectWorkbench(current, target, team, overrides));
        setError('');
        setFeedback('');
        setInspectorHidden(false);
        if (target.type === 'member')
            setLibrary('agents');
        if (target.type === 'task' || target.type === 'check')
            setLibrary('tasks');
        const graphTarget = target.type === 'task' || target.type === 'check' || target.type === 'edge';
        setPane(graphTarget && !window.matchMedia('(max-width: 900px)').matches ? 'flow' : 'discussion');
    }
    const selectDiscussion = (key) => choose({ type: 'discussion', key });
    function focusAttention(selector) { setAttentionFocus({ selector, revision: viewRef.current.revision }); }
    useLayoutEffect(() => {
        if (!attentionFocus || attentionFocus.revision !== viewRef.current.revision)
            return;
        const target = dialog.current?.querySelector(attentionFocus.selector);
        if (!target)
            return;
        if (target instanceof HTMLDetailsElement)
            target.open = true;
        target.focus({ preventScroll: true });
        target.scrollIntoView({ block: 'nearest' });
        setAttentionFocus(undefined);
    }, [attentionFocus, view, editing, data]);
    function openProposal(key) {
        setGalleryMode(undefined);
        setOpened(true);
        setEditing(false);
        selectDiscussion(key);
        setProposalFocus(value => value + 1);
    }
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
        adaptationRequest.current = undefined;
        setAdaptationOpening(undefined);
        setAdaptationOpenError(undefined);
        setEmbeddedDiscussion(undefined);
        generation.current++;
    } }, [sessionId, teamId]);
    const refresh = async (signal) => {
        if (refreshInFlight.current || mutationInFlight.current)
            return;
        refreshInFlight.current = true;
        const token = generation.current;
        try {
            const result = await request({ sessionId, teamId: activeId, action: archiveView ? 'archive_state' : 'state' }, signal);
            if (!result) {
                if (mounted.current && !signal?.aborted && token === generation.current) {
                    setData(undefined);
                    setRevalidating(false);
                }
                ;
                return;
            }
            if (mounted.current && !signal?.aborted && token === generation.current) {
                setConnectionError('');
                setError(previous => previous.startsWith('连接中断') || previous === l('请先重新连接并核对最新状态，再操作流程。') ? '' : previous);
                if (!activeId)
                    setGalleryMode(undefined);
                viewCache.set(workflowCacheKey(sessionId, result.team.id, archiveView), result);
                setData(result);
                setActiveId(result.team.id);
                setRevalidating(false);
                if (!initializedDiscussion.current && result.currentDiscussion) {
                    initializedDiscussion.current = true;
                    if (!initiallyOpen && viewRef.current.revision === 0)
                        selectDiscussion(result.currentDiscussion);
                }
            }
        }
        catch (err) {
            if (mounted.current && token === generation.current && activeId)
                setConnectionError(err instanceof Error ? err.message : String(err));
        }
        finally {
            refreshInFlight.current = false;
        }
    };
    useEffect(() => {
        if (mutating || (!activeId && data))
            return;
        const controller = new AbortController();
        void refresh(controller.signal);
        // A restored native conversation can mount before the host attaches its
        // Agent. Keep retrying discovery so that its persisted team appears without
        // requiring another navigation or accidentally offering to create a team.
        const reconnect = () => { if (!document.hidden)
            void refresh(controller.signal); };
        window.addEventListener('online', reconnect);
        document.addEventListener('visibilitychange', reconnect);
        const timer = setInterval(reconnect, 2500);
        return () => { controller.abort(); clearInterval(timer); window.removeEventListener('online', reconnect); document.removeEventListener('visibilitychange', reconnect); };
    }, [activeId, mutating, archiveView]);
    async function perform(action, fields = {}) {
        if (revalidating)
            return;
        if (adaptationBusy && adaptationConflicts.has(action)) {
            setError(l('AI 正在适配，请等待生成结束后再修改或启动流程。'));
            return;
        }
        if (archiveView && action !== 'restore_archive') {
            setError(l("请先恢复归档，再修改或重新执行。"));
            return;
        }
        if (mutationInFlight.current)
            return;
        if (connectionError) {
            setError(l('请先重新连接并核对最新状态，再操作流程。'));
            return;
        }
        mutationInFlight.current = true;
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
                setFeedback(l("已恢复为待确认流程。已完成成果保留；确认成员配置并启动后，可修改和重跑。"));
            }
            if (result.skipped?.length)
                setError(result.skipped.join('\n'));
            if (result.activity)
                publishWorkflowActivity(result.activity);
            if (mounted.current && token === generation.current) {
                viewCache.set(workflowCacheKey(sessionId, result.team.id, action === 'restore_archive' ? false : archiveView), result);
                setData(result);
                setActiveId(result.team.id);
            }
            return result;
        }
        catch (err) {
            if (mounted.current && token === generation.current) {
                setError(err instanceof Error ? err.message : String(err));
                if (err instanceof Error && err.message.startsWith('连接中断'))
                    setConnectionError(err.message);
                if (saving)
                    setSaveState('error');
            }
            ;
            return undefined;
        }
        finally {
            mutationInFlight.current = false;
            if (mounted.current) {
                setWorking(false);
            }
        }
    }
    async function createFlow() {
        const created = await perform('create', { name: name ?? l('新团队'), description: goal });
        if (created)
            await startEmbedded('graph', created.team.id);
    }
    async function saveEdit(operations, title, finishEditing = false, newPositions = {}) {
        if (finishEditing && draftStale) {
            setError(l("当前对象已变化。草稿已保留，请先核对最新资料，或点击「重新载入」后编辑。"));
            return;
        }
        const revision = viewRef.current.revision, submitted = draftId && editor ? (viewRef.current.drafts[draftId] ?? initialEditorDraft(team, editor)) : undefined;
        const result = await perform('edit', { operations, title, base: data?.base, positions: { ...Object.fromEntries(team?.tasks.map(task => [task.id, storedPoint(pos(task.id))]) ?? []), ...newPositions } });
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
                setFeedback(draftId && viewRef.current.drafts[draftId] ? l("已保存本次提交；后续修改仍为草稿。") : l("已保存。"));
        }
        return result;
    }
    async function saveAllProperties() {
        if (!team || working || archiveView)
            return;
        const submitted = pendingDrafts(team, viewRef.current.drafts, l), revision = viewRef.current.revision;
        if (!submitted.length)
            return;
        try {
            if (submitted.length > 50)
                throw new Error(l("一次最多保存 50 个对象，请先逐项保存部分草稿。"));
            const operations = submitted.map(item => propertyOperation(team, item.target, item.entry));
            const result = await saveEdit(operations, l("保存全部属性草稿"));
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
            setFeedback(l("本次提交的属性已保存；待配置节点仍需单独完成配置，任务不会自动重跑。"));
        }
        catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
    }
    function scrollToTask(id) {
        requestAnimationFrame(() => { const node = canvas.current?.querySelector('[data-canvas-node="' + CSS.escape(id) + '"]'); const p = node ? { x: node.offsetLeft, y: node.offsetTop } : pos(id); canvas.current?.scrollTo({ left: Math.max(0, p.x * zoom - 48), top: Math.max(0, p.y * zoom - 48), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); });
    }
    function locateTask(id, focusField, focusSection = '[data-task-heading]') {
        if (team?.workflow?.loops?.some(loop => loop.bodyIds.includes(id)))
            setShowLoopSteps(true);
        setShowOutcomes(false);
        const task = team?.tasks.find(item => item.id === id);
        if (!task)
            return;
        setGalleryMode(undefined);
        setOpened(true);
        choose({ type: task.checkpoint ? 'check' : 'task', id });
        scrollToTask(id);
        focusAttention(focusField ? '[data-workflow-editor] [data-field="' + focusField + '"] :is(input,textarea)' : focusSection);
    }
    function renderReadiness(task) {
        if (!team)
            return null;
        const state = taskReadiness(team, task, l, data?.execution?.[task.id]);
        if (team.workflow?.loops?.some(loop => loop.gateId === task.id || loop.bodyIds.includes(task.id)))
            return _jsxs("section", { className: css.readiness, children: [_jsx("strong", { children: state.label }), _jsx("p", { children: state.detail })] });
        const labels = { path: '运行到此节点', review: '打开验收', edit: '完善节点配置', rerun: '修改并重跑', continue: '继续此任务', stop: '重试停止', member: '调整负责人' };
        const action = state.action;
        const run = () => { if (action === 'review')
            void openReview(task.id);
        else if (action === 'edit' || action === 'rerun' || action === 'member')
            edit(task.checkpoint ? 'check' : 'task', task.id);
        else if (action === 'continue')
            void perform(task.checkpoint ? 'resume_task' : 'continue_task', { taskId: task.id, base: data?.base });
        else if (action === 'path')
            void perform('start_path', { taskId: task.id, base: data?.base });
        else if (action === 'stop')
            void perform('stop_task', { taskId: task.id }); };
        return _jsxs("section", { className: css.readiness, "aria-label": l("阻塞原因与下一步"), children: [_jsx("strong", { children: state.label }), _jsx("p", { children: state.detail }), action && !(action === 'path' && task.workflowRerunRequired) && !(action === 'review' && reviewingCheckpoint) && !archiveView && _jsx("button", { type: "button", disabled: working || !!unsaved.length || !!connectionError, onClick: run, children: l(labels[action]) }), task.status === 'pending' && canRestartTask(task) && !archiveView && !team.halted && _jsx("button", { type: "button", disabled: working || !!unsaved.length, onClick: () => edit('task', task.id), children: l('修改并重跑') }), state.dependencies.map(id => _jsxs("button", { type: "button", onClick: () => locateTask(id), children: [l("定位 · "), team.tasks.find(item => item.id === id)?.subject ?? id] }, id))] });
    }
    function renderRerunPath(task) {
        if (!team || archiveView || !task.workflowRerunRequired)
            return null;
        let path = [], issue = '';
        try {
            path = rerunPath(team.tasks, task.id).filter(item => item.workflowRerunRequired);
            resumeRerunPath(structuredClone(team), task.id);
        }
        catch (error) {
            issue = error instanceof Error ? error.message : String(error);
        }
        return _jsxs("section", { className: css.readiness, "data-rerun-path": true, tabIndex: -1, "aria-label": l('重跑路径'), children: [_jsx("strong", { children: l('从上游运行到此节点') }), _jsx("p", { children: path.map(item => item.subject).join(' → ') }), _jsx("p", { children: l('按依赖顺序执行，独立分支可并行；经过人工检查时等待你确认，确认后继续。不会启动目标之外的其他待重跑分支。') }), issue && _jsx("p", { role: "alert", children: workflowMessage(issue, l) }), _jsx("button", { type: "button", disabled: working || !!unsaved.length || !!issue, title: unsaved.length ? l('请先保存属性草稿') : undefined, onClick: () => void perform('resume_rerun_path', { taskId: task.id, base: data?.base }), children: l('运行到此节点') })] });
    }
    function renderTaskControl(task) {
        if (!team || archiveView)
            return null;
        const control = taskControlState(team, { ...task, workflowAwaitingStart: awaitsFirstStart(task) });
        if (control.canRerun)
            return _jsx("button", { type: "button", "data-node-rerun": true, disabled: working, onPointerDown: event => event.stopPropagation(), onClick: event => { event.stopPropagation(); edit('task', task.id); }, children: l("修改并重跑") });
        if (control.disabled)
            return null;
        const label = t ? t(control.actionLabel) : l(zh[control.actionLabel]);
        return _jsx("button", { type: "button", "data-node-playback": true, disabled: working || unsaved.some(item => item.target.id === task.id), "aria-label": `${label} · ${task.subject}`, title: l(zh['task.control.hint']), onPointerDown: event => event.stopPropagation(), onClick: event => { event.stopPropagation(); void perform('set_task_enabled', { taskId: task.id, enabled: control.stopping ? false : !control.checked, updatedAt: task.updatedAt }); }, children: label });
    }
    async function startEmbedded(key, targetId = activeId, fresh = false) {
        if (key === 'adapt') {
            setGalleryMode(undefined);
            setShowOutcomes(false);
            setEditing(false);
            selectDiscussion(key);
            if (!targetId)
                return;
            // Restore the existing conversation locally; opening it is not a new generation.
            const existing = data?.team.id === targetId ? data.team.workflow?.discussions['discussion:adapt']?.native : undefined;
            if (!fresh && existing) {
                setEmbeddedDiscussion(key);
                return;
            }
            if (adaptationRequest.current?.teamId === targetId)
                return;
            if (mutationInFlight.current || revalidating || connectionError || (fresh && adaptationBusy))
                return;
            const request = { teamId: targetId };
            adaptationRequest.current = request;
            setAdaptationOpening(targetId);
            setAdaptationOpenError(undefined);
            try {
                const result = await perform('open_discussion', { discussion: key, teamId: targetId, fresh });
                if (!mounted.current || adaptationRequest.current !== request)
                    return;
                if (!result?.openedSessionId?.startsWith('session-at-discussion-') || result.openedSessionId === result.team.captainSessionId) {
                    setAdaptationOpenError(targetId);
                    return;
                }
                // Remember the result even if the user browsed the graph; never steal their selection.
                if (targetDiscussion(viewRef.current.target) === key)
                    setEmbeddedDiscussion(key);
            }
            finally {
                if (adaptationRequest.current === request) {
                    adaptationRequest.current = undefined;
                    if (mounted.current)
                        setAdaptationOpening(undefined);
                }
            }
            return;
        }
        selectDiscussion(key);
        const revision = viewRef.current.revision;
        const result = await perform('open_discussion', { discussion: key, teamId: targetId, fresh });
        if (revision !== viewRef.current.revision)
            return;
        if (result?.openedSessionId && result.openedSessionId.startsWith('session-at-discussion-') && result.openedSessionId !== team?.captainSessionId)
            setEmbeddedDiscussion(key);
        else if (result)
            setError(l("宿主未返回独立讨论会话"));
    }
    function prepareDiscussion(name) { void startEmbedded(`member:${name}`, activeId); }
    async function deleteEdge() {
        const target = team?.tasks.find(task => task.id === selectedEdge?.to);
        if (!target || !selectedEdge || working || archiveView || !editing)
            return;
        const revision = viewRef.current.revision;
        if (await saveEdit([{ action: 'update_task', id: target.id, dependencies: target.dependencies.filter(id => id !== selectedEdge.from) }], l("删除任务交接")) && revision === viewRef.current.revision)
            selectDiscussion('graph');
    }
    async function deleteNode(id) {
        if (!team || working || archiveView || !editing)
            return;
        const updates = team.tasks.filter(task => task.dependencies.includes(id)).map(task => ({ action: 'update_task', id: task.id, dependencies: task.dependencies.filter(dep => dep !== id) }));
        updates.push({ action: 'remove_task', id });
        const revision = viewRef.current.revision;
        if (await perform('edit', { operations: updates, title: l("删除节点及其连接"), base: data?.base, positions: Object.fromEntries(team.tasks.map(task => [task.id, storedPoint(pos(task.id))])) })) {
            updateView(current => { const drafts = { ...current.drafts }; delete drafts[editorKey(team.id, { type: 'task', id })]; delete drafts[editorKey(team.id, { type: 'check', id })]; return { ...current, drafts }; });
            if (revision === viewRef.current.revision)
                selectDiscussion('graph');
        }
    }
    function beginNodeDrag(event, task) {
        suppressNodeClick.current = false;
        if (event.button !== 0 || working || archiveView || event.target.closest('[data-connection-handle], select'))
            return;
        const target = event.currentTarget, pressed = event.target.closest('button') ?? target;
        const start = point(event), original = storedPoint(canvasPos(task.id));
        let last = original, moved = false;
        pressed.setPointerCapture(event.pointerId);
        const cleanup = () => { target.onpointermove = null; target.onpointerup = null; target.onpointercancel = null; if (pressed.hasPointerCapture(event.pointerId))
            pressed.releasePointerCapture(event.pointerId); };
        target.onpointermove = move => {
            const at = point(move);
            if (!moved && Math.hypot(at.x - start.x, at.y - start.y) < 4 / zoom)
                return;
            if (!moved && compactLoops)
                setShowLoopSteps(true);
            moved = true;
            suppressNodeClick.current = true;
            last = { x: Math.min(10000, Math.max(0, original.x + storedPoint(at).x - storedPoint(start).x)), y: Math.min(10000, Math.max(0, original.y + storedPoint(at).y - storedPoint(start).y)) };
            setPositions(prev => ({ ...prev, [task.id]: last }));
        };
        target.onpointerup = () => { cleanup(); if (moved)
            void perform('layout', { taskId: task.id, ...last }).then(() => setPositions(prev => { const next = { ...prev }; delete next[task.id]; return next; })); };
        target.onpointercancel = () => { cleanup(); suppressNodeClick.current = false; setPositions(prev => { const next = { ...prev }; delete next[task.id]; return next; }); };
    }
    function edit(type, id, overrides) { if (!archiveView)
        setEditing(true); choose({ type, id }, overrides); }
    const field = (key, label, multiline = false) => _jsxs("label", { "data-field": key, children: [label, multiline
                ? _jsx("textarea", { required: (key === 'summary' && !editor?.id) || (key === 'description' && !!activeTask?.workflowConfigPending), value: draft[key] ?? '', onChange: e => setDraft({ ...draft, [key]: e.target.value }) })
                : _jsx("input", { required: key === 'name' || key === 'subject' || (key === 'summary' && !editor?.id), value: draft[key] ?? '', disabled: key === 'name' && (!!editor?.id || working), onChange: e => setDraft({ ...draft, [key]: e.target.value }) })] });
    function pos(id) {
        return displayPoint(positions[id] ?? team?.workflow?.positions[`task:${id}`] ?? defaultPositions[id] ?? { x: 32, y: 32 });
    }
    function point(event) {
        const bounds = canvas.current.getBoundingClientRect();
        return { x: (event.clientX - bounds.left + canvas.current.scrollLeft) / zoom, y: (event.clientY - bounds.top + canvas.current.scrollTop) / zoom };
    }
    const draftPosition = editor?.id ? pos(editor.id) : {
        x: 32,
        y: Math.max(-128, ...team?.tasks.map(t => pos(t.id).y) ?? []) + CARD_HEIGHT + 18,
    };
    const compactLoops = !editing && team?.phase !== 'staged' && !showLoopSteps && !!team?.workflow?.loops?.length;
    const canvasTasks = useMemo(() => {
        const tasks = team?.tasks ?? [];
        if (!compactLoops)
            return tasks;
        const loops = team.workflow.loops;
        const hidden = new Set(loops.flatMap(loop => loop.bodyIds));
        return tasks.filter(task => !hidden.has(task.id)).map(task => {
            const loop = loops.find(item => item.gateId === task.id);
            if (!loop)
                return task;
            const inputs = tasks.filter(t => loop.bodyIds.includes(t.id) || t.id === task.id).flatMap(t => t.dependencies);
            return { ...task, dependencies: [...new Set(inputs.filter(id => !hidden.has(id)))] };
        });
    }, [compactLoops, team?.tasks, team?.workflow?.loops]);
    const compactPositions = useMemo(() => compactLoops ? arrangeWorkflow(canvasTasks) : undefined, [canvasTasks, compactLoops]);
    const canvasPos = (id) => compactPositions?.[id] ?? pos(id);
    const graphWidth = Math.max(580, ...canvasTasks.map(t => canvasPos(t.id).x + CARD_WIDTH + 40), taskEditing ? draftPosition.x + CARD_WIDTH + 40 : 0);
    const loopRegions = compactLoops ? [] : team?.workflow?.loops?.map(loop => ({ loop, ...loopRegion(team.tasks, loop, pos, CARD_WIDTH, CARD_HEIGHT) })) ?? [];
    const graphHeight = Math.max(260, ...canvasTasks.map(t => canvasPos(t.id).y + CARD_HEIGHT + 24), ...loopRegions.map(region => region.bottom + 20), taskEditing ? draftPosition.y + CARD_HEIGHT + 24 : 0);
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
        if (event.button === 0 && !archiveView && event.target.closest('[data-canvas-node]'))
            return;
        const blank = event.target === event.currentTarget || event.target.classList.contains(css.plane);
        if (event.button !== 1 && !panMode && !blank && editing && !archiveView)
            return;
        if (event.target.closest('[data-connection-handle], [data-node-playback], [data-node-rerun]'))
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
        target.onpointerup = () => {
            cleanup();
            if (moved || !blank || panMode)
                return;
            updateView(current => selectWorkbench(current, { type: 'discussion', key: 'graph' }, team));
            setPane('flow');
            setInspectorHidden(true);
            setError('');
            setFeedback('');
        };
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
            setFeedback(l("已按任务依赖整理布局。"));
        }
    }
    function reviewModeSelect(task) {
        if (!task?.checkpoint || !team)
            return null;
        const loop = team.workflow?.loops?.find(item => item.gateId === task.id);
        const mode = loop?.mode ?? task.checkpoint.mode ?? 'human';
        const members = loop ? team.members.filter(m => m.status !== 'removed' && !team.tasks.some(t => loop.bodyIds.includes(t.id) && t.assignee === m.name)) : [];
        const disabled = working || archiveView || team.halted || task.status !== 'pending' || !!task.checkpoint.decision || !!loop && !canChangeGateReview(loop, task);
        return _jsxs("select", { "aria-label": l.language === 'en' ? 'Review mode' : '审核方式', value: mode === 'ai' && loop ? 'ai:' + loop.reviewer : mode, disabled: disabled, onPointerDown: e => e.stopPropagation(), onClick: e => e.stopPropagation(), onChange: event => {
                const value = event.target.value;
                void perform('checkpoint_mode', { taskId: task.id, base: data?.base, mode: value === 'human' ? 'human' : 'ai', reviewer: value.startsWith('ai:') ? value.slice(3) : undefined });
            }, children: [_jsx("option", { value: "human", children: l.language === 'en' ? 'Human review' : '人工审核' }), loop ? members.map(m => _jsxs("option", { value: 'ai:' + m.name, children: ["AI \u00B7 ", m.name] }, m.name)) : _jsx("option", { value: "ai", children: l.language === 'en' ? 'AI review' : 'AI 审核' })] });
    }
    async function createNode(type, at) {
        if (!team || working || archiveView)
            return;
        const revision = viewRef.current.revision;
        const label = type === 'gate' ? loopLabel : type === 'check' ? l('验收节点') : type === 'archive' ? l('成果归档') : l("新任务");
        let number = team.tasks.length + 1;
        while (team.tasks.some(task => task.subject === `${label} ${number}`))
            number++;
        const id = draftTaskId(team);
        const result = await saveEdit([{ action: 'add_task', id, subject: `${label} ${number}`, checkpoint: type === 'check' || type === 'gate', ...type === 'gate' || type === 'check' ? { checkpointKind: type === 'gate' ? 'gate' : 'acceptance' } : {}, ...type === 'archive' ? { kind: 'archive', archive: { copyFiles: false, paths: [] } } : {}, configurationPending: true, dependencies: [] }], l("创建{0}", label), false, at ? { [id]: at } : {});
        if (!result || revision !== viewRef.current.revision)
            return;
        const added = result.team.tasks.find(task => task.id === id);
        if (!added)
            return;
        setEditing(true);
        setPanMode(false);
        updateView(current => selectWorkbench(current, { type: type === 'archive' ? 'task' : type === 'gate' ? 'check' : type, id: added.id }, result.team));
        const narrow = window.matchMedia('(max-width: 900px)').matches;
        setLibrary('tasks');
        setPane(narrow ? 'discussion' : 'flow');
        setInspectorHidden(false);
        focusAttention(narrow ? 'header[data-guide="inspector"]' : `[data-card-task="${CSS.escape(added.id)}"]`);
        setFeedback(l("节点已保存，可直接连线；填写要求并完成配置前不会执行或进入验收。"));
        requestAnimationFrame(() => {
            const saved = result.team.workflow?.positions[`task:${added.id}`];
            const p = saved && displayPoint(saved);
            if (p)
                canvas.current?.scrollTo({ left: Math.max(0, p.x * zoom - 48), top: Math.max(0, p.y * zoom - 48), behavior: 'smooth' });
        });
    }
    async function openReview(id) {
        if (gateNode(team?.tasks.find(task => task.id === id))) {
            setEditing(false);
            locateTask(id);
            return;
        }
        setShowOutcomes(false);
        setGalleryMode(undefined);
        setEditing(false);
        setOpened(true);
        setInspectorWidth(width => Math.max(width, 640));
        selectDiscussion(`check:${id}`);
        scrollToTask(id);
        focusAttention('[data-review-heading]');
        // Reading a gate never starts a model turn or writes to an archive/decided round.
        if (!archiveView && data?.ready.includes(id))
            await perform('materials', { discussion: `check:${id}` });
    }
    function renderProposalReview() {
        if (!proposal || !team || !data)
            return null;
        return _jsx(ProposalReview, { team: team, proposal: proposal, base: data.base, busy: working, fixedStructure: discussion === 'adapt', focusRequest: proposalFocus, draft: reviewDrafts[proposal.id], onChange: draft => setReviewDrafts(prev => ({ ...prev, [proposal.id]: draft })), onApply: operations => { void perform('apply', { proposalId: proposal.id, operations }).then(result => { if (result) {
                setFeedback(l("修改已应用，可继续讨论。"));
            } }); }, onDismiss: () => void perform('dismiss', { proposalId: proposal.id }).then(result => { if (result)
                setFeedback(l("修改已放弃，可以继续讨论。")); }) }, proposal.id);
    }
    const pendingProposals = Object.entries(team?.workflow?.discussions ?? {}).filter(([key, item]) => !archiveView && key.startsWith('discussion:') && item.proposal?.status === 'pending').map(([, item]) => item);
    const pendingCount = pendingProposals.length;
    const pendingNotice = pendingCount > 0 && _jsxs("div", { className: css.pendingNotice, role: "status", children: [_jsxs("strong", { children: [l("有 "), pendingCount, " ", l(" 项修改等待确认")] }), pendingProposals.map(item => _jsxs("button", { type: "button", onClick: () => openProposal(item.key), children: [l("查看并决定 · "), item.proposal.title] }, item.key)), !!editor && _jsx("small", { children: l("切换查看会保留当前草稿。") })] });
    const reviewCount = archiveView ? 0 : data?.ready.length ?? waitingCount;
    const reviewNotice = !archiveView && !!data?.ready.length && _jsxs("div", { className: css.reviewNotice, role: "status", "aria-label": l("等待你验收"), children: [_jsxs("strong", { children: [_jsx("span", { className: css.reviewDot, "aria-hidden": true }), l("等待你验收")] }), data.ready.map(id => _jsxs("button", { type: "button", disabled: working, onClick: () => void openReview(id), children: [l("验收 · "), team?.tasks.find(t => t.id === id)?.subject, " \u2197"] }, id)), !reviewEntryOnly && _jsx("small", { children: l("上游已完成 · 打开验收工作台核对证据") })] });
    const adaptation = pendingProposals.find(item => item.key === 'adapt' && item.proposal?.base === data?.base)?.proposal;
    const proposedTasks = new Set(adaptation?.operations.flatMap(op => op.action === 'update_task' ? [op.id] : []));
    const attention = [
        ...(archiveView ? [] : team?.tasks.filter(task => task.checkpoint?.decision === 'reject') ?? []).map(task => ({ key: 'rejected:' + task.id, label: l('安排返工 · {0}', task.subject), open: () => void openReview(task.id) })),
        ...pendingProposals.map(item => ({
            key: 'proposal:' + item.key, label: l("确认方案 · {0}", item.proposal.title), open: () => openProposal(item.key),
        })),
        ...(archiveView ? [] : data?.ready ?? []).map(id => ({
            key: 'review:' + id, label: l("验收 · {0}", team?.tasks.find(task => task.id === id)?.subject ?? id), open: () => void openReview(id),
        })),
        ...(archiveView ? [] : unconfigured.filter(task => !proposedTasks.has(task.id))).map(task => ({
            key: 'configure:' + task.id, label: l("配置 · {0}", task.subject), open: () => { setEditing(true); locateTask(task.id, task.adaptationIssue?.trim() ? 'adaptationIssue' : 'subject'); },
        })),
        ...(archiveView ? [] : team?.tasks.filter(task => task.workflowRerunRequired && !task.workflowConfigPending) ?? []).map(task => ({
            key: 'rerun:' + task.id, label: l("查看重跑路径 · {0}", task.subject), open: () => { setEditing(false); locateTask(task.id, undefined, '[data-rerun-path]'); },
        })),
        ...(archiveView || team?.halted ? [] : team?.tasks.filter(task => task.status === 'failed' && !task.workflowRerunRequired && !task.workflowConfigPending) ?? []).map(task => ({
            key: 'failure:' + task.id, label: l("查看失败任务 · {0}", task.subject), open: () => { setEditing(false); locateTask(task.id, undefined, '[data-task-record]'); },
        })),
    ];
    const blockers = archiveView ? [] : (team?.tasks ?? []).filter(task => task.status !== 'completed').map(task => ({ task, state: taskReadiness(team, task, l, data?.execution?.[task.id]) })).filter(({ task, state }) => state.action || state.dependencies.length || task.workflowPaused || task.workflowRerunRequired);
    const firstAction = attention[0];
    const completed = team?.tasks.filter(task => task.status === 'completed').length ?? 0;
    // The chat header always exposes Teamflow, even before a team exists.
    return _jsxs(_Fragment, { children: [!initiallyOpen && _jsxs(_Fragment, { children: [data?.currentDiscussion && team && _jsxs("div", { className: css.nativeBanner, children: [_jsxs("span", { children: [data.currentDiscussion.startsWith('check:') ? l("独立验收对话") : l("独立配置对话"), " \u00B7 ", team.name] }), _jsx("button", { className: css.entry, onClick: () => void openExecution?.(team.captainSessionId, team.captainSessionId), children: l("返回团队对话 ↗") })] }), _jsxs("button", { type: "button", className: `${css.entry} ${nativeOnly ? css.compact : css.launcher}`, "aria-haspopup": "dialog", onClick: () => setOpened(true), children: [_jsxs("strong", { children: [_jsxs("span", { className: css.iconLabel, children: [_jsx(BrandIcon, { size: 20 }), "Teamflow"] }), _jsx("span", { "aria-hidden": true, children: "\u2197" })] }), !nativeOnly && _jsxs("span", { children: [archiveView ? l("归档画布 · ") : '', team?.name ?? (activeId ? l("查看成员、任务交接与人工检查") : l("讨论目标，创建初步团队"))] }), pendingCount > 0 && _jsxs("span", { children: [pendingCount, " ", l(" 项修改待确认")] }), reviewCount > 0 && _jsxs("span", { children: [reviewCount, " ", l(" 项等待人工验收")] })] }), !nativeOnly && !reviewEntryOnly && !archiveView && team?.phase === 'staged' && _jsx("button", { type: "button", className: `${css.entry} ${css.startEntry}`, disabled: working || unsaved.length > 0 || unconfigured.length > 0 || pendingCount > 0, title: unsaved.length ? l("请先保存属性草稿") : unconfigured.length ? l("请先完成待配置节点") : pendingCount ? l("请先处理待确认的修改") : undefined, onClick: () => void perform('start'), children: l("确认并启动团队") }), !opened && !nativeOnly && !reviewEntryOnly && pendingNotice, error && !opened && _jsx("div", { className: css.error, role: "alert", children: workflowMessage(error, l) }), !nativeOnly && reviewNotice, nativeOnly && data?.currentDiscussion && openContext && _jsx("button", { className: `${css.entry} ${css.compact}`, onClick: openContext, children: proposal ? l("查看待确认修改 ↗") : l("团队与讨论资料 ↗") }), embeddedContext && team && _jsxs("section", { className: css.contextPanel, "aria-label": l("讨论资料"), children: [_jsxs("header", { children: [_jsx("strong", { children: l("讨论资料") }), _jsx("span", { children: l("当前已保存的信息") })] }), _jsxs("label", { children: [l("查看对象"), _jsxs("select", { value: discussion, onChange: event => selectDiscussion(event.target.value), children: [_jsx("option", { value: "graph", children: l("团队与流程") }), team.members.filter(m => m.status !== 'removed').map(m => _jsx("option", { value: `member:${m.name}`, children: m.name }, m.name)), team.tasks.map(t => _jsxs("option", { value: `${t.checkpoint ? 'check' : 'task'}:${t.id}`, children: [t.checkpoint ? l("验收") : l("任务"), " \u00B7 ", t.subject] }, t.id))] })] }), feedback && _jsx("p", { role: "status", children: workflowMessage(feedback, l) }), conversation?.materials && _jsxs("details", { children: [_jsx("summary", { children: l("本轮验收证据") }), _jsx(ReviewMaterials, { text: conversation.materials })] }), proposal && !opened && _jsxs("section", { className: css.contextProposal, "aria-label": l("待确认修改"), children: [renderProposalReview(), _jsx("button", { onClick: () => { setPane('discussion'); setOpened(true); }, children: l("在画布查看 ↗") })] }), _jsx(WorkflowContext, { team: team, discussion: discussion, onSelect: selectDiscussion, openExecution: openExecution })] })] }), opened && createPortal(_jsxs("section", { ref: dialog, className: css.workbench, style: { '--wb-node-width': `${CARD_WIDTH}px`, '--wb-port-y': `${CARD_PORT_Y}px`, '--wb-gate-port-y': `${WORKFLOW_GATE_PORT_Y}px` }, "data-live": !archiveView, "data-maximized": maximized, "data-editing": !!editor || !!selectedEdge || !!activeTask, role: "dialog", "aria-modal": "true", "aria-label": l("TeamFlow 编排工作台"), onKeyDown: event => {
                    if (!galleryMode && !showOutcomes && !archiveView && editing && (event.key === 'Delete' || event.key === 'Backspace') && (selectedEdge || selectedTask) && !event.target.closest('input,textarea,select,[contenteditable="true"]')) {
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
                            setFeedback(l("已退出编辑，未保存的草稿已保留。"));
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
                }, children: [_jsxs("header", { className: css.header, children: [_jsxs("div", { className: css.title, children: [_jsx(BrandIcon, { size: 32 }), _jsxs("div", { children: [_jsx("strong", { children: team?.name ?? 'Teamflow' }), _jsxs("span", { children: [archiveView ? l("归档画布 · 成果与详情完整保留") : team?.phase === 'staged' ? l("准备流程 · 确认后开始执行") : l("团队工作台"), !!team?.tasks.length && _jsxs(_Fragment, { children: [" \u00B7 ", l("已完成 {0}/{1}", completed, team.tasks.length)] })] })] })] }), _jsxs("div", { children: [team && !galleryMode && !showOutcomes && (archiveView ? _jsxs("button", { className: css.primary, disabled: working, onClick: () => void perform('restore_archive'), children: [_jsx(WorkflowIcon, { name: "edit" }), l("恢复并编辑流程")] }) : _jsxs("button", { "data-guide": "edit", "aria-pressed": editing, onClick: () => { setEditing(!editing); updateView(current => ({ ...current, revision: current.revision + 1 })); }, children: [editing ? _jsx(IconBranchOutline16, {}) : _jsx(WorkflowIcon, { name: "edit" }), editing ? l("查看流程") : l("编辑流程")] })), !galleryMode && !showOutcomes && !archiveView && team?.phase === 'staged' && _jsx("button", { "data-guide": "run", className: css.primary, disabled: working || unsaved.length > 0 || unconfigured.length > 0 || pendingCount > 0, title: unsaved.length ? l("请先保存属性草稿") : unconfigured.length ? l("请先完成待配置节点") : pendingCount ? l("请先处理待确认的修改") : undefined, onClick: () => void perform('start'), children: l("确认并启动") }), !galleryMode && !showOutcomes && !archiveView && team?.phase !== 'staged' && team && !team.halted && _jsxs("span", { "data-guide": "run", "data-flow-controls": true, title: l(zh['flow.control.hint']), children: [_jsx("button", { disabled: working || unsaved.length > 0 || !flow?.canStart, onClick: () => void perform('set_flow_enabled', { enabled: true, version: flowControlVersion(team) }), children: l("开始全部") }), _jsx("button", { disabled: working || !flow?.canPause, onClick: () => void perform('set_flow_enabled', { enabled: false, version: flowControlVersion(team) }), children: l("暂停全部") })] }), _jsxs("button", { "aria-pressed": maximized, onClick: () => setMaximized(!maximized), children: [_jsx(WorkflowIcon, { name: "expand" }), maximized ? l("退出全屏") : l("全屏")] }), _jsx("button", { onClick: closeWorkbench, "aria-label": l("关闭编排工作台"), children: l("关闭") })] })] }), _jsxs("nav", { className: css.pageTabs, "aria-label": l("Teamflow 页面"), children: [_jsxs("button", { "data-guide": "flow", "aria-pressed": !galleryMode && !showOutcomes, onClick: () => { setGalleryMode(undefined); setShowOutcomes(false); }, children: [_jsx(BrandIcon, {}), team ? l("当前流程") : l("从零创建")] }), _jsxs("button", { "data-guide": "outcomes", hidden: !team, "aria-pressed": showOutcomes, onClick: () => { setGalleryMode(undefined); setShowOutcomes(true); }, children: [_jsx(WorkflowIcon, { name: "task" }), l("交付内容")] }), _jsxs("button", { "data-guide": "gallery", "aria-pressed": galleryMode === 'browse', className: css.galleryEntry, onClick: () => { setShowOutcomes(false); setGalleryMode('browse'); }, children: [_jsx(BrandIcon, { name: "gallery" }), l("流程模板库 ")] }), team && _jsxs("button", { disabled: working || !!unsaved.length || !team.tasks.length, title: unsaved.length ? l("请先保存属性草稿") : undefined, onClick: () => { setShowOutcomes(false); setGalleryMode('save'); }, children: [_jsx(BrandIcon, { name: "save" }), l("保存为模板")] }), team?.workflow?.templateSource && _jsxs("small", { children: [l("来自 "), team.workflow.templateSource.name, " \u00B7 v", team.workflow.templateSource.version] }), _jsx(WorkbenchGuide, {})] }), !archiveView && team?.workflow?.templateSource && (team.phase === 'staged' || !!adaptationDiscussion) && _jsx(AdaptationProgress, { phase: adaptationStatus, disabled: mutating && !adaptationOpening && !adaptationDiscussion?.native, onOpen: () => void startEmbedded('adapt') }), galleryMode && _jsx(TemplateGallery, { sessionId: sessionId, team: team, archived: archiveView, mode: galleryMode, onBack: () => setGalleryMode(undefined), onApply: async (template, name, goal) => { const result = await perform('template_apply', { templateId: template.id, version: template.version, name, description: goal, language: l.language }); if (!result)
                            throw new Error(l("未能创建流程，请查看页面错误或刷新重试")); setGalleryMode(undefined); setEditing(false); await startEmbedded('adapt', result.team.id); } }, galleryMode), showOutcomes && !galleryMode && team && _jsx(OutcomeShowcase, { team: team, sessionId: sessionId, archived: archiveView, onTask: (id, review) => { if (review)
                            void openReview(id);
                        else
                            locateTask(id); } }, team.id + ':' + sessionId), _jsxs("div", { className: css.workbenchBody, hidden: !!galleryMode || showOutcomes, children: [team && _jsxs("nav", { className: css.commandBar, "aria-label": l("创建与视图"), children: [_jsx("strong", { children: l("创建") }), _jsxs("button", { "data-guide": "task", title: l('指定负责执行这项任务的成员。'), disabled: working || archiveView, onClick: () => void createNode('task'), children: [_jsx(WorkflowIcon, { name: "task" }), l("任务节点")] }), _jsxs("button", { draggable: !working && !archiveView, onDragStart: event => {
                                            event.dataTransfer.setData('application/x-teamflow-gate', 'gate');
                                            event.dataTransfer.effectAllowed = 'copy';
                                        }, "data-guide": "gate", className: css.createGate, title: l('退回后重跑原任务，通过后走 PASS 路径。'), disabled: working || archiveView, onClick: () => void createNode('gate'), children: [_jsx("svg", { viewBox: "0 0 100 40", preserveAspectRatio: "none", "aria-hidden": "true", children: _jsx("path", { d: "M2 20 L50 1 L98 20 L50 39 Z" }) }), _jsx("span", { children: l('循环门控') })] }), _jsxs("button", { "data-guide": "check", title: l('验收节点'), disabled: working || archiveView, onClick: () => void createNode('check'), children: [_jsx(WorkflowIcon, { name: "acceptance" }), l('验收节点')] }), _jsxs("button", { "data-guide": "archive", title: l('收集上游任务的交付成果。'), disabled: working || archiveView, onClick: () => void createNode('archive'), children: [_jsx(WorkflowIcon, { name: "archive" }), l('成果归档')] }), _jsxs("button", { "data-guide": "agent", title: l('添加可分配任务的团队成员。'), disabled: working || archiveView, onClick: () => edit('member'), children: [_jsx(WorkflowIcon, { name: "agent" }), "Agent"] }), _jsx("span", { className: css.commandSpacer }), _jsx("button", { "data-guide": inspectorHidden ? "inspector" : undefined, "aria-pressed": !inspectorHidden, onClick: () => { setPane(inspectorHidden ? 'discussion' : 'flow'); setInspectorHidden(!inspectorHidden); }, children: inspectorHidden ? l("显示右侧面板") : l("收起右侧面板") })] }), !guideDismissed && _jsxs("div", { className: css.guideNotice, children: [_jsxs("details", { className: css.quickGuide, children: [_jsx("summary", { children: l('第一次用？查看工作台指南') }), _jsxs("ol", { children: [_jsxs("li", { children: [_jsx("strong", { children: l('从模板开始') }), " \u00B7 ", l('打开「流程模板库」预览流程，选择合适的模板后，按自己的目标调整成员和任务。')] }), _jsxs("li", { children: [_jsx("strong", { children: l('从零搭建') }), " \u00B7 ", l('创建团队后，先用 Agent 添加成员，再建任务节点并指定负责人。在编辑流程时，从上游节点的输出端拖线到下游输入端。')] }), _jsxs("li", { children: [_jsx("strong", { children: l('决定怎样审核') }), " \u00B7 ", l('例如写报告：要反复修改到达标，用「循环门控」，设置通过去哪里、退回到哪里及最多几轮；要检查最终稿，用「验收节点」选择人工或 AI 审核，退回会新建返工路径。')] }), _jsxs("li", { children: [_jsx("strong", { children: l('查看交付') }), " \u00B7 ", l('需要汇总时，把「成果归档」接在交付任务后。运行后打开「交付内容」查看结果，点画布上的节点可查看执行详情。')] })] })] }), _jsx("button", { type: "button", onClick: dismissGuide, children: l.language === 'en' ? 'Dismiss tip' : '关闭提示' })] }), revalidating && _jsx("p", { role: "status", className: css.hint, children: l('已显示上次状态，正在同步最新进度…') }), team && (unsaved.length > 0 || saveState !== 'saved' || storageError) && _jsxs("section", { className: css.saveBar, "aria-label": l("保存状态"), children: [_jsxs("span", { role: "status", children: [saveState === 'saving' ? l("正在保存画布…") : saveState === 'error' ? l("上次保存失败，请重试") : l("节点与连线自动保存"), " \u00B7 ", unsaved.length ? l("{0} 个对象有未保存属性", unsaved.length) : l("属性已保存")] }), !!unsaved.length && _jsxs(_Fragment, { children: [_jsx("button", { disabled: working || archiveView, onClick: () => void saveAllProperties(), children: l("保存全部属性") }), _jsxs("details", { children: [_jsx("summary", { children: l("查看未保存对象") }), unsaved.map(item => _jsxs("button", { onClick: () => edit(item.target.type, item.target.id), children: [item.label, " ", l(" · 未保存")] }, item.key))] })] }), storageError && _jsx("span", { role: "alert", children: workflowMessage(storageError, l) })] }), team && _jsx("nav", { className: css.paneTabs, "aria-label": l("工作台视图"), children: ['members', 'flow', 'discussion'].map(value => _jsxs("button", { "data-guide": value === 'members' ? 'roster' : value === 'discussion' ? 'inspector' : undefined, "aria-pressed": pane === value, onClick: () => { setPane(value); setInspectorExpanded(false); if (value === 'discussion')
                                        setInspectorHidden(false); }, children: [value === 'members' ? l("对象列表") : value === 'flow' ? l("任务流程") : l("修改与验收"), value === 'discussion' && proposal && _jsx("i", { "aria-label": l("有待确认的修改") })] }, value)) }), firstAction && _jsxs("nav", { className: css.attention, "aria-label": l("待处理"), children: [_jsxs("strong", { children: [l("待处理"), " \u00B7 ", attention.length] }), _jsx("button", { disabled: working, title: firstAction.label, onClick: firstAction.open, children: firstAction.label }), attention.length > 1 && _jsxs("select", { "aria-label": l("其他待处理事项"), value: "", disabled: working, onChange: event => attention.find(item => item.key === event.target.value)?.open(), children: [_jsx("option", { value: "", disabled: true, children: l("其他待处理事项") }), attention.slice(1).map(item => _jsx("option", { value: item.key, children: item.label }, item.key))] })] }), !galleryMode && !showOutcomes && team?.halted && !archiveView && _jsxs("section", { className: css.readiness, children: [_jsx("strong", { children: l('团队已停止') }), _jsx("p", { children: l('恢复后可继续待执行工作；已取消或失败的任务需单独重跑。') }), _jsx("button", { disabled: working, onClick: () => void perform('resume_team', { base: data?.base, reason: '用户恢复流程' }), children: l('恢复团队') })] }), !galleryMode && !showOutcomes && !!blockers.length && _jsxs("details", { className: css.blockers, children: [_jsxs("summary", { children: [l('阻塞与恢复'), " \u00B7 ", blockers.length] }), _jsx("div", { children: blockers.map(({ task, state }) => _jsxs("section", { children: [_jsx("button", { onClick: () => { setEditing(false); locateTask(task.id); }, children: task.subject }), _jsx("strong", { children: state.label }), _jsx("p", { children: state.detail })] }, task.id)) })] }), connectionError && _jsxs("div", { className: css.error, role: "alert", children: [_jsx("strong", { children: l('连接需要恢复') }), _jsx("p", { children: workflowMessage(connectionError, l) }), _jsx("button", { type: "button", disabled: working, onClick: () => void refresh(), children: l('重新连接并读取状态') })] }), error && _jsx("div", { className: css.error, role: "alert", children: workflowMessage(error, l) }), archiveView && _jsx("p", { className: css.notice, children: l("归档画布 · 可查看全部节点、连接与成果。恢复并编辑将保留原归档和已完成成果，建立待确认流程，不会自动执行。") }), feedback && !editor && _jsx("p", { className: css.notice, role: "status", children: workflowMessage(feedback, l) }), !activeId ? _jsxs("form", { className: css.create, onSubmit: e => { e.preventDefault(); void createFlow(); }, children: [_jsx("h2", { children: l("描述目标，一起规划团队") }), _jsxs("p", { children: [l("已有适合的流程？"), _jsxs("button", { type: "button", onClick: () => setGalleryMode('browse'), children: [_jsx(BrandIcon, { name: "gallery" }), l("从模板开始")] })] }), _jsxs("label", { children: [l("团队名称"), _jsx("input", { required: true, value: name ?? l('新团队'), placeholder: l("新团队"), onChange: e => setName(e.target.value) })] }), _jsxs("label", { children: [l("团队目标"), _jsx("textarea", { required: true, value: goal, onChange: e => setGoal(e.target.value) })] }), _jsx("button", { className: css.primary, disabled: working, children: l("在 DSH 中讨论方案 ↗") })] }) : !team ? _jsx("p", { role: "status", children: l("正在读取团队…") }) : _jsxs("div", { className: css.columns, style: { '--inspector-width': `${inspectorWidth}px` }, "data-reviewing": reviewingCheckpoint, "data-inspector-hidden": inspectorHidden, "data-inspector-expanded": inspectorExpanded, "data-pane": pane, "data-editing": !!editor || !!selectedEdge || !!activeTask, children: [_jsxs("aside", { className: css.roster, "aria-label": l("对象列表"), children: [_jsxs("nav", { "data-guide": "roster", className: css.libraryTabs, "aria-label": l("对象分类"), children: [_jsxs("button", { "aria-pressed": library === 'tasks', onClick: () => setLibrary('tasks'), children: [_jsx(WorkflowIcon, { name: "task" }), l("任务 "), team.tasks.length] }), _jsxs("button", { "aria-pressed": library === 'agents', onClick: () => setLibrary('agents'), children: [_jsx(WorkflowIcon, { name: "agent" }), "Agent ", team.members.filter(m => archiveView || m.status !== 'removed').length] })] }), library === 'tasks' ? _jsxs("section", { className: css.taskList, children: [_jsx("h3", { children: l("任务流程") }), _jsx("p", { className: css.hint, children: l("任务决定做什么，Agent 决定由谁执行。") }), team.tasks.map(task => _jsxs("button", { "data-kind": task.checkpoint ? 'check' : 'task', "aria-pressed": selectedTask === task.id, onClick: () => {
                                                            choose({ type: task.checkpoint ? 'check' : 'task', id: task.id });
                                                            requestAnimationFrame(() => { const p = pos(task.id); canvas.current?.scrollTo({ left: Math.max(0, p.x * zoom - 48), top: Math.max(0, p.y * zoom - 48), behavior: 'smooth' }); });
                                                        }, children: [_jsxs("small", { className: css.iconLabel, children: [_jsx(WorkflowIcon, { name: gateNode(task) ? 'gate' : task.checkpoint ? 'acceptance' : task.kind === 'archive' ? 'archive' : 'task' }), gateNode(task) ? loopLabel : task.checkpoint ? l('验收节点') : task.kind === 'archive' ? l("成果归档") : l("任务节点"), " \u00B7 ", task.id] }), _jsxs("strong", { children: [task.subject, unsaved.some(item => item.target.id === task.id && item.target.type !== 'member') && _jsxs("em", { className: css.dirtyDot, children: [" ", l(" · 未保存")] })] }), _jsx("span", { title: taskReadiness(team, task, l).detail, children: taskStatus(task, data.ready) })] }, task.id)), !team.tasks.length && _jsx("p", { className: css.hint, children: l('从顶部创建任务节点、门控节点或验收节点。') })] }) : _jsxs(_Fragment, { children: [_jsxs("h3", { children: [l("Agent 成员 "), _jsx("button", { disabled: working || archiveView, "aria-label": l("添加成员"), onClick: () => edit('member'), children: l("＋ 添加") })] }), team.members.filter(m => archiveView || m.status !== 'removed').map(m => _jsxs("article", { className: relatedMember === m.name ? css.selected : '', onClick: event => { if (!event.target.closest('button')) {
                                                            edit('member', m.name);
                                                        } }, children: [_jsxs("button", { className: css.member, "aria-pressed": selection.type === 'member' && selection.id === m.name, onClick: () => { edit('member', m.name); }, children: [_jsx("img", { src: memberArtUrl(m.name, m.role ?? ''), alt: "" }), _jsxs("span", { children: [_jsxs("strong", { children: [m.name, unsaved.some(item => item.target.type === 'member' && item.target.id === m.name) && _jsxs("em", { className: css.dirtyDot, children: [" ", l(" · 未保存")] })] }), _jsx("span", { children: m.summary || m.role || l("尚未填写职责概述") })] })] }), _jsxs("small", { className: css.iconLabel, children: [_jsx(WorkflowIcon, { name: "agent" }), "Agent \u00B7 ", m.model || l("继承队长模型")] }), _jsxs("div", { children: [_jsxs("button", { disabled: working || archiveView, onClick: () => prepareDiscussion(m.name), children: [_jsx(WorkflowIcon, { name: "chat" }), l("讨论调整 ↗")] }), m.id && openExecution && _jsx("button", { onClick: () => { openExecution(m.id, team.captainSessionId); closeWorkbench(); }, children: l("执行对话 ↗") }), openExecution && m.previousSessionIds?.map((id, i) => _jsxs("button", { onClick: () => { openExecution(id, team.captainSessionId); closeWorkbench(); }, children: [l("历史执行 "), i + 1, " \u2197"] }, id))] })] }, m.name)), _jsx("p", { className: css.hint, children: archiveView ? l("点击成员查看保存的配置与执行记录；恢复并编辑后可调整。") : l("点击成员卡片直接编辑；讨论调整默认继续该成员的独立讨论，保留历史上下文。") })] })] }), _jsxs("main", { className: css.graphArea, children: [_jsxs("nav", { className: css.toolbar, "aria-label": l("画布工具"), children: [_jsxs("button", { "aria-pressed": !panMode, onClick: () => setPanMode(false), children: [_jsx(WorkflowIcon, { name: "select" }), l("选择")] }), _jsxs("button", { "aria-pressed": panMode, onClick: () => setPanMode(true), children: [_jsx(WorkflowIcon, { name: "pan" }), l("平移")] }), _jsx("button", { "aria-label": l("缩小画布"), disabled: zoom <= .1, onClick: () => changeZoom(zoom - .1), children: "\u2212" }), _jsxs("button", { title: l("恢复 100%"), "aria-label": l("缩放 {0}%，点击恢复 100%", Math.round(zoom * 100)), onClick: () => changeZoom(1), children: [Math.round(zoom * 100), "%"] }), _jsx("button", { "aria-label": l("放大画布"), disabled: zoom >= 2, onClick: () => changeZoom(zoom + .1), children: "\uFF0B" }), !editing && team.phase !== 'staged' && !!team.workflow?.loops?.length && _jsx("button", { "aria-pressed": showLoopSteps, onClick: () => setShowLoopSteps(value => !value), children: l.language === 'en' ? showLoopSteps ? 'Hide loop steps' : 'Show loop steps' : showLoopSteps ? '收起循环任务' : '展开循环任务' }), _jsxs("button", { onClick: fitCanvas, children: [_jsx(WorkflowIcon, { name: "fit" }), l("适应画布")] }), _jsxs("button", { disabled: working || archiveView || !team.tasks.length, onClick: () => void arrangeCanvas(), children: [_jsx(WorkflowIcon, { name: "arrange" }), l("自动整理")] })] }), _jsx("div", { className: css.canvas, "data-pan": panMode || !editing || archiveView, "data-linking": !!link, ref: canvas, onDragOver: event => {
                                                    if (!working && !archiveView && event.dataTransfer.types.includes('application/x-teamflow-gate'))
                                                        event.preventDefault();
                                                }, onDrop: event => {
                                                    if (event.dataTransfer.getData('application/x-teamflow-gate') !== 'gate')
                                                        return;
                                                    event.preventDefault();
                                                    const center = point(event);
                                                    const at = storedPoint({ x: center.x - 112.5, y: center.y - 75 });
                                                    void createNode('gate', { x: Math.max(0, Math.min(10000, at.x)), y: Math.max(0, Math.min(10000, at.y)) });
                                                }, onPointerDownCapture: beginPan, onClickCapture: event => { if (suppressPanClick.current) {
                                                    suppressPanClick.current = false;
                                                    event.preventDefault();
                                                    event.stopPropagation();
                                                } }, children: _jsxs("div", { className: css.plane, style: { width: graphWidth, height: graphHeight, zoom }, children: [_jsxs("svg", { className: css.edges, "aria-label": l("任务交接连线"), children: [_jsxs("defs", { children: [_jsx("marker", { id: "workflow-arrow", markerUnits: "userSpaceOnUse", markerWidth: "8", markerHeight: "8", refX: "8", refY: "4", orient: "auto", children: _jsx("path", { d: "M0,0 L8,4 L0,8", fill: "var(--wb-muted)" }) }), _jsx("marker", { id: "workflow-arrow-active", markerUnits: "userSpaceOnUse", markerWidth: "8", markerHeight: "8", refX: "8", refY: "4", orient: "auto", children: _jsx("path", { d: "M0,0 L8,4 L0,8", fill: "var(--wb-accent)" }) }), ['pass', 'reject'].map(kind => _jsx("marker", { id: `workflow-arrow-${kind}`, markerUnits: "userSpaceOnUse", markerWidth: "8", markerHeight: "8", refX: "8", refY: "4", orient: "auto", children: _jsx("path", { d: "M0,0 L8,4 L0,8", fill: kind === 'pass' ? 'var(--loop-pass)' : 'var(--loop-reject)' }) }, kind))] }), loopRegions.map(region => _jsxs("g", { className: css.loopRegion, "data-loop-region": region.loop.id, children: [_jsx("rect", { x: region.x, y: region.y, width: region.width, height: region.height, rx: "20" }), _jsxs("text", { x: region.x + 16, y: region.y + 20, fontSize: "12", children: [l.language === 'en' ? 'LOOP' : '循环区域', " \u00B7 ", region.loop.bodyIds.length, " ", l.language === 'en' ? 'steps' : '个步骤', " \u00B7 ", region.loop.round, "/", region.loop.maxRounds] })] }, region.loop.id)), canvasTasks.flatMap(t => t.dependencies.map(dep => {
                                                                    const path = connectionPath(connectionPort(canvasPos(dep), 'output', gateNode(team.tasks.find(task => task.id === dep))), connectionPort(canvasPos(t.id), 'input', gateNode(t)));
                                                                    const pass = gateNode(team.tasks.find(task => task.id === dep));
                                                                    const selected = selectedEdge?.from === dep && selectedEdge.to === t.id;
                                                                    const related = highlightedTask === dep || highlightedTask === t.id;
                                                                    return _jsxs("g", { "data-flow-branch": pass ? 'pass' : undefined, "data-selected": selected, "data-related": related, "data-dimmed": (!!highlightedTask || !!selectedEdge) && !related && !selected, className: css.edge, children: [_jsx("path", { d: path, markerEnd: pass ? 'url(#workflow-arrow-pass)' : selected ? 'url(#workflow-arrow-active)' : 'url(#workflow-arrow)' }), pass && _jsx("text", { x: (canvasPos(dep).x + 225 + canvasPos(t.id).x) / 2, y: (canvasPos(dep).y + 75 + canvasPos(t.id).y + 55) / 2 - 12, textAnchor: "middle", fontSize: "12", fontWeight: "650", children: "PASS" }), (!compactLoops || team.tasks.find(task => task.id === t.id)?.dependencies.includes(dep)) && _jsx("path", { className: css.edgeHit, d: path, role: "button", tabIndex: 0, "aria-label": l("交接：{0} → {1}", team.tasks.find(task => task.id === dep)?.subject ?? dep, t.subject), "aria-pressed": selectedEdge?.from === dep && selectedEdge.to === t.id, onClick: () => { choose({ type: 'edge', from: dep, to: t.id }); }, onKeyDown: event => { if (event.key === 'Enter' || event.key === ' ') {
                                                                                    event.preventDefault();
                                                                                    choose({ type: 'edge', from: dep, to: t.id });
                                                                                } } })] }, `${dep}-${t.id}`);
                                                                })), reviewHistoryEdges(canvasTasks).map(edge => _jsxs("g", { className: css.historyEdge, "data-review-history-edge": true, children: [_jsx("path", { d: connectionPath(connectionPort(canvasPos(edge.from), 'output', gateNode(team.tasks.find(t => t.id === edge.from))), connectionPort(canvasPos(edge.to), 'input', gateNode(team.tasks.find(t => t.id === edge.to)))), markerEnd: "url(#workflow-arrow)" }), _jsx("text", { x: (canvasPos(edge.from).x + CARD_WIDTH + canvasPos(edge.to).x) / 2, y: (canvasPos(edge.from).y + canvasPos(edge.to).y) / 2 + 42, textAnchor: "middle", fontSize: "11", children: l('历史路径') })] }, `history:${edge.from}:${edge.to}`)), loopRegions.map(region => _jsxs("g", { className: css.edge, "data-flow-branch": "reject", children: [_jsx("path", { d: region.returnPath, strokeDasharray: "7 5", markerEnd: "url(#workflow-arrow-reject)" }), _jsxs("text", { x: region.label.x, y: region.label.y, textAnchor: "middle", fontSize: "13", fontWeight: "650", children: ["REJECT \u00B7 ", l.language === 'en' ? 'Revise with feedback' : '按意见改进', " \u00B7 ", region.loop.round, "/", region.loop.maxRounds] })] }, region.loop.id)), link && _jsx("path", { d: connectionPath(link.returning ? { x: canvasPos(link.from).x + 112.5, y: canvasPos(link.from).y + 150 } : connectionPort(canvasPos(link.from), 'output', gateNode(team.tasks.find(task => task.id === link.from))), link) })] }), !archiveView && loopRegions.map(({ loop, x, bottom }) => {
                                                            if (team.halted || team.phase === 'staged')
                                                                return null;
                                                            const held = team.tasks.some(task => loop.bodyIds.includes(task.id) && task.workflowLoopTaskHold && task.workflowPaused);
                                                            const resume = canStartLoopWithFlow(loop) || (loop.status === 'running' || loop.queued) && held;
                                                            const pause = ['running', 'reviewing'].includes(loop.status) || loop.queued;
                                                            if (!resume && !pause)
                                                                return null;
                                                            return _jsxs("div", { "data-loop-playback": loop.id, className: css.loopPlayback, style: { left: x + 16, top: bottom - 29 }, children: [resume && _jsx("button", { type: "button", disabled: working || !!unsaved.length, onPointerDown: event => event.stopPropagation(), onClick: () => void perform('loop_start', { loopId: loop.id, base: data.base }), children: l(loop.status === 'ready' && !loop.queued ? '启动循环' : '继续循环') }), pause && _jsx("button", { type: "button", disabled: working || !!unsaved.length, onPointerDown: event => event.stopPropagation(), onClick: () => void perform('loop_pause', { loopId: loop.id, base: data.base }), children: l.language === 'en' ? 'Pause loop' : '暂停循环' })] }, loop.id);
                                                        }), canvasTasks.map(task => {
                                                            const gateLoop = team.workflow?.loops?.find(loop => loop.gateId === task.id);
                                                            const p = canvasPos(task.id), control = taskControlState(team, { ...task, workflowAwaitingStart: awaitsFirstStart(task) }, archiveView);
                                                            const en = l.language === 'en';
                                                            const execution = data.execution?.[task.id];
                                                            const reviewing = task.status === 'pending' && !!task.checkpoint && !gateNode(task) && data.busy.includes('check:' + task.id);
                                                            const live = !archiveView && !team.halted && !task.workflowPaused && !task.reassigning &&
                                                                (reviewing || execution === 'active' || gateLoop?.mode === 'ai' && gateLoop.status === 'reviewing' && data.activity?.members.some(m => m.name === task.assignee && m.activity === 'working'));
                                                            const draft = !archiveView && adaptationStatus === 'ready' && adaptationDiscussion?.proposal?.operations.some(op => op.action === 'update_task' && op.id === task.id);
                                                            const preparing = !archiveView && adaptationStatus === 'generating' && task.workflowConfigPending;
                                                            const waiting = draft || task.checkpoint && data.ready.includes(task.id);
                                                            const blocked = execution === 'interrupted' || ['failed', 'blocked', 'reviewRejected'].includes(control.visual);
                                                            const tone = live ? 'running' : blocked ? 'blocked' : task.status === 'completed' ? 'complete' : waiting ? 'decision' : preparing ? 'adapt' : 'ready';
                                                            const actor = reviewing ? (en ? 'Review agent' : '验收 Agent') : task.assignee === 'captain' ? 'Captain' : task.assignee ||
                                                                (task.checkpoint ? (gateNode(task) ? (en ? 'Human review' : '人工审核') : (task.checkpoint.mode === 'ai' ? 'AI' : en ? 'Human review' : '人工审核')) : task.kind === 'archive' ? l('系统自动归档') : (en ? 'Unassigned' : '待分配 Agent'));
                                                            const previous = task.reassigning && team.members.find(m => m.id && m.id === task.handoffFromMemberId)?.name;
                                                            const identity = preparing ? 'Captain' : previous ? previous + ' → ' + actor : actor;
                                                            const portrait = preparing || task.assignee === 'captain' ? LEAD_ART : task.checkpoint && !task.assignee ? REVIEW_ART : task.assignee ? memberArtUrl(task.assignee, team.members.find(m => m.name === task.assignee)?.role ?? '') : undefined;
                                                            const stateText = live ? (reviewing ? (en ? 'Review in progress' : '正在初审') : (en ? 'Running' : '执行中')) :
                                                                task.reassigning ? (en ? 'Handoff in progress' : '交接中') : draft ? (en ? 'Review task changes' : '适配方案待确认') :
                                                                    preparing ? (en ? 'Adapting workflow' : '正在适配流程') + (task.assignee ? ' · ' + task.assignee : '') : blocked && execution === 'interrupted' ? (en ? 'Interrupted' : '执行中断') :
                                                                        waiting ? (en ? 'Awaiting decision' : '待你决策') : undefined;
                                                            const who = _jsxs("span", { className: css.canvasActor, title: identity, children: [portrait && _jsx("img", { src: portrait, alt: "" }), gateLoop?.mode === 'ai' && !preparing && _jsx("small", { children: "Agent" }), _jsx("b", { children: identity })] });
                                                            return _jsxs("article", { "data-task-selected": selectedTask === task.id || undefined, "data-full-card": !gateNode(task) || undefined, "data-canvas-node": task.id, "data-tone": tone, "data-loop-gate": gateNode(task) || undefined, "data-node-shape": gateNode(task) ? 'decision' : task.kind === 'archive' ? 'archive' : 'task', "data-gate-mode": task.checkpoint ? gateLoop?.mode ?? task.checkpoint.mode ?? 'human' : undefined, "data-lifecycle": control.visual, "data-status": task.status, "data-member-match": selection.type === 'member' && !!selection.id && task.assignee === selection.id || undefined, "data-connection": link?.to === task.id ? link.issue ? 'invalid' : 'valid' : undefined, "data-review-ready": !!task.checkpoint && !task.checkpoint.decision && data.ready.includes(task.id), "data-config-pending": task.workflowConfigPending || undefined, "data-suspended": task.workflowRerunRequired || undefined, className: `${css.node} ${taskStateNodeClass} ${gateNode(task) ? `${css.checkpoint} ${css.gateNode}` : ''} ${highlightedTask === task.id ? css.selected : ''}`, style: { left: p.x, top: p.y }, onDragStart: event => event.preventDefault(), onPointerDown: event => beginNodeDrag(event, task), onClickCapture: event => { if (event.detail && suppressNodeClick.current) {
                                                                    suppressNodeClick.current = false;
                                                                    event.preventDefault();
                                                                    event.stopPropagation();
                                                                } }, onClick: event => { if (event.target.closest('[data-connection-handle]'))
                                                                    return; if (editing && !archiveView)
                                                                    edit(task.checkpoint ? 'check' : 'task', task.id);
                                                                else
                                                                    choose({ type: task.checkpoint ? 'check' : 'task', id: task.id }); }, children: [gateNode(task) && _jsx("svg", { className: css.gateShape, viewBox: "0 0 225 150", "aria-hidden": "true", children: _jsx("path", { d: WORKFLOW_GATE_PATH }) }), _jsxs("div", { className: `${css.drag} ${css.iconLabel}`, children: [_jsx(WorkflowIcon, { name: gateNode(task) ? 'gate' : task.checkpoint ? 'acceptance' : task.kind === 'archive' ? 'archive' : 'task' }), task.checkpoint ? gateNode(task) ? loopLabel : l('验收节点') : task.kind === 'archive' ? l("成果归档") : l("任务节点"), " \u00B7 ", task.id, gateNode(task) && renderTaskControl(task)] }), gateNode(task) ? _jsxs(_Fragment, { children: [_jsxs("div", { className: css.gateBody, children: [_jsx("button", { type: "button", className: css.gateTask, "aria-pressed": selectedTask === task.id, "data-card-task": task.id, "aria-label": `${loopLabel}：${task.subject}`, children: _jsx("strong", { title: task.subject, children: task.subject }) }), gateLoop?.mode === 'ai' && gateLoop.reviewer && !preparing ? _jsx("button", { type: "button", className: css.gateMember, "data-card-member": gateLoop.reviewer, "aria-pressed": selection.type === 'member' && selection.id === gateLoop.reviewer, "aria-label": l.language === 'en' ? 'View agent · ' + gateLoop.reviewer : '查看 Agent · ' + gateLoop.reviewer, onClick: e => { e.stopPropagation(); edit('member', gateLoop.reviewer); }, children: who }) : who, _jsx(TaskStateBadge, { control: control, t: t, detail: taskReadiness(team, task, l).detail, labelText: stateText })] }), _jsx("span", { className: css.gateCaption, children: gateLoop ? (l.language === 'en' ? `Round ${gateLoop.round} / ${gateLoop.maxRounds}` : `第 ${gateLoop.round} / ${gateLoop.maxRounds} 轮`) : l('请连接返回线') })] }) : _jsx(CanvasTaskCard, { playback: renderTaskControl(task), onMember: name => edit('member', name), selectedMember: selection.type === 'member' ? selection.id : undefined, team: team, task: task, control: control, execution: data.execution?.[task.id], archived: archiveView, reviewing: !!task.checkpoint && task.status === 'pending' && data.busy.includes('check:' + task.id), adapting: !archiveView && adaptationStatus === 'generating' && !!task.workflowConfigPending, draft: !archiveView && adaptationStatus === 'ready' && !!adaptationDiscussion?.proposal?.operations.some(op => op.action === 'update_task' && op.id === task.id), systemOwned: task.kind === 'archive' }), task.checkpoint && _jsx("span", { className: css.cardMode, children: reviewModeSelect(task) }), gateNode(task) && _jsx("button", { type: "button", className: css.returnPort, "data-connection-handle": true, "aria-label": "REJECT", disabled: working || archiveView || !editing || !!gateLoop?.historyCount, onClick: () => { if (selectedTask !== task.id)
                                                                            choose({ type: 'check', id: task.id }); }, onPointerDown: e => {
                                                                            if (e.button !== 0)
                                                                                return;
                                                                            e.preventDefault();
                                                                            const handle = e.currentTarget;
                                                                            handle.setPointerCapture(e.pointerId);
                                                                            handle.onpointermove = move => setLink({ from: task.id, returning: true, ...point(move) });
                                                                            const cleanup = () => { handle.onpointermove = null; handle.onpointerup = null; handle.onpointercancel = null; setLink(undefined); };
                                                                            handle.onpointercancel = cleanup;
                                                                            handle.onpointerup = up => {
                                                                                cleanup();
                                                                                const target = connectionTarget(team.tasks, pos, point(up), task.id, gateNode);
                                                                                if (!target)
                                                                                    return;
                                                                                if (target.checkpoint || !upstreamIds(team.tasks, task.id).has(target.id)) {
                                                                                    setError(l.language === 'en' ? 'Choose an upstream task' : '请选择已连接的上游任务');
                                                                                    return;
                                                                                }
                                                                                choose({ type: 'check', id: task.id });
                                                                                setReturnDraft({ gate: task.id, entry: target.id });
                                                                            };
                                                                        }, children: "REJECT" }), _jsx("button", { className: `${css.port} ${css.input}`, "data-connection-handle": true, "data-input-id": task.id, "aria-label": l("{0} 输入端", task.subject) }), _jsx("button", { className: `${css.port} ${css.output}`, "data-connection-handle": true, "aria-label": l("{0} 输出端", task.subject), disabled: working || archiveView || !editing || (taskEditing && !editor?.id), title: l("从圆点拖出连接线"), onPointerDown: event => {
                                                                            if (event.button !== 0)
                                                                                return;
                                                                            event.preventDefault();
                                                                            const target = event.currentTarget;
                                                                            target.setPointerCapture(event.pointerId);
                                                                            const update = (move) => {
                                                                                const at = point(move), to = connectionTarget(team.tasks, pos, at, task.id, gateNode);
                                                                                const issue = to ? connectionIssue(team.tasks, task.id, to.id, l) : undefined;
                                                                                const end = to && !issue ? connectionPort(pos(to.id), 'input', gateNode(to)) : at;
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
                                                                                    void saveEdit([{ action: 'update_task', id: to.id, dependencies: [...to.dependencies, task.id] }], l("连接 {0} → {1}", task.subject, to.subject));
                                                                            };
                                                                            target.onpointercancel = cleanup;
                                                                        } })] }, task.id);
                                                        }), taskEditing && !editor?.id && _jsxs("article", { className: `${css.node} ${css.draftNode}`, style: { left: draftPosition.x, top: draftPosition.y }, children: [_jsx("div", { className: css.drag, children: l("草稿 · 确认后加入流程") }), _jsxs("div", { className: css.nodeBody, children: [_jsx("strong", { children: draft['subject'] || (editor?.type === 'check' ? l('验收节点') : l("新任务")) }), _jsx("span", { children: editor?.type === 'check' ? l("你与独立验收 Agent") : draft['assignee'] || l("待指定 Agent") }), _jsx("small", { children: l("尚未应用") })] })] }), !team.tasks.length && !editor && _jsx("p", { className: css.empty, children: l('添加任务、门控或验收节点，或让 AI 根据目标提出流程方案。') })] }) }), _jsx("footer", { className: css.canvasStatus, role: "status", children: link ? link.issue ?? (link.to ? l("已吸附 · 松开连接") : l("拖到下游节点 · Esc 取消")) : l("{0} 个任务节点 · {1} · 滚轮缩放（以鼠标位置为中心）{2}", team.tasks.length, editing ? l("拖动空白处平移") : l("拖动画布平移"), editing ? l(" · 靠近节点显示圆点，拖动连线 · Delete 删除") : l(" · 单击节点查看详情")) })] }), _jsx("div", { className: css.resizeHandle, role: "separator", "aria-label": l("调整右侧面板宽度"), "aria-orientation": "vertical", "aria-valuemin": 300, "aria-valuemax": 720, "aria-valuenow": inspectorWidth, tabIndex: inspectorHidden ? -1 : 0, onPointerDown: resizeInspector, onKeyDown: event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                                            event.preventDefault();
                                            setInspectorExpanded(false);
                                            setInspectorWidth(value => Math.max(300, Math.min(720, value + (event.key === 'ArrowLeft' ? 40 : -40))));
                                        } } }), _jsxs("section", { className: css.inspector, "aria-label": l("属性与讨论面板"), children: [_jsxs("header", { tabIndex: -1, "data-guide": "inspector", className: css.inspectorHeader, children: [_jsx("strong", { children: selection.type === 'member' && selection.id ? 'Agent · ' + selection.id : activeTask ? (gateNode(activeTask) ? loopLabel : activeTask.checkpoint ? l('验收节点') : l('任务')) + ' · ' + activeTask.subject : reviewingCheckpoint ? l("验收工作台") : editor ? l("编辑属性") : activeTask || selectedEdge ? l("节点与连接") : l("讨论与验收") }), _jsx("button", { "aria-pressed": inspectorExpanded, onClick: () => setInspectorExpanded(!inspectorExpanded), children: inspectorExpanded ? l("还原面板") : l("放大面板") })] }), activeTask && !activeTask.checkpoint && !archiveView && _jsxs("div", { className: css.taskDiscussionAction, children: [_jsxs("button", { type: "button", className: css.primary, disabled: working, onClick: () => void startEmbedded(`task:${activeTask.id}`), children: [_jsx(WorkflowIcon, { name: "chat" }), l("与 AI 讨论任务")] }), currentDirty && _jsx("small", { className: css.hint, children: l("讨论使用已保存的资料；当前草稿会保留。") })] }), activeTask?.checkpoint && !gateNode(activeTask) && !selectedEdge && _jsxs("label", { children: [l.language === 'en' ? 'Review mode' : '审核方式', " ", reviewModeSelect(activeTask)] }), activeTask && !selectedEdge && _jsx(LoopPanel, { onSelectTask: locateTask, modeSelect: reviewModeSelect(activeLoop ? team.tasks.find(task => task.id === activeLoop.gateId) : activeTask), returnDraft: returnDraft?.gate === activeTask.id ? returnDraft : undefined, team: team, task: activeTask, sessionId: sessionId, base: data.base, archived: archiveView, busy: working, perform: perform }, team.id + ':' + activeTask.id), selectedEdge && _jsxs("aside", { className: css.editor, "aria-label": l("交接详情"), children: [_jsxs("strong", { children: [team.tasks.find(task => task.id === selectedEdge.from)?.subject, " \u2192 ", team.tasks.find(task => task.id === selectedEdge.to)?.subject] }), _jsx("p", { children: l("上游完成后，下游才开始。编辑时按 Delete 删除；已开始的下游需先停止。") }), _jsx("button", { disabled: working || archiveView || !editing, onClick: () => void deleteEdge(), children: l("删除连线") })] }), activeTask && !editor && !selectedEdge && _jsxs("aside", { className: css.editor, "aria-label": activeTask.checkpoint ? gateNode(activeTask) ? loopLabel : l('验收节点') : l("任务属性"), children: [_jsxs("header", { className: css.taskHeading, children: [_jsxs("small", { children: [activeTask.checkpoint ? gateNode(activeTask) ? loopLabel : l('验收节点') : l("任务属性"), " \u00B7 ", activeTask.id] }), _jsx("h3", { "data-task-heading": true, tabIndex: -1, children: activeTask.subject }), !archiveView && editorTarget(team, selection) && _jsx("button", { onClick: () => setEditing(true), children: l("编辑节点") })] }), _jsxs("section", { className: css.taskBrief, children: [_jsx("strong", { children: l("任务要求 / 验收要求") }), _jsx("p", { children: activeTask.description || l("暂无任务说明") })] }), renderReadiness(activeTask), (activeLoop || !['completed', 'failed', 'cancelled'].includes(activeTask.status)) && renderTaskControl(activeTask), renderRerunPath(activeTask), activeTask.checkpoint && !gateNode(activeTask) && _jsxs("p", { children: [l("第 "), activeTask.checkpoint.round, " ", l(" 轮 · "), activeTask.checkpoint.note || l("暂无验收意见")] }), _jsx("div", { children: !archiveView && !activeLoop && !activeTask.checkpoint && activeTask.assignee && rerunnableTasks(team.tasks, activeTask.assignee).some(task => task.id === activeTask.id) && _jsx("button", { disabled: working, onClick: () => { edit('member', activeTask.assignee, { rerunTaskId: activeTask.id }); }, children: l("修改负责人并重跑此任务") }) }), _jsx(TaskRecord, { task: activeTask, team: team, showContract: false }), _jsx(ArchiveRecords, { sessionId: sessionId, team: team, task: activeTask, archived: archiveView }, `${team.id}:${activeTask.id}`), activeTask.checkpoint && !gateNode(activeTask) && _jsx("button", { className: css.primary, disabled: working, onClick: () => void openReview(activeTask.id), children: data.ready.includes(activeTask.id) && !archiveView ? l("开始验收") : l("查看验收工作台") })] }), reviewingCheckpoint && reviewTask && !gateNode(reviewTask) && _jsx(ReviewWorkbench, { team: team, task: reviewTask, conversation: conversation, ready: data.ready.includes(reviewTask.id), archived: archiveView, busy: working, note: note, onNote: setNote, onBranch: async (taskIds, evidence, note) => !!await perform('review', { taskId: reviewTask.id, discussion, evidence, decision: 'branch', note, taskIds }), onReopen: () => void perform('reopen_review', { taskId: reviewTask.id, base: data.base }), onRerun: async (taskId, instructions) => !!(await saveEdit([{ action: 'rerun_task', id: taskId, instructions }], l('安排验收返工'))), reworkBlocked: unsaved.length ? l('请先保存属性草稿') : undefined, continuation: _jsxs(_Fragment, { children: [!reviewTask.checkpoint?.decision && renderReadiness(reviewTask), renderRerunPath(reviewTask)] }), onBack: () => locateTask(reviewTask.id), onRefresh: () => void perform('materials', { discussion }), onDecision: async (decision, evidence, submittedNote) => {
                                                    const scope = reviewScope;
                                                    const result = await perform('review', { taskId: reviewTask.id, discussion, evidence, decision, note: submittedNote });
                                                    if (result)
                                                        setReviewNotes(notes => notes[scope] === submittedNote ? { ...notes, [scope]: '' } : notes);
                                                    return !!result;
                                                }, onDiscuss: () => void startEmbedded(discussion), onRestart: !data.currentDiscussion ? () => void startEmbedded(discussion, activeId, true) : undefined, discussionBusy: data.busy.includes(discussion), discussion: (embeddedDiscussion === discussion || !!conversation?.native) && activeId ? _jsx(EmbeddedDiscussion, { sessionId: sessionId, teamId: activeId, discussion: discussion }, `${activeId}:${discussion}:${conversation?.native?.sessionId}`) : undefined, proposal: proposal ? _jsx("section", { className: css.proposal, children: renderProposalReview() }) : undefined }, `${team.id}:${reviewTask.id}:${reviewTask.checkpoint?.round}`), !editor && !selectedEdge && !activeTask && !reviewingCheckpoint && _jsxs("aside", { className: css.discussion, "data-template-review": reviewingTemplate, children: [_jsxs("header", { children: [_jsx("img", { src: reviewTask ? REVIEW_ART : member ? memberArtUrl(member.name, member.role ?? '') : LEAD_ART, alt: "" }), _jsxs("div", { children: [_jsx("h3", { "data-review-heading": true, tabIndex: -1, children: reviewTask ? l("验收 · {0}", reviewTask.subject) : discussionTask ? l("任务讨论 · {0}", discussionTask.subject) : member ? l("成员职责 · {0}", member.name) : discussion === 'adapt' ? l("本次任务适配") : l("流程修改") }), _jsx("small", { children: reviewTask ? l("一起检查成果，由你决定是否通过") : l("讨论不影响执行，修改确认后生效") })] })] }), _jsxs(MessageArea, { className: css.messages, children: [reviewingTemplate && _jsx("summary", { children: l("讨论记录与资料") }), discussion === 'adapt' && _jsx("p", { role: "status", className: css.hint, children: adaptationBusy ? l('AI 正在生成任务方案，完成后需你确认才会生效。') : l('可在上方查看适配状态；切换面板不会丢失这次讨论。') }), _jsx("p", { className: css.hint, children: reviewTask ? l("在此窗口内共同检查成果并确认验收决定。") : discussionTask ? l("基于已保存的任务要求、负责人、上下游和提交结果讨论；未保存草稿不会发送给 AI。") : member ? l("在这里与独立配置顾问讨论；队长对话保持独立。") : l("在此窗口内讨论团队与流程，修改方案会显示在这里。") }), discussionTask && _jsxs("div", { children: [_jsx("button", { onClick: () => locateTask(discussionTask.id), children: l("返回任务属性") }), _jsx("button", { disabled: working || archiveView, onClick: () => void startEmbedded('graph'), children: l("讨论整体流程与拆分") })] }), archiveView ? _jsx("p", { className: css.hint, children: l("恢复并编辑流程后可继续讨论。") }) : (embeddedDiscussion === discussion || discussion === 'adapt' && !!conversation?.native) && activeId ? _jsx(EmbeddedDiscussion, { sessionId: sessionId, teamId: activeId, discussion: discussion }, `${activeId}:${discussion}:${conversation?.native?.sessionId}`) : _jsx("button", { className: css.primary, disabled: working, onClick: () => member ? prepareDiscussion(member.name) : void startEmbedded(discussion), children: l(conversation?.native ? "继续在此处讨论" : "在此处开始讨论") }), _jsxs("details", { open: archiveView || !proposal && selection.type === 'member', children: [_jsx("summary", { children: l("已保存资料（不含待确认修改）") }), _jsx(WorkflowContext, { team: team, discussion: discussion, onSelect: key => key.startsWith('member:') ? edit('member', key.slice(7)) : selectDiscussion(key), openExecution: openExecution })] }), conversation?.materials && _jsxs("details", { open: true, children: [_jsx("summary", { children: l("本轮验收材料与证据") }), _jsx(ReviewMaterials, { text: conversation.materials })] }), embeddedDiscussion !== discussion && data.busy.includes(discussion) && _jsx("p", { role: "status", children: l("原生对话正在整理方案…") })] }), !archiveView && proposal && _jsx("section", { className: css.proposal, children: renderProposalReview() }), !archiveView && !data.currentDiscussion && _jsxs("details", { children: [_jsx("summary", { children: l("重新开始讨论") }), _jsx("p", { className: css.hint, children: l("新建独立讨论会归档当前讨论，从当前资料重新开始。") }), _jsx("button", { disabled: working || data.busy.includes(discussion), onClick: () => void startEmbedded(discussion, activeId, true), children: l("新建独立讨论") })] })] }), editor && _jsxs("form", { "data-workflow-editor": true, className: css.editor, onSubmit: event => {
                                                    event.preventDefault();
                                                    try {
                                                        const route = draft['routeChanged'] ? { provider: draft['provider'], model: draft['model'], reasoningEffort: draft['reasoningEffort'] || 'default' } : {};
                                                        const rerunTask = terminalEdit && event.nativeEvent.submitter?.hasAttribute('data-rerun-task');
                                                        const operations = editor.type === 'member' ? [editor.id ? { action: 'update_member', name: editor.id, summary: draft['summary'], role: draft['role'], executionPrompt: draft['executionPrompt'], specificPrompt: draft['specificPrompt'], ...draftGalleryAccess(draft), ...route } : { action: 'add_member', name: draft['name'] ?? '', summary: draft['summary'] ?? '', role: draft['role'], executionPrompt: draft['executionPrompt'], specificPrompt: draft['specificPrompt'], ...draftGalleryAccess(draft), ...route }]
                                                            : [editor.id ? { action: rerunTask ? 'rerun_task' : 'update_task', id: editor.id, ...!rerunTask && activeTask?.workflowConfigPending ? { confirmConfiguration: true } : {}, ...rerunTask ? { instructions: draft['rerunInstructions'] } : {}, subject: draft['subject'] ?? '', description: draft['description'], adaptationIssue: draft['adaptationIssue'] ?? '', assignee: editor.type === 'check' || activeTask?.kind === 'archive' ? undefined : draft['assignee'], ...activeTask?.kind === 'archive' ? { archive: archiveDraft(draft) } : {} } : { action: 'add_task', checkpoint: editor.type === 'check', ...editor.type === 'check' ? { checkpointKind: 'acceptance' } : {}, subject: draft['subject'] ?? '', description: draft['description'], adaptationIssue: draft['adaptationIssue'] ?? '', assignee: editor.type === 'check' || activeTask?.kind === 'archive' ? undefined : draft['assignee'], ...activeTask?.kind === 'archive' ? { archive: archiveDraft(draft) } : {}, dependencies: [] }];
                                                        const rerun = event.nativeEvent.submitter?.getAttribute('data-rerun') === 'true';
                                                        if (rerun) {
                                                            if (!editor.id || !draft['rerunTaskId'] || !team.tasks.some(task => task.id === draft['rerunTaskId'] && task.assignee === editor.id))
                                                                throw new Error(l("请选择该成员的已结束任务"));
                                                            // Save member settings first, then review the selected task's result and new requirements.
                                                        }
                                                        const resumeId = event.nativeEvent.submitter?.getAttribute('data-resume') === 'true' ? editor.id : undefined;
                                                        const resumeCheck = editor.type === 'check', revision = viewRef.current.revision, rerunTaskId = rerun ? draft['rerunTaskId'] : undefined;
                                                        void saveEdit(operations, rerun ? l("保存成员配置并进入重跑编辑") : editor.type === 'member' ? l("调整团队成员") : l("调整任务"), true).then(async (saved) => { if (saved && rerunTaskId && revision === viewRef.current.revision)
                                                            edit('task', rerunTaskId); if (saved && resumeId && await perform('resume_task', { taskId: resumeId, base: saved.base }) && resumeCheck && revision === viewRef.current.revision)
                                                            await openReview(resumeId); });
                                                    }
                                                    catch (error) {
                                                        setError(error instanceof Error ? error.message : String(error));
                                                    }
                                                }, children: [_jsxs("div", { className: css.formBody, children: [_jsxs("h3", { children: [editor.id ? l("编辑") : l("添加"), editor.type === 'member' ? l("成员") : editor.type === 'check' ? gateNode(activeTask) ? loopLabel : l('验收节点') : l("任务"), " ", _jsx("small", { className: currentDirty ? css.dirtyDot : css.hint, children: currentDirty ? l("未保存") : editor.id ? l("已保存") : l("尚未创建") })] }), terminalEdit && activeTask && _jsxs("section", { className: css.rerunContext, "aria-label": l("重跑输入"), children: [field('rerunInstructions', l("重跑要求（仅重跑时必填）"), true), _jsxs("details", { children: [_jsx("summary", { children: l("上一轮结果（自动提供给 Agent）") }), _jsx("pre", { children: activeTask.output || l("上一轮未提交结果") })] }), _jsx("p", { children: l("Agent 将结合原任务要求、上一轮结果和本次新增要求重新执行，并重新验证结果。") })] }), terminalEdit && activeTask && _jsx(_Fragment, { children: _jsxs("p", { className: css.notice, children: [l("选择重跑将开启新一轮执行，原有状态与结果保存在历史执行记录中。以下下游先等待新结果："), rerunImpact(team.tasks, activeTask.id).descendants.map(task => task.subject).join('、') || l("无"), l("。可在任意下游节点选择「运行到此节点」，按依赖执行；人工检查仍需确认，其他分支保留。"), team.phase === 'staged' ? l("请先查看流程并确认启动团队，再重跑。") : ''] }) }), editor.type === 'member' ? _jsxs(_Fragment, { children: [field('name', l("名称")), _jsxs("div", { className: css.memberModelSettings, children: [_jsx("strong", { children: l("模型与 Thinking") }), modelDirectory && t ? _jsx(StagedModelPicker, { directory: modelDirectory, t: t, provider: draft['provider'] ?? '', model: draft['model'] ?? '', reasoningEffort: draft['reasoningEffort'] ?? '', busy: working, onChange: selection => setDraft(prev => ({ ...prev, ...selection, routeChanged: 'yes' })) }) : _jsx("p", { className: css.hint, children: l("模型目录暂不可用，请从会话右上角的流程入口打开画布。") })] }), field('summary', l("Summary · 功能概述"), true), field('role', l("角色职责"), true), field('executionPrompt', l("通用执行指令 / PE"), true), field('specificPrompt', l("本次补充指令（可选）"), true), galleryAccessKeys.map(key => _jsxs("label", { className: css.galleryPermission, children: [_jsx("input", { type: "checkbox", checked: draft[key] !== 'false', disabled: working, onChange: event => setDraft(prev => ({ ...prev, [key]: String(event.target.checked) })) }), key === 'gallerySkill' ? l("允许使用 Gallery Skill") : l("允许使用 Gallery MCP")] }, key))] })
                                                                : _jsxs(_Fragment, { children: [field('subject', l("任务名称")), field('description', l("任务要求 / 验收要求"), true), activeTask?.adaptationIssue && _jsxs("section", { className: css.adaptationIssue, children: [field('adaptationIssue', l("需要确认的问题（处理后清空）"), true), draft['adaptationIssue']?.trim() ? _jsxs(_Fragment, { children: [_jsx("p", { children: l("请先补充任务要求，再明确标记问题已解决。仅修改任务正文不会自动清除问题。") }), _jsx("button", { type: "button", disabled: working, onClick: () => setDraft({ ...draft, adaptationIssue: '' }), children: l("已解决，清除问题") })] }) : _jsx("p", { role: "status", children: l("问题已标记解决，保存后生效。") })] }), activeTask?.kind === 'archive' && _jsxs(_Fragment, { children: [_jsx("p", { children: l('自动保存上游成果、执行版本、评审和循环历史引用。文件路径留空时使用上游声明的交付物与变更路径。') }), _jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: draft['copyFiles'] === 'true', onChange: e => setDraft({ ...draft, copyFiles: String(e.target.checked) }) }), l('复制可审计文件（单文件 2 MiB，总计 32 MiB）')] }), field('archivePaths', l('归档文件范围（工作区相对路径，每行一项）'), true)] }), editor.type !== 'check' && activeTask?.kind !== 'archive' && _jsxs("label", { children: [l("执行 Agent"), _jsxs("select", { disabled: !!activeLoop, value: draft['assignee'] ?? '', onChange: e => setDraft({ ...draft, assignee: e.target.value }), children: [_jsx("option", { value: "", children: l("由空闲成员领取") }), team.members.filter(m => m.status !== 'removed').map(m => _jsx("option", { children: m.name }, m.name))] })] }), _jsx("p", { className: css.hint, children: l("节点已在画布中，靠近节点后可拖动右侧圆点连线。修改名称或要求后点击保存。") })] }), editor.type !== 'member' && activeTask && _jsxs(_Fragment, { children: [renderReadiness(activeTask), !terminalEdit && _jsxs(_Fragment, { children: [renderTaskControl(activeTask), renderRerunPath(activeTask)] })] }), editor.type !== 'member' && activeTask && _jsxs(_Fragment, { children: [_jsx(TaskRecord, { task: activeTask, team: team, expanded: false, showContract: false }), _jsx(ArchiveRecords, { sessionId: sessionId, team: team, task: activeTask, archived: archiveView }, `${team.id}:${activeTask.id}`)] }), editor.type === 'member' && editor.id && _jsx(TaskRerunPicker, { tasks: team.tasks, member: editor.id, taskId: draft['rerunTaskId'] ?? '', disabled: working, onTask: id => setDraft(prev => ({ ...prev, rerunTaskId: id })) }), editor.type !== 'member' && activeTask?.workflowRerunRequired && _jsx("p", { className: css.hint, children: taskReadiness(team, activeTask, l).detail }), feedback && _jsx("p", { role: "status", children: workflowMessage(feedback, l) }), _jsx("p", { className: css.hint, children: l("属性需点击保存；草稿保存在此标签页，刷新可恢复。Esc 退出编辑并保留草稿。") }), draftStale && _jsxs("p", { role: "alert", children: [l("当前对象已变化，草稿仍保留。"), _jsx("button", { type: "button", onClick: () => { if (draftId)
                                                                            updateView(current => { const drafts = { ...current.drafts }; delete drafts[draftId]; return { ...current, drafts }; }); }, children: l("重新载入") })] })] }), _jsxs("footer", { children: [editor.type !== 'member' && !!draft['adaptationIssue']?.trim() && _jsx("button", { type: "button", onClick: () => focusAttention('[data-workflow-editor] [data-field="adaptationIssue"] textarea'), children: l("先处理需要确认的问题") }), _jsx("button", { className: css.primary, disabled: working || (editor.type !== 'member' && !!draft['adaptationIssue']?.trim()), children: gateNode(activeTask) && !activeLoop ? l('保存要求') : activeTask?.workflowConfigPending && editor.type !== 'member' ? l("保存并完成配置") : l("保存") }), terminalEdit && _jsx("button", { type: "submit", "data-rerun-task": true, disabled: working || team.halted || team.phase === 'staged' || !!draft['adaptationIssue']?.trim() || !draft['rerunInstructions']?.trim(), children: l("保存并重跑此任务") }), editor.type === 'member' && editor.id && rerunnableTasks(team.tasks, editor.id).some(task => task.id === draft['rerunTaskId']) && _jsx("button", { type: "submit", "data-rerun": "true", disabled: working, children: l("保存成员并编辑重跑要求") }), editor.id && editor.type !== 'member' && !activeLoop && !gateNode(activeTask) && !terminalEdit && !activeTask?.workflowConfigPending && !activeTask?.workflowRerunRequired && team.tasks.find(task => task.id === editor.id)?.workflowPaused && _jsx("button", { type: "submit", "data-resume": "true", disabled: working || (activeTask?.workflowRerunRequired && activeTask.dependencies.some(id => team.tasks.find(task => task.id === id)?.status !== 'completed')), children: activeTask?.workflowRerunRequired ? editor.type === 'check' ? l("使用新结果重新验收") : l("使用新结果执行") : editor.type === 'check' ? l("保存并开始验收") : l("保存并开始执行") }), editor.id && editor.type !== 'member' && !activeLoop && !terminalEdit && activeTask?.status === 'pending' && _jsx("button", { type: "button", disabled: working, onClick: () => void deleteNode(editor.id), children: l("删除节点") }), editor.type === 'check' && !gateNode(activeTask) && editor.id && data.ready.includes(editor.id) && _jsx("button", { type: "button", disabled: working, onClick: () => void openReview(editor.id), children: l("开始验收 ↗") }), _jsx("button", { type: "button", onClick: cancelEdit, children: l("放弃修改") }), editor.type === 'member' && editor.id && _jsx("button", { type: "button", disabled: working, onClick: () => void saveEdit([{ action: 'remove_member', name: editor.id }], l("移除 {0}", editor.id), true), children: l("移除成员") })] })] }, `${editor.type}:${editor.id ?? 'new'}`)] })] })] })] }), document.body)] });
}
export function WorkflowWorkbench(props) {
    return _jsx(WorkflowLocale, { t: props.t, children: _jsx(Workbench, { ...props }, props.sessionId) });
}
