import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { WorkflowWorkbench } from "./WorkflowWorkbench.js";
import css from './SuperAgent.module.css';
import { captainOpened } from "./super-agent-navigation.js";
export function SupervisorMessage({ node, sessionId, t, sessions, modelDirectories, openMember }) {
    return _jsx(ConversationCard, { card: node.data, sessionId, t, sessions, modelDirectories, openMember });
}
export function ConversationCard({ card, archived, sessionId, t, sessions, modelDirectories, openMember }) {
    const en = t('language.code') === 'en';
    const [open, setOpen] = useState(false), [error, setError] = useState(''), [asking, setAsking] = useState(false), [question, setQuestion] = useState(''), [busy, setBusy] = useState(false);
    const token = useRef();
    useEffect(() => () => token.current?.abort(), []);
    const relay = card.requirement;
    const canReply = relay?.kind === 'question' || relay?.kind === 'reply';
    const caption = relay ? ({ question: en ? 'Captain needs your input' : '队长需要你确认', reply: en ? 'Captain reply' : '队长回复', result: en ? 'Captain result' : '队长已返回结果', failed: en ? 'Requirement interrupted' : '要求处理未完成', answered: en ? 'Answer queued' : '已回复，等待队长处理' })[relay.kind] :
        card.status === 'open' ? ({ review: en ? 'Review needed' : '需要你验收', proposal: en ? 'Confirm proposal' : '需要确认提案', block: en ? 'Input needed' : '需要你介入', progress: en ? 'Node activity' : '节点动态', requirement: en ? 'Captain report' : '队长回报' })[card.item.kind] :
            ({ approved: en ? 'Approved' : '已通过', rejected: en ? 'Returned' : '已退回', closed: en ? 'Closed' : '已结束' })[card.status];
    async function locate() {
        token.current?.abort();
        const abort = new AbortController();
        token.current = abort;
        try {
            const ref = sessions.retain(card.captain, { source: 'teamflowLauncher', signal: abort.signal });
            await ref.ready;
            if (!abort.signal.aborted)
                setOpen(true);
        }
        catch (e) {
            if (!abort.signal.aborted)
                setError(String(e));
        }
    }
    async function ask() {
        if (!question.trim() || busy)
            return;
        setBusy(true);
        try {
            const res = await fetch('/plugins/dsh-agent-teams/super-agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: canReply ? 'answer' : 'ask', workspaceId: card.workspaceId, sessionId, key: card.key, round: relay?.round, question }) });
            if (!res.ok)
                throw Error((await res.json()).error);
            setAsking(false);
            setQuestion('');
            setError('');
        }
        catch (e) {
            setError(String(e));
        }
        finally {
            setBusy(false);
        }
    }
    async function showCaptain() {
        try {
            await openMember(card.captain, card.captain);
            window.dispatchEvent(new Event(captainOpened));
        }
        catch (e) {
            setError(String(e));
        }
    }
    return _jsxs("article", { className: css.chatCard, "data-supervisor-card": card.key, children: [_jsxs("small", { children: ["Super Agent \u00B7 ", caption] }), _jsx("h3", { children: card.item.title }), _jsxs("p", { children: [card.project, " / ", card.workflow, card.item.round ? ' · ' + (en ? 'Round ' : '第 ') + card.item.round + (en ? '' : ' 轮') : ''] }), relay && _jsxs("p", { children: [en ? 'Your requirement' : '你的要求', " \u00B7 ", relay.instruction] }), relay?.answer && relay.kind !== 'answered' && _jsxs("p", { children: [en ? 'Your reply' : '你的答复', " \u00B7 ", relay.answer] }), card.summary && _jsx("blockquote", { children: card.summary }), relay ? _jsxs("button", { onClick: showCaptain, children: [en ? 'Captain conversation' : '查看队长对话', " \u2197"] }) : _jsxs("button", { onClick: locate, children: [card.item.kind === 'review' ? (en ? 'View round evidence' : '查看本轮证据') : (en ? 'Open Workflow' : '查看 Workflow'), " \u2197"] }), !archived && _jsx("button", { onClick: () => setAsking(!asking), children: canReply ? (en ? 'Reply to Captain' : '回复队长') : (en ? 'Ask about this' : '询问此事项') }), asking && _jsxs("form", { onSubmit: e => { e.preventDefault(); void ask(); }, children: [_jsx("input", { autoFocus: true, "aria-label": en ? 'Question' : '问题', value: question, maxLength: 4000, onChange: e => setQuestion(e.target.value) }), _jsx("button", { disabled: busy || !question.trim(), children: en ? 'Send' : '发送' })] }), error && _jsx("p", { role: "alert", children: error }), open && card.item.kind !== 'requirement' && _jsx(WorkflowWorkbench, { initiallyOpen: true, sessionId: card.captain, teamId: card.teamId, t: t, supervisorTarget: card.item, modelDirectory: modelDirectories.directoryFor(card.captain), openExecution: (id, parent) => openMember((parent ?? card.captain), id), onClose: () => { setOpen(false); token.current?.abort(); } })] });
}
