/** A compact view over the same isolated native discussion session. */
import { useEffect, useRef, useState } from 'react'
import css from './WorkflowWorkbench.module.css'

type Chat = { messages: { id: string; role: string; text: string }[]; busy: boolean }
export function EmbeddedDiscussion({ sessionId, teamId, discussion }: { sessionId: string; teamId: string; discussion: string }) {
  const [chat, setChat] = useState<Chat>({ messages: [], busy: false })
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const transcript = useRef<HTMLDivElement>(null)
  const previousCount = useRef(0)
  useEffect(() => {
    if (previousCount.current > 0 && chat.messages.length > previousCount.current && transcript.current) transcript.current.scrollTop = transcript.current.scrollHeight
    previousCount.current = chat.messages.length
  }, [chat.messages.length])
  async function request(action: string, message?: string): Promise<Chat> {
    const response = await fetch('/plugins/dsh-agent-teams/workflow', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sessionId, teamId, discussion, action, message }) })
    const value = await response.json() as Chat & { error?: string }
    if (!response.ok) throw new Error(value.error ?? `HTTP ${response.status}`)
    return value
  }
  useEffect(() => {
    let live = true
    const refresh = () => { void request('conversation_state').then(value => { if (live) { setChat(value); setError(''); setLoading(false) } }).catch(err => { if (live) { setError(err instanceof Error ? err.message : String(err)); setLoading(false) } }) }
    refresh(); const timer = setInterval(refresh, 2000)
    return () => { live = false; clearInterval(timer) }
  }, [sessionId, teamId, discussion])
  async function send(): Promise<void> {
    const message = text.trim(); if (!message || loading || sending || chat.busy) return
    setSending(true); setError('')
    try { const result = await request('conversation_send', message); setChat(result); setText('') }
    catch (err) { setError(err instanceof Error ? err.message : String(err)) }
    finally { setSending(false) }
  }
  return <div className={css.embeddedChat}>
    <div ref={transcript} className={css.embeddedTranscript} aria-label="独立讨论记录">{chat.messages.map(message => <div key={message.id} className={message.role === 'user' ? css.userMessage : css.assistantMessage}><strong>{message.role === 'user' ? '你' : 'AI'}</strong><p>{message.text}</p></div>)}
      {loading ? <p role="status">正在读取讨论记录…</p> : chat.busy && <p role="status">AI 正在思考…</p>}{error && <p role="alert" className={css.error}>{error}</p>}
    </div>
    <form className={css.embeddedComposer} onSubmit={event => { event.preventDefault(); void send() }}><label>继续讨论<textarea value={text} onChange={event => setText(event.target.value)} placeholder="例如：让这个 Agent 更专注于需求分析…" /></label><button type="submit" disabled={!text.trim() || loading || chat.busy || sending}>发送</button></form>
  </div>
}
