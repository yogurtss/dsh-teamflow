import { workflowMessage } from './workflow-text.ts'
import { useWorkflowText } from './workflow-i18n.tsx'
/** A compact view over the same isolated native discussion session. */
import { useEffect, useRef, useState } from 'react'
import css from './WorkflowWorkbench.module.css'
import { remainingMessage } from './workbench-drafts.ts'

type Chat = { messages: { id: string; role: string; text: string }[]; busy: boolean }
export function EmbeddedDiscussion({ sessionId, teamId, discussion }: { sessionId: string; teamId: string; discussion: string }) {
  const l = useWorkflowText()

  return <Discussion key={JSON.stringify([sessionId,teamId,discussion])} sessionId={sessionId} teamId={teamId} discussion={discussion} />
}
function Discussion({ sessionId, teamId, discussion }: { sessionId: string; teamId: string; discussion: string }) {
  const l = useWorkflowText()

  const storageKey = `teamflow:discussion-draft:v1:${JSON.stringify([sessionId,teamId,discussion])}`
  const [storageError,setStorageError] = useState('')
  const [chat, setChat] = useState<Chat>({ messages: [], busy: false })
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState(() => { try { return sessionStorage.getItem(storageKey) ?? '' } catch { return '' } })
  const textRef = useRef(text), liveRef = useRef(true)
  useEffect(() => { liveRef.current = true; return () => { liveRef.current = false } }, [])
  function changeText(value: string): void {
    textRef.current = value; setText(value)
    try { if (value) sessionStorage.setItem(storageKey,value); else sessionStorage.removeItem(storageKey); setStorageError('') }
    catch { setStorageError(l("草稿备份失败，离开页面前请保留文本。")) }
  }
  useEffect(() => {
    if (!text || !storageError) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload',warn)
    return () => window.removeEventListener('beforeunload',warn)
  }, [text,storageError])
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
    const submitted = textRef.current, message = submitted.trim(); if (!message || loading || sending || chat.busy) return
    setSending(true); setError('')
    try {
      const result = await request('conversation_send', message)
      if (liveRef.current) { setChat(result); changeText(remainingMessage(textRef.current,submitted)) }
      else { try { if (sessionStorage.getItem(storageKey) === submitted) sessionStorage.removeItem(storageKey) } catch { /* Keep a recoverable draft if storage is unavailable. */ } }
    }
    catch (err) { if (liveRef.current) setError(err instanceof Error ? err.message : String(err)) }
    finally { if (liveRef.current) setSending(false) }
  }
  return <div className={css.embeddedChat}>
    <div ref={transcript} className={css.embeddedTranscript} aria-label={l("独立讨论记录")}>{chat.messages.map(message => <div key={message.id} className={message.role === 'user' ? css.userMessage : css.assistantMessage}><strong>{message.role === 'user' ? l("你") : 'AI'}</strong><p>{message.text}</p></div>)}
      {loading ? <p role="status">{l("正在读取讨论记录…")}</p> : chat.busy && <p role="status">{l("AI 正在思考…")}</p>}{error && <p role="alert" className={css.error}>{workflowMessage(error, l)}</p>}
    </div>
    <form className={css.embeddedComposer} onSubmit={event => { event.preventDefault(); void send() }}><label>{l("继续讨论")}<textarea value={text} onChange={event => changeText(event.target.value)} placeholder={discussion.startsWith('task:') ? l("例如：帮我细化这个任务的要求，或分析失败原因…") : discussion.startsWith('member:') ? l("例如：让这个 Agent 更专注于需求分析…") : l("输入你想讨论的问题…")} /></label><small role={storageError ? 'alert' : undefined}>{workflowMessage(storageError,l) || (text ? l("草稿保存在此标签页，切换讨论或刷新可恢复。") : '')}</small><button type="submit" disabled={!text.trim() || loading || chat.busy || sending}>{sending ? l("发送中…") : l("发送")}</button></form>
  </div>
}
