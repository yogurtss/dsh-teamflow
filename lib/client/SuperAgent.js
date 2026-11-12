import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { BrandIcon } from "./BrandIcon.js";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { selectedWorkflowWorkspace } from "./workflow-launcher.js";
import { WorkflowWorkbench } from "./WorkflowWorkbench.js";
import { superAgentEntry } from "./super-agent-navigation.js";
import { defaultWatchKinds, watchKinds } from "../super-agent-watch.js";
import css from './SuperAgent.module.css';
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
function workspaceFeed(workspaceId, catalog) {
    const key = JSON.stringify([workspaceId, catalog]);
    const existing = feeds.get(key);
    if (existing)
        return existing;
    const listeners = new Set();
    let data, pending, timer;
    async function refresh() {
        clearTimeout(timer);
        pending?.abort();
        const current = new AbortController();
        pending = current;
        try {
            const value = await request(workspaceId, catalog ? 'catalog' : 'overview', {}, AbortSignal.any([current.signal, AbortSignal.timeout(12000)]));
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
        if (listeners.size && !catalog)
            timer = setTimeout(refresh, data.rows.length ? 6000 : 60000);
    }
    const feed = { read: () => data, subscribe(fn) {
            listeners.add(fn);
            if (listeners.size === 1) {
                feeds.set(key, feed);
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
                if (feeds.get(key) === feed)
                    feeds.delete(key);
            };
        } };
    feeds.set(key, feed);
    return feed;
}
function useRows(workspaceId, catalog) {
    const feed = useMemo(() => workspaceId ? workspaceFeed(workspaceId, catalog) : emptyFeed, [workspaceId, catalog]);
    return useSyncExternalStore(feed.subscribe, feed.read, feed.read);
}
export function SuperAgentIcon(props) {
    const { selected } = useWorkspace(props);
    const status = useRows(selected?.workspaceId, false);
    const count = status?.rows.reduce((n, row) => n + row.items.length, 0) ?? 0;
    useEffect(() => {
        if (selected && status && !status.error)
            window.dispatchEvent(new CustomEvent(attentionEvent, { detail: { workspaceId: selected.workspaceId, rows: status.rows } }));
    }, [selected?.workspaceId, status]);
    return _jsxs("span", { className: css.icon, role: "status", "aria-label": `Super Agent · ${count}`, children: [_jsxs("svg", { width: props.size, height: props.size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.6", "aria-hidden": "true", children: [_jsx("ellipse", { cx: "12", cy: "12", rx: "10", ry: "5", transform: "rotate(-35 12 12)" }), _jsx("circle", { cx: "12", cy: "12", r: "3" }), _jsx("circle", { cx: "18", cy: "5", r: "1.5", fill: "currentColor" })] }), count > 0 && _jsx("b", { children: count })] });
}
export function SuperAgentOverlay(props) {
    const [visit, setVisit] = useState();
    const [notice, setNotice] = useState();
    const seen = useRef(new Map());
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
    if (!visit) {
        if (!notice)
            return null;
        const en = props.t('language.code') === 'en';
        return createPortal(_jsxs("aside", { className: css.notice, role: "status", children: [_jsx("b", { children: "Super Agent" }), _jsxs("span", { children: [notice.row.name, " \u203A ", notice.progress ? progressText(notice.progress, en) : notice.item.title, notice.count > 1 ? ' +' + (notice.count - 1) : ''] }), _jsx("button", { onClick: () => { setVisit({ workspaceId: notice.workspaceId, teamId: notice.row.teamId, sessionId: notice.row.captainSessionId, returnToWorkflow: () => { } }); setNotice(undefined); }, children: notice.progress ? (en ? 'View progress' : '查看进度') : (en ? 'View pending' : '查看待办') }), _jsx("button", { "aria-label": en ? 'Dismiss reminder' : '收起提醒', onClick: () => setNotice(undefined), children: "\u00D7" })] }), document.body);
    }
    const back = () => { setVisit(undefined); visit.returnToWorkflow(); };
    return createPortal(_jsx("div", { className: css.overlay, role: "dialog", "aria-modal": "true", "aria-label": "Super Agent", children: _jsx(SuperAgentPanel, { ...props, visit: visit, back: back }) }), document.body);
}
export function SuperAgentPanel(props) {
    const picker = useWorkspace(props, props.visit?.sessionId);
    const { workspaces, choose } = picker;
    const selected = props.visit?.workspaceId ? workspaces.find(w => w.workspaceId === props.visit.workspaceId) : picker.selected;
    const en = props.t('language.code') === 'en';
    return _jsxs("main", { className: css.panel, children: [_jsxs("header", { className: css.hero, children: [_jsxs("div", { className: css.identity, children: [_jsx("span", { className: css.mark, children: _jsx(BrandIcon, { size: 36 }) }), _jsxs("div", { children: [_jsx("small", { children: en ? 'Workspace coordinator' : '工作区协调' }), _jsx("h1", { children: "Super Agent" })] })] }), props.visit && selected ? _jsx("span", { children: selected.title }) : _jsxs("select", { "aria-label": en ? 'Workspace' : '工作区', value: selected?.workspaceId ?? '', onChange: e => choose(e.target.value), children: [_jsx("option", { value: "", disabled: true, children: en ? 'Choose a workspace' : '选择工作区' }), workspaces.map(w => _jsx("option", { value: w.workspaceId, children: w.title }, w.workspaceId))] }), props.back && _jsx("button", { onClick: props.back, children: props.visit?.workspaceId ? (en ? 'Close' : '关闭') : (en ? 'Back to Workflow' : '返回原工作台') })] }), selected ? _jsx(WorkspacePanel, { ...props, workspaceId: selected.workspaceId, project: selected.title, sessionRows: picker.sessionRows, en: en }, selected.workspaceId) : _jsx("p", { children: en ? 'Select a workspace to view subscriptions.' : '请选择工作区查看监听设置。' })] });
}
function WorkspacePanel({ workspaceId, project, sessionRows, en, visit, back, sessions, modelDirectories, t, openMember }) {
    const [settings, setSettings] = useState(false), [selection, select] = useState(visit?.teamId ?? '');
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
    const kindLabel = (kind) => ({ review: label('人工验收', 'Human review'), proposal: label('待确认提案', 'Pending proposal'), block: label('人工介入', 'Human intervention'), progress: label('节点状态变化', 'Node progress') })[kind];
    const identity = (r) => {
        const title = r.conversationTitle?.trim() || sessionRows[r.captainSessionId]?.title?.trim() || label('未命名对话', 'Untitled conversation');
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
    function chat() {
        void run(async (signal) => {
            const { sessionId } = await request(workspaceId, 'chat', {}, signal);
            await sessions.refresh();
            signal.throwIfAborted();
            await openMember(sessionId, sessionId);
            back?.();
        });
    }
    return _jsxs("section", { className: css.content, "aria-busy": busy, children: [_jsxs("div", { className: css.actions, children: [_jsx("button", { onClick: () => { setSettings(!settings); setError(''); }, children: settings ? label('← 返回概览', '← Overview') : label('监听设置', 'Watch settings') }), _jsxs("button", { disabled: busy, onClick: chat, children: [label('打开主对话', 'Open conversation'), " \u2197"] })] }), (error || result?.error) && _jsxs("p", { role: "alert", children: [error || result?.error, " ", _jsx("button", { onClick: () => window.dispatchEvent(new Event(changed)), children: label('刷新', 'Refresh') })] }), !result ? _jsx("p", { role: "status", children: label('正在读取…', 'Loading…') }) : settings ? _jsxs("div", { className: css.settings, children: [_jsx("h2", { children: label('监听设置', 'Watch settings') }), row ? _jsxs(_Fragment, { children: [_jsxs("label", { children: [label('选择流程', 'Workflow'), " ", _jsx("select", { value: row.teamId, disabled: busy, onChange: e => select(e.target.value), children: rows.map(r => _jsxs("option", { value: r.teamId, children: [identity(r), rows.some(other => other.teamId !== r.teamId && identity(other) === identity(r)) ? ' · ' + r.teamId : ''] }, r.teamId)) })] }), _jsxs("div", { className: css.row, children: [_jsxs("span", { children: [row.watch ? label('正在监听', 'Watching') : label('未监听', 'Not watched'), row.complete ? ' · ' + label('已完成', 'Completed') : ''] }), _jsx("button", { disabled: busy, onClick: () => save(row.watch ? null : { kinds: [...defaultWatchKinds], keep: row.complete }), children: row.watch ? label('取消监听', 'Unsubscribe') : row.complete ? label('监听后续重开', 'Watch future reopens') : label('监听此流程', 'Watch workflow') })] }), _jsxs("fieldset", { disabled: busy || !row.watch, children: [_jsx("legend", { children: label('需要提醒我的事项', 'Notify me about') }), watchKinds.map(kind => _jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: row.watch?.kinds.includes(kind) ?? false, onChange: e => row.watch && save({ ...row.watch, kinds: e.target.checked ? [...row.watch.kinds, kind] : row.watch.kinds.filter(k => k !== kind) }) }), kindLabel(kind)] }, kind))] }), _jsxs("label", { children: [_jsx("input", { type: "checkbox", disabled: busy || !row.watch, checked: row.watch?.keep ?? false, onChange: e => row.watch && save(row.complete && !e.target.checked ? null : { ...row.watch, keep: e.target.checked }) }), label('整个流程完成后继续监听', 'Keep watching after workflow completion')] })] }) : _jsx("p", { children: label('此工作区没有可选流程。', 'No workflows in this workspace.') })] }) : _jsxs("div", { className: css.columns, children: [_jsxs("section", { className: css.queue, children: [_jsxs("h2", { children: [label('待你处理', 'Needs you'), " ", _jsx("small", { children: items.length })] }), items.map(({ row: r, item }) => _jsxs("div", { className: css.row, children: [_jsxs("div", { children: [_jsx("small", { children: identity(r) }), _jsx("b", { children: item.title }), _jsxs("small", { className: css.status, children: [itemLabel(item), item.round !== undefined ? ' · ' + label('第 ' + item.round + ' 轮', 'Round ' + item.round) : ''] })] }), _jsxs("button", { disabled: busy, onClick: () => locate(r, item), children: [item.kind === 'review' ? label('查看本轮证据', 'Review evidence') : item.kind === 'proposal' ? label('查看提案', 'View proposal') : label('定位节点', 'Locate node'), " \u2197"] })] }, r.teamId + ':' + item.id)), !items.length && _jsx("p", { children: watching.length ? label('已监听流程暂无待处理事项。', 'No pending items in watched workflows.') : label('尚未监听任何流程。打开监听设置，选择需要关注的流程。', 'No workflows watched. Choose workflows in Watch settings.') }), watching.some(r => r.watch?.kinds.includes('progress')) && _jsxs(_Fragment, { children: [_jsx("h2", { children: label('节点动态', 'Node activity') }), !progress.length && _jsx("p", { children: label('开启后发生的节点变化会显示在这里。', 'Node changes will appear here after subscribing.') }), progress.slice(0, 40).map(({ r, change }) => _jsxs("div", { className: css.row, children: [_jsxs("div", { children: [_jsxs("small", { children: [identity(r), " \u00B7 ", new Date(change.at).toLocaleTimeString()] }), progressText(change, en)] }), _jsxs("button", { disabled: busy, onClick: () => locate(r, { kind: 'progress', title: change.title, taskId: change.taskId, id: change.id }), children: [label('定位节点', 'Locate node'), " \u2197"] })] }, change.id))] })] }), _jsxs("aside", { className: css.scope, children: [_jsxs("h2", { children: [label('监听范围', 'Watched workflows'), " ", _jsx("small", { children: watching.length })] }), !watching.length && _jsx("p", { children: label('尚未订阅流程', 'No subscriptions') }), watching.map(r => _jsxs("button", { onClick: () => { select(r.teamId); setSettings(true); }, children: [_jsx("span", { children: identity(r) }), _jsx("small", { children: r.watch?.kinds.map(kindLabel).join(' · ') })] }, r.teamId))] })] }), target && _jsx(WorkflowWorkbench, { initiallyOpen: true, sessionId: target.row.captainSessionId, teamId: target.row.teamId, supervisorTarget: target.item, onClose: close, t: t, modelDirectory: modelDirectories.directoryFor(target.row.captainSessionId), openExecution: (id, parent) => openMember((parent ?? target.row.captainSessionId), id) })] });
}
