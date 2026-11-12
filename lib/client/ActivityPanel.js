import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { isGateTask } from "../workflow-node-kind.js";
import { workflowRequest } from "./workflow-request.js";
import { activityStatus } from "./activity-status.js";
import { resolveActivitySession } from "./activity-session.js";
import { WorkflowLocale } from "./workflow-i18n.js";
import { WorkflowWorkbench } from "./WorkflowWorkbench.js";
import { flowControlState, flowControlVersion, taskControlState } from "./task-control.js";
import { TaskStateBadge, taskStateNodeClass } from "./TaskStateBadge.js";
import { QuickMemberEditor } from "./QuickMemberEditor.js";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, } from 'react';
import { IconBranchOutline16, IconStopFill16, IconWarningOutline16, WorkflowIcon, } from "./icons.js";
import { Modal } from '@deepseek-ai/dsh-client-ui-primitives';
import { currentSessionId, openWorkflowConversation } from "./session-navigation.js";
import { compactDagLayout, COMPACT_DAG_NODE_WIDTH, COMPACT_DAG_NODE_HEIGHT, compactModelLabel, dependencyFocusTaskId, memberRouteLabel, orderDelegationMembers, relatedTaskIds, taskModelLabel, teamIsActive, usesParallelTaskGrid, } from "./activity-model.js";
import { ACTIVITY_HALT_URL, getActivityMonitorTargetsSnapshot, getActivitySnapshotsSnapshot, startActivityPolling, subscribeActivityMonitorTargets, subscribeActivitySnapshots, publishWorkflowActivity, } from "./activity-monitor.js";
import { ACTION_ART, LEAD_ART, memberArtUrl } from "./artwork.js";
import { StagingPlanEditor } from "./StagingPlanEditor.js";
import css from './ActivityPanel.module.css';
const CAPTAIN_ASSIGNEE = 'captain';
function formatTaskIds(ids, t) {
    return ids.join(t('format.listSeparator'));
}
function taskTitle(task, model) {
    const extras = [
        task.kind,
        task.round === undefined ? undefined : `r${task.round}`,
        task.verdict,
        // Never show a bare pass: the audited verdict may no longer describe the
        // bytes currently on disk (issue #161).
        task.verdictStale === undefined ? undefined : `⚠ ${task.verdictStale}`,
        model === '' ? undefined : model,
    ].filter((item) => item !== undefined);
    return extras.length === 0 ? `${task.id} · ${task.subject}` : `${task.id} · ${task.subject} · ${extras.join(' · ')}`;
}
/** Badge/bar coloring key: visual state, widened for terminal statuses. */
function taskTone(state, status) {
    if (status === 'failed')
        return 'failed';
    if (status === 'cancelled')
        return 'cancelled';
    return state;
}
function Chevron({ open }) {
    return (_jsx("svg", { className: css.chevron, "data-open": open, width: "9", height: "9", viewBox: "0 0 10 10", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", "aria-hidden": true, children: _jsx("path", { d: "M3.5 2l3 3-3 3" }) }));
}
function WorkGlyph({ active }) {
    return (_jsx("svg", { className: css.workGlyph, "data-active": active, width: "11", height: "11", viewBox: "0 0 11 11", fill: "currentColor", "aria-hidden": true, children: [[0, 0], [4.2, 0], [8.4, 0], [0, 4.2], [4.2, 4.2], [8.4, 4.2]].map(([x, y], index) => (_jsx("rect", { x: x, y: y, width: "2.6", height: "2.6", rx: ".6", style: { animationDelay: `${index * 0.15}s` } }, `${x}:${y}`))) }));
}
/** Workflow status card remains visible in the corner while any team exists. */
function CollapsedBadge({ count, onClick, t, team, archived }) {
    const status = activityStatus(team, archived);
    const label = t(('activity.state.' + status.state));
    const detail = t('activity.summary', { done: status.completed, total: status.total, running: status.running, review: status.reviews, attention: status.attention });
    const title = [team.name, label, status.total ? status.percent + '%' : undefined, detail, t('activity.badgeAria', { count })].filter(Boolean).join(' · ');
    return _jsxs("button", { type: "button", className: css.badge, "data-agent-teams-collapsed": true, "data-status": status.state, onClick: onClick, "aria-label": title, title: title, children: [_jsxs("span", { className: css.statusRing, "aria-hidden": true, children: [_jsxs("svg", { viewBox: "0 0 20 20", width: "20", height: "20", children: [_jsx("circle", { cx: "10", cy: "10", r: "7.5", className: css.ringTrack }), _jsx("circle", { cx: "10", cy: "10", r: "7.5", className: css.ringValue, pathLength: "100", strokeDasharray: status.percent + ' 100' })] }), status.state === 'completed' ? _jsx("i", { children: "\u2713" }) : status.state === 'paused' ? _jsx("i", { children: "\u2161" }) : status.attention > 0 ? _jsx("i", { children: "\u00B7" }) : null] }), _jsxs("span", { className: css.statusBody, children: [_jsxs("span", { className: css.statusHeading, children: [_jsx("span", { children: "Workflow" }), _jsx("span", { "aria-hidden": true, children: "\u2197" })] }), team.name && _jsx("strong", { className: css.statusTeam, children: team.name }), _jsxs("span", { className: css.statusLine, children: [_jsx("span", { className: css.statusLabel, children: label }), status.total > 0 && _jsxs("span", { className: css.statusPercent, children: [status.percent, _jsx("small", { children: "%" })] }), status.attention > 0 && _jsx("span", { className: css.statusCount, "aria-hidden": true, children: status.attention > 99 ? '99+' : status.attention })] }), status.total > 0 && _jsx("span", { className: css.statusDetail, children: detail })] })] });
}
function memberStateLabel(member, tasks, historic, t) {
    const owned = tasks.filter((task) => task.assignee === member.name);
    if (member.activity === 'working')
        return t('member.state.working');
    if (owned.some((task) => task.status === 'failed'))
        return t('member.state.failed');
    if (owned.some((task) => task.state === 'blocked'))
        return t('member.state.waiting');
    if (owned.length > 0 && owned.every((task) => task.status === 'completed'))
        return t('member.state.delivered');
    if (member.status === 'removed')
        return t(historic ? 'member.state.left' : 'member.state.removed');
    if (owned.length > 0)
        return t('member.state.pending');
    return t('member.state.unassigned');
}
function memberStatusText(member, tasks, t) {
    const owned = tasks.filter((task) => task.assignee === member.name);
    const current = owned.find((task) => task.id === member.currentTask);
    const blocked = owned.find((task) => task.state === 'blocked');
    if (member.activity === 'working' && current !== undefined) {
        const model = taskModelLabel(current, [member]);
        return model === ''
            ? t('member.status.executing', { taskId: current.id })
            : t('member.status.executingModel', { taskId: current.id, model });
    }
    if (member.activity === 'working')
        return t('member.status.working');
    if (blocked !== undefined) {
        const dependency = tasks.find((task) => blocked.dependencies.includes(task.id) && task.state !== 'completed');
        if (dependency !== undefined) {
            return t('member.status.waitingOn', {
                taskId: dependency.id,
                assignee: dependency.assignee || t('task.assignee.unclaimed'),
            });
        }
        return t('member.status.waitingPrerequisite');
    }
    if (member.total === 0)
        return t('member.status.waitingAssignment');
    if (member.done === member.total)
        return t('member.status.delivered');
    if (owned.some((task) => task.status === 'failed'))
        return t('task.detail.failed');
    if (owned.length > 0 && owned.every((task) => task.status === 'completed' || task.status === 'cancelled'))
        return t('member.status.settled');
    return t(member.activity === 'idle' ? 'member.status.idle' : 'member.status.unknown');
}
function taskSummary(team, t, discarded = false) {
    team = { ...team, tasks: team.tasks.filter(task => !task.superseded) };
    const completed = team.tasks.filter((task) => task.status === 'completed');
    const cancelled = team.tasks.filter((task) => task.status === 'cancelled');
    const running = team.tasks.filter((task) => task.state === 'running');
    const claimed = team.tasks.filter((task) => task.state === 'claimed');
    const blocked = team.tasks.filter(task => taskControlState(team, task).checked && taskControlState(team, task).waiting.length > 0);
    const ready = team.tasks.filter(task => taskControlState(team, task).label === 'task.control.queued');
    const reviews = team.tasks.filter(task => taskControlState(team, task).reviewReady);
    const failed = team.tasks.filter((task) => task.status === 'failed');
    if (discarded)
        return t('task.summary.discarded', { count: team.tasks.length });
    if (team.tasks.length === 0)
        return t('task.summary.waitingBreakdown');
    if (team.phase === 'staged')
        return t('task.summary.staged', { count: team.tasks.length });
    if (completed.length === team.tasks.length)
        return t('task.summary.allDelivered', { count: completed.length });
    if (completed.length + cancelled.length + failed.length === team.tasks.length) {
        return t('task.summary.ended', {
            completed: completed.length,
            cancelled: cancelled.length,
            failed: failed.length,
        });
    }
    if (failed.length > 0 && running.length === 0 && claimed.length === 0 && ready.length === 0 && reviews.length === 0 && blocked.length === 0) {
        return t('task.summary.failedSettled', { count: failed.length });
    }
    if (blocked.length > 0 && running.length > 0) {
        return t('task.summary.blockedAndRunning', {
            tasks: formatTaskIds(blocked.slice(0, 3).map((task) => task.id), t),
            more: blocked.length > 3 ? t('task.summary.more', { count: blocked.length - 3 }) : '',
        });
    }
    if (running.length > 0)
        return t('task.summary.running', { tasks: formatTaskIds(running.map((task) => task.id), t) });
    if (claimed.length > 0)
        return t('task.summary.claimed', { tasks: formatTaskIds(claimed.map((task) => task.id), t) });
    if (reviews.length > 0)
        return t('task.summary.review', { tasks: formatTaskIds(reviews.map(task => task.id), t) });
    if (ready.length > 0)
        return t('task.summary.ready', { tasks: formatTaskIds(ready.map((task) => task.id), t) });
    if (blocked.length > 0)
        return t('task.summary.blocked', { tasks: formatTaskIds(blocked.map((task) => task.id), t) });
    if (team.tasks.some(task => !taskControlState(team, task).terminal && !taskControlState(team, task).checked))
        return t('flow.summary.held');
    return t('task.summary.waitingSchedule');
}
function ProgressOverview({ team, t, discarded = false }) {
    team = { ...team, tasks: team.tasks.filter(task => !task.superseded) };
    const running = discarded ? 0 : team.tasks.filter((task) => task.state === 'running').length;
    const claimed = discarded ? 0 : team.tasks.filter((task) => task.state === 'claimed').length;
    const blocked = discarded ? 0 : team.tasks.filter(task => taskControlState(team, task).checked && taskControlState(team, task).waiting.length > 0).length;
    const held = discarded ? 0 : team.tasks.filter(task => !taskControlState(team, task).terminal && !taskControlState(team, task).checked).length;
    const completed = discarded ? 0 : team.tasks.filter((task) => task.status === 'completed').length;
    const done = activityStatus(team).state === 'completed';
    const summaryTone = discarded ? 'discarded' : done ? 'completed' : blocked > 0 || team.tasks.some(task => task.status === 'failed' || task.status === 'cancelled') ? 'warning' : 'running';
    return (_jsxs("section", { className: css.progressOverview, "aria-label": t('progress.aria'), "data-progress-summary": true, children: [_jsx("span", { className: css.progressTitle, children: t('progress.title') }), team.tasks.length > 0 ? (_jsx("span", { className: css.progressSegments, "aria-hidden": true, children: team.tasks.map((task) => _jsx("span", { "data-state": discarded ? 'cancelled' : taskTone(task.state, task.status) }, task.id)) })) : _jsx("span", { className: css.progressEmpty }), _jsxs("span", { className: css.progressLegend, children: [_jsx("span", { "data-state": "running", children: t('progress.running', { count: running }) }), claimed > 0 && _jsx("span", { "data-state": "claimed", children: t('progress.claimed', { count: claimed }) }), _jsx("span", { "data-state": "blocked", children: t('progress.blocked', { count: blocked }) }), held > 0 && _jsx("span", { "data-state": "blocked", children: t('progress.held', { count: held }) }), _jsx("span", { "data-state": "completed", children: t('progress.delivered', { count: completed }) })] }), _jsxs("span", { className: css.progressSummary, "data-state": summaryTone, children: [_jsx("span", { className: css.progressSummaryDot }), _jsx("span", { children: summaryTone === 'completed' ? t('activity.state.completed') : taskSummary(team, t, discarded) })] })] }));
}
/** Workspace-only summary of durable completion and the current unread inbox.
 * The snapshot is not a chat transcript: it provides at most five unread
 * captain messages, with no timestamps, so do not imply a complete history.
 */
function WorkspaceSummary({ team, t, discarded }) {
    const completed = discarded ? 0 : activityStatus(team).completed;
    const total = activityStatus(team).total;
    return (_jsxs("div", { className: css.workspaceSummary, children: [_jsxs("section", { className: css.completionCard, "aria-label": t('progress.aria'), children: [_jsx("h3", { children: t('progress.title') }), _jsxs("div", { className: css.completionBody, children: [_jsxs("div", { className: css.completionRing, role: "img", "aria-label": t('team.stats.completed', { completed, total }), "data-completed": completed, "data-total": total, children: [_jsxs("svg", { viewBox: "0 0 120 120", "aria-hidden": true, children: [_jsx("circle", { className: css.ringTrack, cx: "60", cy: "60", r: "51" }), _jsx("circle", { className: css.ringValue, cx: "60", cy: "60", r: "51", pathLength: "100", strokeDasharray: `${total === 0 ? 0 : completed / total * 100} 100` })] }), _jsxs("span", { "aria-hidden": true, children: [_jsxs("strong", { children: [completed, _jsxs("small", { children: [" / ", total] })] }), _jsx("span", { children: t(discarded ? 'task.status.notRun' : 'workspace.completed') })] })] }), total === 0 ? _jsx("p", { className: css.summaryEmpty, children: t('workspace.noTasks') }) : _jsx("ul", { className: css.completionTasks, tabIndex: 0, "aria-label": t('workspace.taskSummary'), children: team.tasks.map(task => _jsxs("li", { "data-state": discarded ? 'cancelled' : taskTone(task.state, task.status), "data-verdict-stale": task.verdictStale === undefined ? undefined : 'true', title: taskTitle(task, taskModelLabel(task, team.members)), children: [_jsx("span", { className: css.completionDot, "aria-hidden": true, children: task.verdictStale !== undefined ? '!' : !discarded && task.status === 'completed' ? '✓' : '·' }), _jsx("span", { className: css.completionTaskId, children: task.id }), _jsx("span", { className: css.completionTaskSubject, title: task.subject, children: task.subject }), _jsx("span", { className: css.completionTaskStatus, children: discarded ? t('task.status.notRun') : task.verdictStale !== undefined ? t('workspace.verdictStale') : t(taskControlState(team, task).label) })] }, task.id)) })] })] }), _jsxs("section", { className: css.inboxCard, "aria-label": t('workspace.inbox'), children: [_jsxs("header", { children: [_jsx("h3", { children: t('workspace.inbox') }), _jsx("span", { children: t('workspace.inboxHint') })] }), team.captainInbox.length === 0 ? _jsx("p", { className: css.summaryEmpty, children: t('workspace.inboxEmpty') }) : _jsx("ul", { className: css.inboxMessages, tabIndex: 0, "aria-label": t('workspace.inbox'), children: team.captainInbox.map((message, index) => {
                            const member = team.members.find(candidate => candidate.name === message.from);
                            const art = message.from === CAPTAIN_ASSIGNEE ? LEAD_ART : memberArtUrl(message.from, member?.role ?? '');
                            return _jsxs("li", { children: [_jsx("img", { src: art, alt: "", "aria-hidden": true }), _jsxs("div", { children: [_jsx("strong", { children: message.from }), _jsx("p", { children: message.content })] })] }, `${index}:${message.from}`);
                        }) })] })] }));
}
function DependencyMap({ tasks, members, t, discarded = false, onSelectTask, team, historic = false, onToggle, onOpenTask, controlBusy }) {
    const [open, setOpen] = useState(true);
    const [hoverTaskId, setHoverTaskId] = useState(null);
    const [keyboardTaskId, setKeyboardTaskId] = useState(null);
    const [pinnedTaskId, setPinnedTaskId] = useState(null);
    const hoverTimer = useRef(null);
    const focusedTaskId = dependencyFocusTaskId(pinnedTaskId, keyboardTaskId, hoverTaskId);
    const nodeWidth = COMPACT_DAG_NODE_WIDTH;
    const nodeHeight = COMPACT_DAG_NODE_HEIGHT;
    const layout = useMemo(() => compactDagLayout(tasks), [tasks]);
    const parallel = useMemo(() => usesParallelTaskGrid(tasks), [tasks]);
    const related = useMemo(() => focusedTaskId === null ? null : relatedTaskIds(focusedTaskId, tasks), [focusedTaskId, tasks]);
    const scheduleHover = (id) => {
        if (hoverTimer.current !== null) {
            clearTimeout(hoverTimer.current);
            hoverTimer.current = null;
        }
        if (id === null) {
            setHoverTaskId(null);
            return;
        }
        hoverTimer.current = setTimeout(() => {
            hoverTimer.current = null;
            setHoverTaskId(id);
        }, 180);
    };
    useEffect(() => () => {
        if (hoverTimer.current !== null)
            clearTimeout(hoverTimer.current);
    }, []);
    useEffect(() => {
        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                setPinnedTaskId(null);
                onSelectTask?.(null);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => { window.removeEventListener('keydown', onKeyDown); };
    }, [onSelectTask]);
    if (tasks.length === 0)
        return null;
    const fallbackTask = tasks.find((task) => task.state === 'blocked')
        ?? tasks.find((task) => task.state === 'running')
        ?? tasks.find((task) => task.state === 'claimed')
        ?? tasks[0];
    const detailTask = tasks.find((task) => task.id === focusedTaskId) ?? fallbackTask;
    const control = taskControlState(team, detailTask, historic);
    const detailModel = taskModelLabel(detailTask, members);
    const waitingOn = detailTask.dependencies.filter((dependency) => (tasks.find((task) => task.id === dependency)?.status !== 'completed'));
    const dependents = tasks.filter((task) => task.dependencies.includes(detailTask.id));
    return (_jsxs("section", { className: css.dependencySection, "aria-label": t('dependency.aria'), "data-dependency-map": true, children: [_jsxs("header", { className: css.sectionHead, children: [_jsxs("button", { type: "button", className: css.sectionToggleTitle, onClick: () => { setOpen((current) => !current); }, "aria-expanded": open, children: [_jsx(Chevron, { open: open }), _jsx(IconBranchOutline16, {}), " ", t(parallel ? 'dependency.parallel' : 'dependency.title')] }), _jsx("span", { className: css.sectionHint, children: pinnedTaskId === null
                            ? t(parallel ? 'dependency.hint.parallel' : 'workspace.dependencies')
                            : t('dependency.hint.pinned', { taskId: pinnedTaskId }) })] }), open && (_jsxs(_Fragment, { children: [_jsx("div", { className: css.dagViewport, children: _jsxs("div", { className: css.dagCanvas, "data-layout": parallel ? 'parallel' : 'dependency', style: parallel ? undefined : { width: layout.width, height: layout.height }, children: [!parallel && _jsx("svg", { className: css.dagEdges, width: layout.width, height: layout.height, "aria-hidden": true, children: layout.edges.map((edge) => {
                                        const active = related !== null && related.has(edge.from) && related.has(edge.to);
                                        return _jsx("path", { d: edge.path, "data-active": active, "data-dimmed": related !== null && !active }, `${edge.from}:${edge.to}`);
                                    }) }), layout.nodes.map(({ task, x, y }) => {
                                    const model = taskModelLabel(task, members);
                                    const gate = isGateTask(task, team.workflow?.loops);
                                    const aiReview = (team.workflow?.loops.find(loop => loop.gateId === task.id)?.mode ?? task.checkpoint?.mode) === 'ai';
                                    const control = taskControlState(team, task, historic);
                                    return (_jsxs("button", { type: "button", "aria-pressed": pinnedTaskId === task.id, onClick: () => { if (gate) {
                                            onOpenTask(task, false);
                                            return;
                                        } ; const next = pinnedTaskId === task.id ? null : task.id; setPinnedTaskId(next); onSelectTask?.(next); }, className: `${css.dagNode} ${taskStateNodeClass}`, "data-lifecycle": discarded ? 'notRun' : task.verdictStale ? 'stale' : control.visual, style: parallel
                                            ? { height: nodeHeight }
                                            : { left: x, top: y, width: nodeWidth, height: nodeHeight }, "data-task-id": task.id, "data-gate": gate || undefined, "data-checkpoint": !!task.checkpoint || undefined, "data-review-ready": control.reviewReady || undefined, "data-state": discarded ? 'cancelled' : taskTone(task.state, task.status), "data-verdict-stale": task.verdictStale === undefined ? undefined : 'true', "data-task-model": model || undefined, "data-focused": related?.has(task.id) ?? false, "data-dimmed": related !== null && !related.has(task.id), title: `${taskTitle(task, model)} · ${t(control.label)}`, onMouseEnter: () => { scheduleHover(task.id); }, onMouseLeave: () => { scheduleHover(null); }, onFocus: () => { setKeyboardTaskId(task.id); }, onBlur: () => { setKeyboardTaskId(null); }, children: [gate && _jsx("svg", { className: css.dagGateShape, viewBox: "0 0 100 100", preserveAspectRatio: "none", "aria-hidden": "true", children: _jsx("path", { d: "M1 50 L50 1 L99 50 L50 99 Z" }) }), _jsxs("span", { className: css.dagNodeHead, children: [_jsx("span", { className: css.dagNodeDot }), task.id, task.checkpoint ? _jsxs("span", { className: css.reviewKind, title: t('task.control.round', { round: task.checkpoint.round }), children: [_jsx(WorkflowIcon, { name: isGateTask(task, team.workflow?.loops) ? 'gate' : 'acceptance' }), " ", t(aiReview ? 'task.control.ai' : 'task.control.human')] }) : _jsx("span", { className: css.dagOwner, children: task.assignee || t('task.assignee.unclaimed') })] }), _jsx("span", { className: css.dagNodeLabel, children: task.subject }), _jsx(TaskStateBadge, { control: control, t: t, className: css.dagState, discarded: discarded, stale: !!task.verdictStale, detail: task.status === 'claimed' ? t('task.control.claimedHint') : undefined }), task.state === 'running' && (_jsx("span", { className: css.dagRunningState, "aria-label": t('task.runningAria'), children: _jsx(WorkGlyph, { active: true }) }))] }, task.id));
                                })] }) }), _jsxs("section", { className: css.taskDetail, "data-task-detail": detailTask.id, children: [_jsxs("span", { className: css.taskDetailHead, children: [_jsx("span", { className: css.taskDetailId, children: detailTask.id }), _jsx("span", { className: css.taskDetailSubject, title: detailTask.subject, children: detailTask.subject }), _jsxs("span", { className: css.taskDetailBadge, "data-verdict-stale": detailTask.verdictStale ? 'true' : undefined, "data-review-ready": control.reviewReady || undefined, "data-state": discarded ? 'cancelled' : taskTone(detailTask.state, detailTask.status), children: [_jsxs("span", { "aria-hidden": "true", children: [detailTask.verdictStale ? '!' : detailTask.status === 'completed' ? '✓' : detailTask.status === 'failed' ? '!' : control.reviewReady ? '◇' : '•', " "] }), discarded ? t('task.status.notRun') : t(control.label)] })] }), _jsxs("span", { className: css.taskDetailLine, children: [detailTask.checkpoint ? t('task.assignee.human') : detailTask.assignee || t('task.assignee.unclaimed'), detailModel !== '' && _jsxs("span", { className: css.taskDetailModel, "data-task-model": detailModel, children: [" \u00B7 ", t('task.model', { model: detailModel })] }), detailTask.checkpoint && _jsxs("span", { className: css.reviewKind, children: [" \u00B7 ", t('task.control.round', { round: detailTask.checkpoint.round })] })] }), _jsxs("div", { className: css.taskDetailControls, children: [(!control.terminal || control.canRerun || control.retryLoopTask) && _jsxs("button", { type: "button", "data-task-action": control.canRerun ? 'rerun' : control.stopping ? 'retry' : control.queued ? 'dequeue' : control.checked ? 'pause' : 'play', "data-rerun-action": control.canRerun || undefined, "data-running": !control.stopping && detailTask.status === 'in_progress' || undefined, "aria-label": control.canRerun ? t('task.control.rerunTask', { task: detailTask.subject }) : `${t(control.actionLabel)} · ${detailTask.subject}`, className: css.taskPlayback, disabled: !control.canRerun && control.disabled || !!controlBusy, title: t(control.canRerun ? 'task.control.rerunHint' : control.disabled || control.stopping ? control.label : 'task.control.hint'), onClick: () => control.canRerun ? onOpenTask(detailTask, false, true) : onToggle(detailTask, control.stopping ? false : !control.checked), children: [_jsx("svg", { className: css.taskPlaybackIcon, viewBox: "0 0 16 16", "aria-hidden": "true", focusable: "false", children: control.queued ? _jsx("path", { d: "M3 3h10v10H3z" }) : control.checked && !control.canRerun ? _jsx("path", { d: "M4 3h3v10H4zm5 0h3v10H9z" }) : _jsx("path", { d: "M4 2.5v11l9-5.5z" }) }), t(control.canRerun ? 'task.control.rerun' : control.disabled ? control.label : control.actionLabel)] }), _jsxs("button", { type: "button", "data-review-action": control.reviewReady || undefined, disabled: !!controlBusy, onClick: () => onOpenTask(detailTask, control.reviewReady), children: [_jsx(WorkflowIcon, { name: control.reviewReady ? isGateTask(detailTask, team.workflow?.loops) ? 'gate' : 'acceptance' : 'properties' }), t(control.reviewReady ? 'task.control.review' : 'task.control.properties')] })] }), !control.terminal && waitingOn.length > 0 && _jsx("p", { className: css.taskControlHint, children: t('task.detail.waitingOn', { tasks: formatTaskIds(waitingOn, t) }) }), detailTask.checkpoint?.note && _jsx("span", { className: css.reviewNote, children: detailTask.checkpoint.note }), detailTask.description && _jsx("p", { className: css.taskDetailDescription, title: detailTask.description, children: detailTask.description }), _jsxs("details", { className: css.taskDetailMore, children: [_jsx("summary", { children: t('task.detail.more') }), _jsx("span", { className: css.taskDetailMeta, children: dependents.length === 0 ? t('task.detail.noDownstream') : t('task.detail.unlocks', { tasks: formatTaskIds(dependents.map(task => task.id), t) }) }), !control.terminal && !control.disabled && _jsx("p", { className: css.taskControlHint, children: t('task.control.hint') }), control.canRerun && _jsx("p", { className: css.taskControlHint, children: t('task.control.rerunHint') })] }, detailTask.id)] })] }))] }));
}
function LocalizedTeamSection({ team, modelDirectory, onContinuePlanning, onDiscarded, onNavigate, t, historic = false }) {
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [controlBusy, setControlBusy] = useState();
    const controlPending = useRef(false);
    const [controlError, setControlError] = useState('');
    const [taskEntry, setTaskEntry] = useState();
    async function toggleTask(task, enabled) {
        if (controlPending.current || taskControlState(team, task, historic).disabled)
            return;
        controlPending.current = true;
        setControlBusy(task.id);
        setControlError('');
        try {
            const value = await workflowRequest({ action: 'set_task_enabled', sessionId: team.captainSessionId, teamId: team.teamId, taskId: task.id, enabled, updatedAt: task.updatedAt });
            if (!value.activity)
                throw new Error(t('task.control.failed'));
            publishWorkflowActivity(value.activity);
        }
        catch (error) {
            setControlError(error instanceof Error ? error.message : t('task.control.failed'));
        }
        finally {
            controlPending.current = false;
            setControlBusy(undefined);
        }
    }
    const flow = flowControlState(team);
    async function toggleFlow(enabled) {
        if (controlPending.current)
            return;
        controlPending.current = true;
        setControlBusy('flow');
        setControlError('');
        try {
            const value = await workflowRequest({ action: team.phase === 'staged' ? 'start' : 'set_flow_enabled', sessionId: team.captainSessionId, teamId: team.teamId, enabled, version: flowControlVersion(team) });
            if (value.skipped?.length)
                setControlError(value.skipped.join('\n'));
            if (!value.activity)
                throw new Error(t('task.control.failed'));
            publishWorkflowActivity(value.activity);
        }
        catch (error) {
            setControlError(error instanceof Error ? error.message : t('task.control.failed'));
        }
        finally {
            controlPending.current = false;
            setControlBusy(undefined);
        }
    }
    const [editingMember, setEditingMember] = useState();
    const selectedAssignee = team.tasks.find(task => task.id === selectedTaskId)?.assignee;
    const [membersOpen, setMembersOpen] = useState(true);
    const [stopOpen, setStopOpen] = useState(false);
    const [stopping, setStopping] = useState(false);
    const [stopError, setStopError] = useState('');
    const discarded = historic && team.phase === 'staged';
    const stopped = !historic && team.halted === true;
    const busyCount = team.members.filter((member) => member.activity === 'working').length;
    const assignedCount = team.tasks.filter((task) => task.assignee !== '' && task.assignee !== CAPTAIN_ASSIGNEE).length;
    const captainOwned = team.tasks.filter((task) => task.assignee === CAPTAIN_ASSIGNEE
        && task.status !== 'completed' && task.status !== 'failed' && task.status !== 'cancelled');
    const captainBusy = captainOwned.length > 0;
    const captainTaskIds = formatTaskIds(captainOwned.map((task) => task.id), t);
    const { completed: completedCount, total: progressTotal, state: progressState } = activityStatus(team);
    const allCompleted = progressState === 'completed';
    const allSettled = team.tasks.length > 0 && team.tasks.every((task) => (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled'));
    const unfinishedCount = team.tasks.filter((task) => (task.status !== 'completed' && task.status !== 'failed' && task.status !== 'cancelled')).length;
    const canStop = !historic && team.phase === 'running' && team.halted !== true && teamIsActive(team);
    const stopTeam = async () => {
        if (stopping)
            return;
        setStopping(true);
        setStopError('');
        try {
            const response = await fetch(ACTIVITY_HALT_URL, {
                method: 'POST',
                cache: 'no-store',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ sessionId: team.captainSessionId, teamId: team.teamId }),
            });
            if (!response.ok) {
                let message = t('team.stopRequestFailed');
                try {
                    const body = await response.json();
                    if (typeof body.error === 'string' && body.error.trim() !== '')
                        message = body.error;
                }
                catch { }
                throw new Error(message);
            }
            setStopOpen(false);
        }
        catch (error) {
            setStopError(t('team.stopFailed', { message: error instanceof Error ? error.message : String(error) }));
        }
        finally {
            setStopping(false);
        }
    };
    return (_jsxs(_Fragment, { children: [_jsxs("section", { className: css.team, "data-team-id": team.teamId, "data-workspace-team": true, children: [_jsxs("header", { className: css.teamHead, children: [_jsx("span", { className: css.teamName, title: team.name, children: team.name }), historic && _jsx("span", { className: css.historicPill, children: t(discarded ? 'team.discarded' : 'team.ended') }), stopped && _jsx("span", { className: css.historicPill, children: t('team.stopped') }), _jsxs("span", { className: css.teamStats, children: [_jsx("span", { "data-stat": "members", children: t('team.stats.members', { count: team.members.length }) }), _jsx("span", { "data-stat": "tasks", children: t('team.stats.completed', { completed: completedCount, total: progressTotal }) }), _jsx("span", { "data-stat": "messages", children: t('team.stats.messages', { count: team.messageCount }) })] }), canStop && (_jsx("button", { type: "button", className: css.teamStopButton, "aria-label": t('team.stop'), title: t('team.stop'), onClick: () => { setStopError(''); setStopOpen(true); }, children: _jsx(IconStopFill16, {}) }))] }), !historic && !team.halted && _jsxs("div", { className: css.taskDetailControls, title: t('flow.control.hint'), "data-flow-controls": true, children: [_jsx("button", { type: "button", disabled: !!controlBusy || !(team.phase === 'staged' ? team.tasks.length > 0 : flow.canStart), onClick: () => void toggleFlow(true), children: t('flow.control.start') }), _jsx("button", { type: "button", disabled: !!controlBusy || !flow.canPause, onClick: () => void toggleFlow(false), children: t('flow.control.pause') })] }), team.phase === 'staged' && !team.workflowEnabled && !historic && modelDirectory !== undefined && onContinuePlanning !== undefined && onDiscarded !== undefined && (_jsx(StagingPlanEditor, { team: team, modelDirectory: modelDirectory, onContinuePlanning: onContinuePlanning, onDiscarded: onDiscarded, t: t })), _jsxs("section", { className: css.delegationSection, "aria-label": t('delegation.aria'), "data-delegation-map": true, children: [_jsxs("div", { className: css.captainNode, children: [_jsx("span", { className: css.captainAvatar, children: _jsx("img", { className: css.leadAvatar, src: LEAD_ART, alt: "", "aria-hidden": true }) }), _jsxs("span", { className: css.captainInfo, children: [_jsxs("span", { className: css.captainLine, children: [_jsx("span", { className: css.captainName, children: t('captain.name') }), _jsx("span", { className: css.captainRole, children: t('captain.role') })] }), _jsx("span", { className: css.captainSummary, children: discarded
                                                    ? t('captain.summary.discarded', { tasks: team.tasks.length, members: team.members.length })
                                                    : captainBusy
                                                        ? t('captain.summary.withTakeover', { tasks: assignedCount, captainTasks: captainTaskIds })
                                                        : team.phase === 'staged'
                                                            ? t(team.planReviewState === 'awaiting_feedback'
                                                                ? 'captain.summary.awaitingFeedback'
                                                                : 'captain.summary.staged', { tasks: team.tasks.length, members: team.members.length })
                                                            : t('captain.summary', { tasks: assignedCount, members: team.members.length }) })] }), _jsxs("span", { className: css.captainState, "data-busy": captainBusy || busyCount > 0, children: [_jsx(WorkGlyph, { active: captainBusy || busyCount > 0 }), discarded
                                                ? t('captain.state.discarded')
                                                : captainBusy
                                                    ? t('captain.state.takeover', { tasks: captainTaskIds })
                                                    : team.phase === 'staged'
                                                        ? t(team.planReviewState === 'awaiting_feedback'
                                                            ? 'captain.state.awaitingFeedback'
                                                            : 'captain.state.staged')
                                                        : busyCount > 0
                                                            ? t('captain.state.working', { count: busyCount })
                                                            : t(allCompleted
                                                                ? 'captain.state.collected'
                                                                : allSettled
                                                                    ? 'captain.state.settled'
                                                                    : 'captain.state.waiting')] })] }), _jsx(ProgressOverview, { team: team, t: t, discarded: discarded }), (() => {
                                const orderedMembers = orderDelegationMembers(team.members, team.tasks);
                                const runningMembers = orderedMembers.filter((member) => (member.activity === 'working' || member.status === 'working'
                                    || team.tasks.some((task) => task.assignee === member.name
                                        && (task.status === 'pending' || task.status === 'claimed' || task.status === 'in_progress'))));
                                const visibleMembers = membersOpen ? orderedMembers : runningMembers;
                                const hiddenFinishedCount = orderedMembers.length - visibleMembers.length;
                                const expandLabel = membersOpen
                                    ? t('members.collapse')
                                    : hiddenFinishedCount > 0
                                        ? t('members.expandFinished', { count: hiddenFinishedCount })
                                        : t('members.expand');
                                return (_jsxs(_Fragment, { children: [_jsxs("button", { type: "button", className: css.membersToggle, onClick: () => { setMembersOpen((current) => !current); }, "aria-expanded": membersOpen, "data-members-toggle": true, children: [_jsxs("span", { children: [_jsx(Chevron, { open: membersOpen }), t('members.toggle', { count: team.members.length })] }), _jsx("span", { children: expandLabel })] }), (membersOpen || visibleMembers.length > 0) && _jsxs("div", { className: css.delegationTree, children: [team.members.length === 0 && _jsx("span", { className: css.emptyHint, children: t('members.empty') }), visibleMembers.map((member) => {
                                                    const owned = team.tasks.filter((task) => task.assignee === member.name);
                                                    const memberModel = memberRouteLabel(member);
                                                    return (_jsxs("div", { className: css.memberBlock, "data-activity": member.activity, "data-selected-member": (editingMember === member.name || selectedAssignee === member.name) || undefined, children: [_jsx("span", { className: css.memberBranch, "aria-hidden": true, children: _jsx("span", {}) }), _jsxs("button", { type: "button", className: css.memberRow, "data-activity": member.activity, onClick: () => {
                                                                    if (!historic && modelDirectory) {
                                                                        setEditingMember(value => value === member.name ? undefined : member.name);
                                                                    }
                                                                    else if (member.id !== '') {
                                                                        onNavigate(team.captainSessionId, member.id);
                                                                    }
                                                                }, children: [_jsxs("span", { className: css.memberAvatar, "data-unread": member.unread > 0, children: [_jsx("img", { className: css.memberArt, src: memberArtUrl(member.name, member.role), alt: "", "aria-hidden": true }), _jsx("img", { className: css.stateArt, "data-activity": member.activity, src: ACTION_ART[member.activity], alt: "", "aria-hidden": true })] }), _jsxs("span", { className: css.memberInfo, children: [_jsxs("span", { className: css.memberLine, children: [_jsx("span", { className: css.memberName, children: member.name }), member.role !== '' && _jsx("span", { className: css.memberRole, children: member.role }), memberModel !== '' && (_jsx("span", { className: css.memberModel, role: "img", "data-member-model": memberModel, title: memberModel, "aria-label": memberModel, children: compactModelLabel(memberModel) })), _jsxs("span", { className: css.memberState, "data-activity": member.activity, children: [_jsx(WorkGlyph, { active: member.activity === 'working' }), discarded
                                                                                                ? t('member.state.notCreated')
                                                                                                : stopped
                                                                                                    ? t('member.state.stopped')
                                                                                                    : team.phase === 'staged'
                                                                                                        ? t('member.state.staged')
                                                                                                        : memberStateLabel(member, team.tasks, historic, t)] })] }), _jsx("span", { className: css.memberStatusLine, children: discarded
                                                                                    ? t('member.status.discarded')
                                                                                    : stopped
                                                                                        ? t('member.status.stopped')
                                                                                        : team.phase === 'staged'
                                                                                            ? t('member.status.staged')
                                                                                            : historic && owned.length > 0 && owned.every((task) => (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled'))
                                                                                                ? t('member.status.settled')
                                                                                                : memberStatusText(member, team.tasks, t) })] }), _jsxs("span", { className: css.memberCount, children: [member.done, "/", member.total] })] }), editingMember === member.name && modelDirectory && !historic && _jsx(QuickMemberEditor, { team: team, member: member, directory: modelDirectory, t: t, close: () => setEditingMember(undefined), onRerun: taskId => setTaskEntry({ taskId, review: false, rerun: true }) }, member.name), !historic && modelDirectory && member.id !== '' && _jsx("button", { type: "button", className: css.quickTranscript, onClick: () => onNavigate(team.captainSessionId, member.id), children: t('workflow.executionChat') }), _jsxs("div", { className: css.assignmentLine, children: [_jsx("span", { className: css.assignmentLabel, children: t(discarded
                                                                            ? 'assignment.discarded'
                                                                            : team.phase === 'staged'
                                                                                ? 'assignment.staged'
                                                                                : 'assignment.label') }), _jsx("span", { className: css.assignmentTasks, children: owned.length === 0
                                                                            ? _jsx("span", { className: css.taskEmpty, children: t('assignment.empty') })
                                                                            : owned.map((task) => {
                                                                                const model = taskModelLabel(task, team.members);
                                                                                const shortModel = compactModelLabel(model);
                                                                                return (_jsx("span", { className: css.assignmentChip, "data-state": discarded ? 'cancelled' : taskTone(task.state, task.status), "data-verdict-stale": task.verdictStale === undefined ? undefined : 'true', "data-task-model": model || undefined, title: taskTitle(task, model), children: task.state === 'running' && shortModel !== '' ? `${task.id} · ${shortModel}` : task.id }, task.id));
                                                                            }) })] })] }, member.id || member.name));
                                                })] })] }));
                            })()] }), controlBusy && _jsx("p", { role: "status", className: css.taskControlHint, children: t('task.control.saving') }), controlError && _jsx("p", { role: "alert", className: css.stopModalError, children: controlError }), _jsx(DependencyMap, { team: team, tasks: team.tasks, members: team.members, t: t, historic: historic, discarded: discarded, onSelectTask: setSelectedTaskId, controlBusy: controlBusy, onToggle: (task, enabled) => void toggleTask(task, enabled), onOpenTask: (task, review, rerun) => setTaskEntry({ taskId: task.id, review, rerun }) }), taskEntry && _jsx(WorkflowWorkbench, { sessionId: team.captainSessionId, teamId: team.teamId, archived: historic, entryTarget: taskEntry, onClose: () => setTaskEntry(undefined), modelDirectory: modelDirectory, t: t, openExecution: (id, parent) => onNavigate((parent ?? team.captainSessionId), id), openConversation: id => openWorkflowConversation(onNavigate, id) }, taskEntry.taskId), _jsx(WorkspaceSummary, { team: team, t: t, discarded: discarded })] }), _jsx(Modal, { open: stopOpen, onClose: () => { if (!stopping)
                    setStopOpen(false); }, title: t('team.stopTitle', { team: team.name }), closeLabel: t('plan.cancel'), description: t('team.stopDescription', { tasks: unfinishedCount, members: busyCount }), footer: (_jsxs("span", { className: css.stopModalActions, children: [_jsx("button", { type: "button", disabled: stopping, onClick: () => { setStopOpen(false); }, children: t('team.stopCancel') }), _jsxs("button", { type: "button", "data-danger": true, disabled: stopping, onClick: () => { void stopTeam(); }, children: [_jsx(IconStopFill16, {}), stopping ? t('team.stopping') : t('team.stopConfirm')] })] })), children: stopError !== '' && _jsxs("p", { className: css.stopModalError, role: "alert", children: [_jsx(IconWarningOutline16, {}), stopError] }) })] }));
}
export function ActivityPanel({ sessionsList, modelDirectories, openMember, t, conversationVisible = true, onMonitorStatus }) {
    const [canvasEntry, setCanvasEntry] = useState();
    const selectedSession = currentSessionId(useSyncExternalStore(sessionsList.subscribe, sessionsList.getSnapshot));
    const [sessionOwner, setSessionOwner] = useState();
    const current = (sessionOwner && sessionOwner.sessionId === selectedSession ? sessionOwner.owner : selectedSession);
    useEffect(() => {
        if (!selectedSession)
            return;
        const controller = new AbortController();
        let active = true;
        void resolveActivitySession(selectedSession, controller.signal).then(result => {
            if (!active)
                return;
            if (result.activity)
                publishWorkflowActivity(result.activity);
            setSessionOwner(result);
        }).catch(() => { });
        return () => { active = false; controller.abort(); };
    }, [selectedSession]);
    const monitorTargets = useSyncExternalStore(subscribeActivityMonitorTargets, getActivityMonitorTargetsSnapshot);
    const { teams, archivedTeams } = useSyncExternalStore(subscribeActivitySnapshots, getActivitySnapshotsSnapshot);
    const currentTargets = useMemo(() => current === undefined ? [] : monitorTargets.filter((target) => target.sessionId === current), [current, monitorTargets]);
    useLayoutEffect(() => {
        setCanvasEntry(entry => entry?.owner === current ? entry : undefined);
    }, [current]);
    useEffect(() => {
        if (current === undefined)
            return;
        // Cards keep live teams on the normal cadence. The current-session scope
        // also performs one cold-start discovery pass so archived/cardless teams
        // survive a browser or `dsh web` restart.
        onMonitorStatus?.(current, 'loading');
        const controller = startActivityPolling(currentTargets, { discoverySessionId: current, onStatus: status => onMonitorStatus?.(current, status) });
        return () => controller.stop();
    }, [current, currentTargets, onMonitorStatus]);
    const visibleTeams = useMemo(
    // No current session (initial load): show nothing until one is picked,
    // so the shortcut never points to another session.
    () => (current === undefined ? [] : teams.filter((team) => team.captainSessionId === current)), [teams, current]);
    const visibleArchived = useMemo(() => (current === undefined ? [] : archivedTeams.filter((team) => team.captainSessionId === current && !teams.some((live) => live.captainSessionId === current && live.teamId === team.teamId))), [archivedTeams, current, teams]);
    const team = visibleTeams[0] ?? visibleArchived[0];
    if (!conversationVisible || !current)
        return null;
    return (_jsxs(_Fragment, { children: [team && _jsx(CollapsedBadge, { count: visibleTeams.length + visibleArchived.length, team: team, archived: !visibleTeams.length, t: t, onClick: () => setCanvasEntry({ owner: current, teamId: team.teamId, archived: !visibleTeams.length }) }), canvasEntry && canvasEntry.owner === current && _jsx(WorkflowWorkbench, { initiallyOpen: true, sessionId: canvasEntry.owner, teamId: canvasEntry.teamId, archived: canvasEntry.archived, t: t, modelDirectory: modelDirectories.directoryFor(canvasEntry.owner), openExecution: (id, parent) => openMember((parent ?? canvasEntry.owner), id), onClose: () => setCanvasEntry(undefined) }, canvasEntry.owner + ':' + canvasEntry.teamId)] }));
}
export function TeamSection(props) {
    return _jsx(WorkflowLocale, { t: props.t, children: _jsx(LocalizedTeamSection, { ...props }) });
}
