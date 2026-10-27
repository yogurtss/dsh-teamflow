import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/** A compact view over the same isolated native discussion session. */
import { useEffect, useRef, useState } from 'react';
import css from './WorkflowWorkbench.module.css';
export function EmbeddedDiscussion({ sessionId, teamId, discussion }) {
    const [chat, setChat] = useState({ messages: [], busy: true });
    const [text, setText] = useState('');
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
        } }).catch(err => { if (live)
            setError(err instanceof Error ? err.message : String(err)); }); };
        refresh();
        const timer = setInterval(refresh, 2000);
        return () => { live = false; clearInterval(timer); };
    }, [sessionId, teamId, discussion]);
    async function send() {
        const message = text.trim();
        if (!message || sending || chat.busy)
            return;
        setSending(true);
        setError('');
        try {
            const result = await request('conversation_send', message);
            setChat(result);
            setText('');
        }
        catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
        finally {
            setSending(false);
        }
    }
    return _jsxs("div", { className: css.embeddedChat, children: [_jsxs("div", { ref: transcript, className: css.embeddedTranscript, "aria-label": "\u72EC\u7ACB\u8BA8\u8BBA\u8BB0\u5F55", children: [chat.messages.map(message => _jsxs("div", { className: message.role === 'user' ? css.userMessage : css.assistantMessage, children: [_jsx("strong", { children: message.role === 'user' ? '你' : 'AI' }), _jsx("p", { children: message.text })] }, message.id)), chat.busy && _jsx("p", { role: "status", children: "AI \u6B63\u5728\u601D\u8003\u2026" }), error && _jsx("p", { role: "alert", className: css.error, children: error })] }), _jsxs("form", { className: css.embeddedComposer, onSubmit: event => { event.preventDefault(); void send(); }, children: [_jsxs("label", { children: ["\u7EE7\u7EED\u8BA8\u8BBA", _jsx("textarea", { value: text, onChange: event => setText(event.target.value), placeholder: "\u4F8B\u5982\uFF1A\u8BA9\u8FD9\u4E2A Agent \u66F4\u4E13\u6CE8\u4E8E\u9700\u6C42\u5206\u6790\u2026" })] }), _jsx("button", { type: "submit", disabled: !text.trim() || chat.busy || sending, children: "\u53D1\u9001" })] })] });
}
