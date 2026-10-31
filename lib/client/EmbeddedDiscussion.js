import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { workflowMessage } from "./workflow-text.js";
import { useWorkflowText } from "./workflow-i18n.js";
/** A compact view over the same isolated native discussion session. */
import { useEffect, useRef, useState } from 'react';
import css from './WorkflowWorkbench.module.css';
import { remainingMessage } from "./workbench-drafts.js";
export function EmbeddedDiscussion({ sessionId, teamId, discussion }) {
    const l = useWorkflowText();
    return _jsx(Discussion, { sessionId: sessionId, teamId: teamId, discussion: discussion }, JSON.stringify([sessionId, teamId, discussion]));
}
function Discussion({ sessionId, teamId, discussion }) {
    const l = useWorkflowText();
    const storageKey = `teamflow:discussion-draft:v1:${JSON.stringify([sessionId, teamId, discussion])}`;
    const [storageError, setStorageError] = useState('');
    const [chat, setChat] = useState({ messages: [], busy: false });
    const [loading, setLoading] = useState(true);
    const [text, setText] = useState(() => { try {
        return sessionStorage.getItem(storageKey) ?? '';
    }
    catch {
        return '';
    } });
    const textRef = useRef(text), liveRef = useRef(true);
    useEffect(() => { liveRef.current = true; return () => { liveRef.current = false; }; }, []);
    function changeText(value) {
        textRef.current = value;
        setText(value);
        try {
            if (value)
                sessionStorage.setItem(storageKey, value);
            else
                sessionStorage.removeItem(storageKey);
            setStorageError('');
        }
        catch {
            setStorageError(l("草稿备份失败，离开页面前请保留文本。"));
        }
    }
    useEffect(() => {
        if (!text || !storageError)
            return;
        const warn = (event) => { event.preventDefault(); event.returnValue = ''; };
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [text, storageError]);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const transcript = useRef(null);
    const previousCount = useRef(0);
    useEffect(() => {
        if (previousCount.current > 0 && chat.messages.length > previousCount.current && transcript.current)
            transcript.current.scrollTop = transcript.current.scrollHeight;
        previousCount.current = chat.messages.length;
    }, [chat.messages.length]);
    async function request(action, message) {
        const response = await fetch('/plugins/dsh-agent-teams/workflow', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sessionId, teamId, discussion, action, message }) });
        const value = await response.json();
        if (!response.ok)
            throw new Error(value.error ?? `HTTP ${response.status}`);
        return value;
    }
    useEffect(() => {
        let live = true;
        const refresh = () => { void request('conversation_state').then(value => { if (live) {
            setChat(value);
            setError('');
            setLoading(false);
        } }).catch(err => { if (live) {
            setError(err instanceof Error ? err.message : String(err));
            setLoading(false);
        } }); };
        refresh();
        const timer = setInterval(refresh, 2000);
        return () => { live = false; clearInterval(timer); };
    }, [sessionId, teamId, discussion]);
    async function send() {
        const submitted = textRef.current, message = submitted.trim();
        if (!message || loading || sending || chat.busy)
            return;
        setSending(true);
        setError('');
        try {
            const result = await request('conversation_send', message);
            if (liveRef.current) {
                setChat(result);
                changeText(remainingMessage(textRef.current, submitted));
            }
            else {
                try {
                    if (sessionStorage.getItem(storageKey) === submitted)
                        sessionStorage.removeItem(storageKey);
                }
                catch { /* Keep a recoverable draft if storage is unavailable. */ }
            }
        }
        catch (err) {
            if (liveRef.current)
                setError(err instanceof Error ? err.message : String(err));
        }
        finally {
            if (liveRef.current)
                setSending(false);
        }
    }
    return _jsxs("div", { className: css.embeddedChat, children: [_jsxs("div", { ref: transcript, className: css.embeddedTranscript, "aria-label": l("独立讨论记录"), children: [chat.messages.map(message => _jsxs("div", { className: message.role === 'user' ? css.userMessage : css.assistantMessage, children: [_jsx("strong", { children: message.role === 'user' ? l("你") : 'AI' }), _jsx("p", { children: message.text })] }, message.id)), loading ? _jsx("p", { role: "status", children: l("正在读取讨论记录…") }) : chat.busy && _jsx("p", { role: "status", children: l("AI 正在思考…") }), error && _jsx("p", { role: "alert", className: css.error, children: workflowMessage(error, l) })] }), _jsxs("form", { className: css.embeddedComposer, onSubmit: event => { event.preventDefault(); void send(); }, children: [_jsxs("label", { children: [l("继续讨论"), _jsx("textarea", { value: text, onChange: event => changeText(event.target.value), placeholder: discussion.startsWith('task:') ? l("例如：帮我细化这个任务的要求，或分析失败原因…") : discussion.startsWith('member:') ? l("例如：让这个 Agent 更专注于需求分析…") : l("输入你想讨论的问题…") })] }), _jsx("small", { role: storageError ? 'alert' : undefined, children: workflowMessage(storageError, l) || (text ? l("草稿保存在此标签页，切换讨论或刷新可恢复。") : '') }), _jsx("button", { type: "submit", disabled: !text.trim() || loading || chat.busy || sending, children: sending ? l("发送中…") : l("发送") })] })] });
}
