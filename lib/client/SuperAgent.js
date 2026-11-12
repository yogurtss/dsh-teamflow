import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { ConversationCard } from "./SupervisorCard.js";
import { BrandIcon } from "./BrandIcon.js";
import { AssistantReply } from "./EmbeddedDiscussion.js";
import { WorkflowLocale } from "./workflow-i18n.js";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { selectedWorkflowWorkspace } from "./workflow-launcher.js";
import { WorkflowWorkbench } from "./WorkflowWorkbench.js";
import { superAgentEntry } from "./super-agent-navigation.js";
import { defaultWatchKinds, watchKinds } from "../super-agent-watch.js";
import css from './SuperAgent.module.css';
const unreadChanged = 'teamflow:unread-changed';
const openCurrentChat = 'teamflow:open-current-chat';
function GlobalConversation(props) {
    const en = props.t('language.code') === 'en';
    const [log, setLog] = useState(), [draft, setDraft] = useState(''), [error, setError] = useState(''), [sending, setSending] = useState(false);
    const [archive, setArchive] = useState(''), [confirm, setConfirm] = useState(false), [generation, reload] = useState(0);
    const feed = useRef(null), input = useRef(null);
    const stick = useRef(!props.anchor), anchored = useRef(false);
    useEffect(() => {
        const open = () => { setArchive(''); setConfirm(false); stick.current = true; };
        window.addEventListener(openCurrentChat, open);
        return () => window.removeEventListener(openCurrentChat, open);
    }, []);
    useEffect(() => {
        const before = document.activeElement;
        if (props.visible === false)
            return;
        input.current?.focus();
        const controller = new AbortController();
        let timer;
        let acknowledged = -1, seenSession = '';
        async function refresh() {
            try {
                const next = await request('', 'history', { archive: archive || undefined }, controller.signal);
                if (!controller.signal.aborted) {
                    setLog(next);
                    if (!archive && !document.hidden && feed.current?.getClientRects().length && (seenSession !== next.sessionId || next.latest > acknowledged)) {
                        const result = await request('', 'seen', { sessionId: next.sessionId, through: next.latest }, controller.signal);
                        seenSession = next.sessionId;
                        acknowledged = next.latest;
                        window.dispatchEvent(new CustomEvent(unreadChanged, { detail: result.count }));
                    }
                }
            }
            catch (e) {
                if (!controller.signal.aborted)
                    setError(String(e));
            }
            finally {
                if (!controller.signal.aborted)
                    timer = setTimeout(refresh, 1200);
            }
        }
        void refresh();
        return () => { controller.abort(); clearTimeout(timer); before?.focus(); };
    }, [archive, generation, props.visible]);
    useEffect(() => {
        if (!feed.current)
            return;
        if (props.anchor && !anchored.current) {
            const card = Array.from(feed.current.querySelectorAll('[data-supervisor-card]')).find(el => el.dataset.supervisorCard === props.anchor);
            if (card) {
                card.scrollIntoView({ block: 'center' });
                anchored.current = true;
            }
        }
        else if (stick.current)
            feed.current.scrollTop = feed.current.scrollHeight;
    }, [log, props.anchor]);
    async function send() {
        if (sending || !draft.trim())
            return;
        setSending(true);
        setError('');
        try {
            await request('', 'send', { question: draft, sessionId: log?.sessionId });
            setDraft('');
            stick.current = true;
        }
        catch (e) {
            setError(String(e));
        }
        finally {
            setSending(false);
        }
    }
    const entries = log ? [...log.messages.map(m => ({ seq: Number(m.id), view: _jsxs("div", { className: css.chatLine, "data-role": m.role, children: [_jsx("b", { children: m.role === 'user' ? (en ? 'You' : '你') : 'Super Agent' }), m.role === 'user' ? m.text : _jsx(AssistantReply, { text: m.text, streaming: false })] }) })),
        ...log.records.map(r => ({ seq: r.seq, view: _jsx(ConversationCard, { ...props, archived: !!archive, sessionId: log.sessionId, card: r.card }) }))].sort((a, b) => a.seq - b.seq) : [];
    return _jsx("div", { className: props.inline ? css.chatPage : css.dialogShade, children: _jsxs("section", { className: css.globalChat, role: props.inline ? 'region' : 'dialog', "aria-modal": props.inline ? undefined : true, "aria-label": en ? 'Global conversation' : '全局对话', children: [_jsxs("header", { children: [_jsx(BrandIcon, {}), _jsxs("h2", { children: ["Super Agent \u00B7 ", en ? 'Global conversation' : '全局对话'] }), props.settings && _jsx("button", { onClick: props.settings, children: en ? 'Watch settings' : '监听设置' }), !!log?.archives.length && _jsxs("select", { "aria-label": en ? 'Conversation history' : '对话历史', value: archive, onChange: e => { setArchive(e.target.value); setLog(undefined); }, children: [_jsx("option", { value: "", children: en ? 'Current conversation' : '当前对话' }), log.archives.map((a, i) => _jsxs("option", { value: a.id, children: [en ? 'History' : '历史对话', " ", i + 1] }, a.id))] }), !archive && _jsx("button", { disabled: !log, onClick: () => setConfirm(true), children: en ? 'Clear context' : '清除上下文' }), props.close && _jsx("button", { onClick: props.close, children: en ? 'Close' : '关闭' })] }), confirm && _jsxs("div", { className: css.resetPrompt, children: [_jsx("p", { children: en ? 'Start a fresh conversation? History, subscriptions and running workflows are retained.' : '开始一段新对话？旧聊天可在历史中查看，订阅和运行中的流程会保留。' }), _jsx("button", { onClick: () => setConfirm(false), children: en ? 'Cancel' : '取消' }), _jsx("button", { onClick: async () => { try {
                                await request('', 'reset', { sessionId: log?.sessionId });
                                setLog(undefined);
                                setDraft('');
                                setConfirm(false);
                                reload(n => n + 1);
                            }
                            catch (e) {
                                setError(String(e));
                            } }, children: en ? 'Start fresh' : '确认清除' })] }), _jsxs("div", { className: css.chatHistory, ref: feed, onScroll: e => { const el = e.currentTarget; stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80; }, children: [!entries.length && _jsx("p", { children: !log ? (en ? 'Loading…' : '正在读取…') : (en ? 'Ask about watched workflows across your projects.' : '可以在这里询问各项目中已监听的流程。') }), _jsx(WorkflowLocale, { t: props.t, children: entries.map(e => _jsx("div", { children: e.view }, e.seq)) }), log?.busy && _jsx("small", { role: "status", children: en ? 'Super Agent is responding…' : 'Super Agent 正在回复…' })] }), error && _jsx("p", { role: "alert", children: error }), !archive && _jsxs("form", { onSubmit: e => { e.preventDefault(); void send(); }, children: [_jsx("textarea", { ref: input, "aria-label": en ? 'Message' : '消息', placeholder: en ? 'Message Super Agent' : '给 Super Agent 发消息', value: draft, maxLength: 4000, onChange: e => setDraft(e.target.value), onKeyDown: e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                                e.preventDefault();
                                void send();
                            } } }), _jsx("button", { disabled: !log || sending || !draft.trim(), children: en ? 'Send' : '发送' })] })] }) });
}
const changed = 'teamflow:watch-settings-changed';
const workspaceChoiceEvent = 'teamflow:super-agent-workspace';
let chosenWorkspace = '';
const attentionEvent = 'teamflow:super-agent-attention';
async function request(workspaceId, action, fields = {}, signal) {
    const response = await fetch('/plugins/dsh-agent-teams/super-agent', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, workspaceId, ...fields }), signal: signal ?? AbortSignal.timeout(12000) });
    const value = await response.json();
    if (!response.ok)
        throw new Error(value.error ?? String(response.status));
    return value;
}
function progressText(change, en) {
    const state = en ? { started: 'Started', completed: 'Completed', cancelled: 'Cancelled', failed: 'Failed' } : { started: '开始执行', completed: '已完成', cancelled: '已取消', failed: '失败' };
    const parent = change.inputs.join(en ? ', ' : '、');
    return (parent ? (en ? 'Completed ' + parent : '已完成 ' + parent) + ' → ' : '') + change.title + ' · ' + state[change.status];
}
function useWorkspace(props, owner) {
    const spaces = props.workspaces.list, sessions = props.sessions.list;
    const workspaces = useSyncExternalStore(fn => spaces.subscribe(fn), () => spaces.getSnapshot()).items;
    const list = useSyncExternalStore(fn => sessions.subscribe(fn), () => sessions.getSnapshot());
    const choice = useSyncExternalStore(listener => {
        window.addEventListener(workspaceChoiceEvent, listener);
        return () => window.removeEventListener(workspaceChoiceEvent, listener);
    }, () => chosenWorkspace);
    function choose(id) { chosenWorkspace = id; window.dispatchEvent(new Event(workspaceChoiceEvent)); }
    const selected = owner ? workspaces.find(w => w.sessionIds.includes(owner)) ?? workspaces.find(w => w.workspaceId === choice)
        : workspaces.find(w => w.workspaceId === choice) ?? selectedWorkflowWorkspace(workspaces, list) ?? (workspaces.length === 1 ? workspaces[0] : undefined);
    return { workspaces, selected, choose, sessionRows: list.byId };
}
const feeds = new Map();
const emptyFeed = { subscribe: () => () => { }, read: () => undefined };
/** The icon, panel and transient visits share one scoped read and one timer. */
function createFeed(workspaceId, action, onActive) {
    const listeners = new Set();
    let data, pending, timer;
    async function refresh() {
        clearTimeout(timer);
        pending?.abort();
        const current = new AbortController();
        pending = current;
        try {
            const value = await request(workspaceId, action, {}, AbortSignal.any([current.signal, AbortSignal.timeout(12000)]));
            if (current.signal.aborted)
                return;
            data = value;
        }
        catch (error) {
            if (current.signal.aborted)
                return;
            data = { rows: data?.rows ?? [], error: String(error) };
        }
        for (const notify of listeners)
            notify();
        if (listeners.size && action !== 'catalog')
            timer = setTimeout(refresh, data.rows.length || action === 'subscriptions' ? 6000 : 60000);
    }
    return { read: () => data, subscribe(fn) {
            listeners.add(fn);
            if (listeners.size === 1) {
                onActive?.(true);
                window.addEventListener(changed, refresh);
                void refresh();
            }
            return () => {
                listeners.delete(fn);
                if (listeners.size)
                    return;
                pending?.abort();
                clearTimeout(timer);
                window.removeEventListener(changed, refresh);
                data = undefined;
                onActive?.(false);
            };
        } };
}
function workspaceFeed(workspaceId, catalog) {
    const key = JSON.stringify([workspaceId, catalog]);
    const existing = feeds.get(key);
    if (existing)
        return existing;
    const feed = createFeed(workspaceId, catalog ? 'catalog' : 'overview', active => {
        if (active)
            feeds.set(key, feed);
        else if (feeds.get(key) === feed)
            feeds.delete(key);
    });
    feeds.set(key, feed);
    return feed;
}
function useRows(workspaceId, catalog) {
    const feed = useMemo(() => workspaceId ? workspaceFeed(workspaceId, catalog) : emptyFeed, [workspaceId, catalog]);
    return useSyncExternalStore(feed.subscribe, feed.read, feed.read);
}
export function SuperAgentIcon(props) {
    const icon = useRef(null);
    const { selected } = useWorkspace(props);
    const status = useRows(selected?.workspaceId, false);
    const [count, setCount] = useState(0);
    useEffect(() => {
        const controller = new AbortController();
        const entry = icon.current?.closest('button,[role="button"],a');
        const open = () => window.dispatchEvent(new Event(openCurrentChat));
        entry?.addEventListener('click', open);
        let timer, version = 0;
        async function refresh() {
            const at = version;
            try {
                const value = await request('', 'unread', {}, controller.signal);
                if (!controller.signal.aborted && at === version)
                    setCount(value.count);
            }
            catch { /* Keep last known count while reconnecting. */ }
            finally {
                if (!controller.signal.aborted)
                    timer = setTimeout(refresh, 2000);
            }
        }
        const seen = (e) => { version++; setCount(e.detail); };
        window.addEventListener(unreadChanged, seen);
        void refresh();
        return () => { controller.abort(); clearTimeout(timer); entry?.removeEventListener('click', open); window.removeEventListener(unreadChanged, seen); };
    }, []);
    useEffect(() => {
        if (selected && status && !status.error)
            window.dispatchEvent(new CustomEvent(attentionEvent, { detail: { workspaceId: selected.workspaceId, rows: status.rows } }));
    }, [selected?.workspaceId, status]);
    return _jsxs("span", { ref: icon, className: css.icon, role: "status", "aria-label": 'Super Agent · ' + count + (props.t('language.code') === 'en' ? ' unread' : ' 条未读'), children: [_jsxs("svg", { width: props.size, height: props.size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.6", "aria-hidden": "true", children: [_jsx("ellipse", { cx: "12", cy: "12", rx: "10", ry: "5", transform: "rotate(-35 12 12)" }), _jsx("circle", { cx: "12", cy: "12", r: "3" }), _jsx("circle", { cx: "18", cy: "5", r: "1.5", fill: "currentColor" })] }), count > 0 && _jsx("b", { children: count > 99 ? '99+' : count })] });
}
export function SuperAgentOverlay(props) {
    const [visit, setVisit] = useState();
    const [notice, setNotice] = useState();
    const seen = useRef(new Map());
    const [chat, setChat] = useState();
    useEffect(() => {
        const open = () => setChat({});
        window.addEventListener('teamflow:global-chat', open);
        return () => window.removeEventListener('teamflow:global-chat', open);
    }, []);
    function openNotice() {
        if (!notice)
            return;
        setChat({ key: JSON.stringify([notice.workspaceId, notice.row.teamId, notice.progress ? 'progress' : notice.item.id]) });
        setNotice(undefined);
    }
    useEffect(() => {
        const open = (event) => { event.preventDefault(); setVisit(event.detail); };
        const onAttention = (event) => {
            const { workspaceId, rows } = event.detail;
            const storage = 'teamflow:attention:' + workspaceId;
            let previous = seen.current.get(workspaceId) ?? new Set();
            try {
                const stored = JSON.parse(localStorage.getItem(storage) ?? 'null');
                if (Array.isArray(stored))
                    previous = new Set(stored.filter(id => typeof id === 'string'));
            }
            catch { /* fall back to this mounted view */ }
            const active = new Set();
            let first;
            for (const row of rows)
                for (const item of row.items) {
                    const id = JSON.stringify([row.teamId, item.id]);
                    active.add(id);
                    if (!previous.has(id)) {
                        if (first)
                            first.count++;
                        else
                            first = { workspaceId, row, item, count: 1 };
                    }
                }
            for (const row of rows)
                for (const change of [...row.progress ?? []].reverse()) {
                    const id = JSON.stringify([row.teamId, change.id]);
                    active.add(id);
                    if (!previous.has(id) && !first)
                        first = { workspaceId, row, item: { kind: 'progress', id: change.id, title: change.title, taskId: change.taskId }, count: 1, progress: change };
                }
            seen.current.set(workspaceId, active);
            try {
                if (active.size)
                    localStorage.setItem(storage, JSON.stringify([...active]));
                else
                    localStorage.removeItem(storage);
            }
            catch { /* optional browser receipt storage */ }
            setNotice(old => first ?? (old?.workspaceId === workspaceId && active.has(JSON.stringify([old.row.teamId, old.item.id])) ? old : undefined));
        };
        window.addEventListener(superAgentEntry, open);
        window.addEventListener(attentionEvent, onAttention);
        return () => { window.removeEventListener(superAgentEntry, open); window.removeEventListener(attentionEvent, onAttention); };
    }, []);
    if (chat)
        return createPortal(_jsx(GlobalConversation, { ...props, anchor: chat.key, close: () => setChat(undefined) }), document.body);
    if (!visit) {
        if (!notice)
            return null;
        const en = props.t('language.code') === 'en';
        return createPortal(_jsxs("aside", { className: css.notice, role: "status", children: [_jsx("b", { children: "Super Agent" }), _jsxs("span", { children: [notice.row.name, " \u203A ", notice.progress ? progressText(notice.progress, en) : notice.item.title, notice.count > 1 ? ' +' + (notice.count - 1) : ''] }), _jsx("button", { onClick: openNotice, children: en ? 'Open conversation card' : '查看对话卡片' }), _jsx("button", { "aria-label": en ? 'Dismiss reminder' : '收起提醒', onClick: () => setNotice(undefined), children: "\u00D7" })] }), document.body);
    }
    const back = () => { setVisit(undefined); visit.returnToWorkflow(); };
    return createPortal(_jsx("div", { className: css.overlay, role: "dialog", "aria-modal": "true", "aria-label": "Super Agent", children: _jsx(SuperAgentPanel, { ...props, visit: visit, back: back }) }), document.body);
}
const subscriptions = createFeed('', 'subscriptions');
function conversationName(row, sessions, en) {
    return row.conversationTitle?.trim() || sessions[row.captainSessionId]?.title?.trim() || (en ? 'Untitled conversation' : '未命名对话');
}
function watchKindLabel(kind, en) {
    return (en ? { review: 'Human review', proposal: 'Pending proposal', block: 'Human intervention', progress: 'Node progress' } :
        { review: '人工验收', proposal: '待确认提案', block: '人工介入', progress: '节点状态变化' })[kind];
}
function WatchedWorkflows({ en, sessions, onEdit }) {
    const view = useSyncExternalStore(subscriptions.subscribe, subscriptions.read, subscriptions.read);
    return _jsxs("section", { className: css.watched, "aria-label": en ? 'Watched workflows' : '正在监听的流程', children: [_jsxs("h2", { children: [en ? 'Watched workflows' : '正在监听的流程', " ", view && !view.error && _jsx("small", { children: view.rows.length })] }), !view ? _jsx("p", { role: "status", children: en ? 'Loading subscriptions…' : '正在读取监听范围…' }) : _jsxs(_Fragment, { children: [view.error && _jsxs("p", { role: "alert", children: [en ? 'Could not refresh subscriptions.' : '监听列表刷新失败。', " ", _jsx("button", { onClick: () => window.dispatchEvent(new Event(changed)), children: en ? 'Retry' : '重试' })] }), !view.error && !view.rows.length && _jsx("p", { children: en ? 'No subscriptions. Choose a project and workflow below to start watching.' : '尚未监听任何流程。可在下方选择项目和流程，开启监听。' }), _jsx("ul", { children: view.rows.map(r => {
                            const chat = conversationName(r, sessions, en);
                            const duplicate = view.rows.some(other => other !== r && other.project === r.project && other.name === r.name && conversationName(other, sessions, en) === chat);
                            return _jsx("li", { children: _jsxs("button", { onClick: () => onEdit(r.workspaceId, r.teamId), children: [_jsxs("span", { children: [_jsxs("small", { children: [r.project, " / ", chat] }), _jsx("strong", { children: r.name }), duplicate && _jsxs("small", { children: [r.workspaceId, " / ", r.teamId] })] }), _jsx("span", { className: css.watchKinds, children: r.watch.kinds.map(k => watchKindLabel(k, en)).join(' · ') || (en ? 'No alerts selected' : '未选择提醒类型') }), _jsx("span", { "aria-hidden": "true", children: "\u203A" })] }) }, JSON.stringify([r.workspaceId, r.teamId]));
                        }) })] })] });
}
export function SuperAgentPanel(props) {
    const [settings, setSettings] = useState(false);
    const [editing, setEditing] = useState(true);
    const [selection, setSelection] = useState({ workspaceId: props.visit?.workspaceId, teamId: props.visit?.teamId ?? '' });
    const editor = useRef(null);
    useEffect(() => {
        const open = () => setSettings(false);
        window.addEventListener(openCurrentChat, open);
        return () => window.removeEventListener(openCurrentChat, open);
    }, []);
    const picker = useWorkspace(props, props.visit?.sessionId);
    const { workspaces, choose } = picker;
    const selected = workspaces.find(w => w.workspaceId === selection.workspaceId) ?? picker.selected;
    const en = props.t('language.code') === 'en';
    return _jsxs(_Fragment, { children: [_jsx("div", { hidden: settings, className: css.chatPage, children: _jsx(GlobalConversation, { ...props, inline: true, visible: !settings, settings: () => { setEditing(true); setSettings(true); }, close: props.back }) }), settings && _jsxs("main", { className: css.panel, children: [_jsxs("header", { className: css.hero, children: [_jsxs("div", { className: css.identity, children: [_jsx("span", { className: css.mark, children: _jsx(BrandIcon, { size: 36 }) }), _jsxs("div", { children: [_jsx("small", { children: "Super Agent" }), _jsx("h1", { children: en ? 'Watch settings' : '监听设置' })] })] }), _jsx("button", { onClick: () => setSettings(false), children: en ? 'Back to chat' : '返回对话' }), props.back && _jsx("button", { onClick: props.back, children: props.visit?.workspaceId ? (en ? 'Close' : '关闭') : (en ? 'Back to Workflow' : '返回原工作台') })] }), _jsxs("div", { className: css.content, children: [_jsx(WatchedWorkflows, { en: en, sessions: picker.sessionRows, onEdit: (workspaceId, teamId) => {
                                    setSelection({ workspaceId, teamId });
                                    setEditing(true);
                                    requestAnimationFrame(() => editor.current?.focus());
                                } }), _jsxs("div", { ref: editor, tabIndex: -1, className: css.projectBar, children: [_jsxs("label", { children: [en ? 'Project' : '项目', " ", _jsxs("select", { "aria-label": en ? 'Workspace' : '工作区', value: selected?.workspaceId ?? '', onChange: e => { choose(e.target.value); setSelection({ workspaceId: e.target.value, teamId: '' }); }, children: [_jsx("option", { value: "", disabled: true, children: en ? 'Choose a workspace' : '选择工作区' }), workspaces.map(w => _jsx("option", { value: w.workspaceId, children: w.title }, w.workspaceId))] })] }), selected && _jsx("button", { onClick: () => setEditing(!editing), children: editing ? (en ? 'Project overview' : '项目概览') : (en ? 'Configure workflow' : '配置流程') })] }), selected ? _jsx(WorkspacePanel, { ...props, workspaceId: selected.workspaceId, project: selected.title, sessionRows: picker.sessionRows, en: en, settings: editing, setSettings: setEditing, selection: selection.teamId, select: teamId => setSelection({ workspaceId: selected.workspaceId, teamId }) }, selected.workspaceId) : _jsx("p", { children: en ? 'Select a project to configure workflows.' : '请选择项目以配置流程。' })] })] })] });
}
function WorkspacePanel({ workspaceId, project, sessionRows, en, settings, setSettings, selection, select, sessions, modelDirectories, t, openMember }) {
    const result = useRows(workspaceId, settings);
    const [busy, setBusy] = useState(false), [error, setError] = useState('');
    const [target, setTarget] = useState();
    const handle = useRef();
    const life = useRef();
    const focus = useRef(null);
    useEffect(() => { const token = new AbortController(); life.current = token; return () => { token.abort(); handle.current?.release(); }; }, []);
    const rows = result?.rows ?? [], row = rows.find(r => r.teamId === selection) ?? rows[0];
    const watching = rows.filter(r => r.watch);
    const items = watching.flatMap(r => r.items.map(item => ({ row: r, item })));
    const label = (zh, english) => en ? english : zh;
    const kindLabel = (kind) => watchKindLabel(kind, en);
    const identity = (r) => {
        const title = conversationName(r, sessionRows, en);
        return [project, title, ...(r.name !== title ? [r.name] : [])].join(' / ');
    };
    const progress = watching.flatMap(r => (r.progress ?? []).map(change => ({ r, change }))).sort((a, b) => b.change.at - a.change.at);
    const itemLabel = (item) => item.reason ? ({
        configuration: label('需要补全配置', 'Configuration needed'), rerun: label('待确认重跑', 'Rerun needs confirmation'),
        rejected: label('验收已退回，待处理', 'Review returned for revision'), 'loop-paused': label('循环暂停，待人工处理', 'Loop paused for intervention'),
    })[item.reason] : kindLabel(item.kind);
    async function run(fn) {
        if (busy || !life.current)
            return;
        const signal = life.current.signal;
        setBusy(true);
        setError('');
        try {
            await fn(signal);
        }
        catch (e) {
            if (!signal.aborted)
                setError(String(e));
        }
        finally {
            if (!signal.aborted)
                setBusy(false);
        }
    }
    function save(watch) {
        if (!row)
            return;
        void run(async (signal) => {
            try {
                await request(workspaceId, 'set', { teamId: row.teamId, previous: row.watch ?? null, watch }, signal);
            }
            finally {
                window.dispatchEvent(new Event(changed));
            }
        });
    }
    function locate(r, item) {
        focus.current = document.activeElement;
        void run(async (signal) => {
            handle.current?.release();
            const ref = sessions.retain(r.captainSessionId, { source: 'teamflowLauncher', signal });
            handle.current = ref;
            try {
                await ref.ready;
                signal.throwIfAborted();
                setTarget({ row: r, item });
            }
            catch (e) {
                ref.release();
                handle.current = undefined;
                throw e;
            }
        });
    }
    function close() { setTarget(undefined); handle.current?.release(); handle.current = undefined; window.dispatchEvent(new Event(changed)); requestAnimationFrame(() => focus.current?.focus()); }
    return _jsxs("section", { "aria-busy": busy, children: [(error || result?.error) && _jsxs("p", { role: "alert", children: [error || result?.error, " ", _jsx("button", { onClick: () => window.dispatchEvent(new Event(changed)), children: label('刷新', 'Refresh') })] }), !result ? _jsx("p", { role: "status", children: label('正在读取…', 'Loading…') }) : settings ? _jsxs("div", { className: css.settings, children: [_jsx("h2", { children: label('配置流程', 'Configure workflow') }), row ? _jsxs(_Fragment, { children: [_jsxs("label", { children: [label('选择流程', 'Workflow'), " ", _jsx("select", { value: row.teamId, disabled: busy, onChange: e => select(e.target.value), children: rows.map(r => _jsxs("option", { value: r.teamId, children: [identity(r), rows.some(other => other.teamId !== r.teamId && identity(other) === identity(r)) ? ' · ' + r.teamId : ''] }, r.teamId)) })] }), _jsxs("div", { className: css.row, children: [_jsxs("span", { children: [row.watch ? label('正在监听', 'Watching') : label('未监听', 'Not watched'), row.complete ? ' · ' + label('已完成', 'Completed') : ''] }), _jsx("button", { disabled: busy, onClick: () => save(row.watch ? null : { kinds: [...defaultWatchKinds], keep: row.complete }), children: row.watch ? label('取消监听', 'Unsubscribe') : row.complete ? label('监听后续重开', 'Watch future reopens') : label('监听此流程', 'Watch workflow') })] }), _jsxs("fieldset", { disabled: busy || !row.watch, children: [_jsx("legend", { children: label('需要提醒我的事项', 'Notify me about') }), watchKinds.map(kind => _jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: row.watch?.kinds.includes(kind) ?? false, onChange: e => row.watch && save({ ...row.watch, kinds: e.target.checked ? [...row.watch.kinds, kind] : row.watch.kinds.filter(k => k !== kind) }) }), kindLabel(kind)] }, kind))] }), _jsxs("label", { children: [_jsx("input", { type: "checkbox", disabled: busy || !row.watch, checked: row.watch?.keep ?? false, onChange: e => row.watch && save(row.complete && !e.target.checked ? null : { ...row.watch, keep: e.target.checked }) }), label('整个流程完成后继续监听', 'Keep watching after workflow completion')] })] }) : _jsx("p", { children: label('此工作区没有可选流程。', 'No workflows in this workspace.') })] }) : _jsxs("div", { className: css.columns, children: [_jsxs("section", { className: css.queue, children: [_jsxs("h2", { children: [label('待你处理', 'Needs you'), " ", _jsx("small", { children: items.length })] }), items.map(({ row: r, item }) => _jsxs("div", { className: css.row, children: [_jsxs("div", { children: [_jsx("small", { children: identity(r) }), _jsx("b", { children: item.title }), _jsxs("small", { className: css.status, children: [itemLabel(item), item.round !== undefined ? ' · ' + label('第 ' + item.round + ' 轮', 'Round ' + item.round) : ''] })] }), _jsxs("button", { disabled: busy, onClick: () => locate(r, item), children: [item.kind === 'review' ? label('查看本轮证据', 'Review evidence') : item.kind === 'proposal' ? label('查看提案', 'View proposal') : label('定位节点', 'Locate node'), " \u2197"] })] }, r.teamId + ':' + item.id)), !items.length && _jsx("p", { children: watching.length ? label('已监听流程暂无待处理事项。', 'No pending items in watched workflows.') : label('尚未监听任何流程。打开监听设置，选择需要关注的流程。', 'No workflows watched. Choose workflows in Watch settings.') }), watching.some(r => r.watch?.kinds.includes('progress')) && _jsxs(_Fragment, { children: [_jsx("h2", { children: label('节点动态', 'Node activity') }), !progress.length && _jsx("p", { children: label('开启后发生的节点变化会显示在这里。', 'Node changes will appear here after subscribing.') }), progress.slice(0, 40).map(({ r, change }) => _jsxs("div", { className: css.row, children: [_jsxs("div", { children: [_jsxs("small", { children: [identity(r), " \u00B7 ", new Date(change.at).toLocaleTimeString()] }), progressText(change, en)] }), _jsxs("button", { disabled: busy, onClick: () => locate(r, { kind: 'progress', title: change.title, taskId: change.taskId, id: change.id }), children: [label('定位节点', 'Locate node'), " \u2197"] })] }, change.id))] })] }), _jsxs("aside", { className: css.scope, children: [_jsxs("h2", { children: [label('监听范围', 'Watched workflows'), " ", _jsx("small", { children: watching.length })] }), !watching.length && _jsx("p", { children: label('尚未订阅流程', 'No subscriptions') }), watching.map(r => _jsxs("button", { onClick: () => { select(r.teamId); setSettings(true); }, children: [_jsx("span", { children: identity(r) }), _jsx("small", { children: r.watch?.kinds.map(kindLabel).join(' · ') })] }, r.teamId))] })] }), target && _jsx(WorkflowWorkbench, { initiallyOpen: true, sessionId: target.row.captainSessionId, teamId: target.row.teamId, supervisorTarget: target.item, onClose: close, t: t, modelDirectory: modelDirectories.directoryFor(target.row.captainSessionId), openExecution: (id, parent) => openMember((parent ?? target.row.captainSessionId), id) })] });
}
