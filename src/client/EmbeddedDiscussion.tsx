import { createWorkflowCache } from './workflow-cache.ts'
import { workflowRequest } from './workflow-request.ts'
import { workflowMessage } from './workflow-text.ts'
import { useWorkflowText } from './workflow-i18n.tsx'
/** A compact view over the same isolated native discussion session. */
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { MarkdownText } from '@deepseek-ai/dsh-client-ui-primitives'
import { OutcomeMarkdown } from './OutcomeShowcase.tsx'
import { discussionMarkdown } from './discussion-json.ts'
import { BrandIcon } from './BrandIcon.tsx'
import css from './WorkflowWorkbench.module.css'
import { remainingMessage } from './workbench-drafts.ts'

type Chat = { revision?:string; messages: { id: string; role: string; text: string; streaming?:boolean }[]; busy: boolean }
const discussionCache=createWorkflowCache<Chat>(4,2*1024*1024)
export const AssistantReply = memo(function AssistantReply({ text, streaming }: { text: string; streaming: boolean }) {
  const l = useWorkflowText()
  const labels = useMemo(() => ({
    code: {
      copyLabel: l("复制代码"), copiedLabel: l("已复制"),
      toolbarLabels: { codeLabel: l("代码"), wrapLabel: l("自动换行"), unwrapLabel: l("取消自动换行") },
    },
    footnotes: l("脚注"),
  }), [l])
  const source = useMemo(() => streaming ? text : discussionMarkdown(text), [text, streaming])
  return <div className={css.replyBody}>
    {MarkdownText ? <MarkdownText text={source} streaming={streaming} labels={labels} /> : <OutcomeMarkdown text={source} />}
    {streaming && <span className={css.streamCaret} aria-hidden="true" />}
  </div>
})

export function EmbeddedDiscussion({ sessionId, teamId, discussion }: { sessionId: string; teamId: string; discussion: string }) {
  return <Discussion key={JSON.stringify([sessionId,teamId,discussion])} sessionId={sessionId} teamId={teamId} discussion={discussion} />
}
function Discussion({ sessionId, teamId, discussion }: { sessionId: string; teamId: string; discussion: string }) {
  const l = useWorkflowText()

  const storageKey = `teamflow:discussion-draft:v1:${JSON.stringify([sessionId,teamId,discussion])}`
  const [storageError,setStorageError] = useState('')
  const [chat, setChat] = useState<Chat>(()=>discussionCache.get(storageKey)??{ messages: [], busy: false })
  const chatRef=useRef(chat)
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
  const sendingRef = useRef(false), composingRef = useRef(false)
  const [error, setError] = useState('')
  const transcript = useRef<HTMLDivElement>(null)
  const followBottom = useRef(true), pollEpoch = useRef(0)
  const [unread,setUnread] = useState(false)
  function latest(): void { followBottom.current=true; setUnread(false); if(transcript.current)transcript.current.scrollTop=transcript.current.scrollHeight }
  const tail = chat.messages.at(-1)
  useLayoutEffect(() => {
    if (followBottom.current) latest()
    else if (tail) setUnread(true)
  }, [tail?.id,tail?.text,chat.busy,sending,loading])
  async function request(action: string, message?: string, signal?:AbortSignal): Promise<Chat> {
    const previous=chatRef.current
    const value=await workflowRequest<Chat & {notModified?:boolean}>({sessionId,teamId,discussion,action,message,...action==='conversation_state'?{conditionalState:true,knownRevision:previous.revision}:{}},fetch,action==='conversation_state'?12000:45000,signal)
    return value.notModified?previous:value
  }
  useEffect(() => {
    const abort = new AbortController()
    let timer: ReturnType<typeof setTimeout>
    async function refresh() {
      if(document.hidden){timer=setTimeout(()=>void refresh(),1500);return}
      const epoch=pollEpoch.current
      let delay=1500
      try {
        const value=await request('conversation_state',undefined,abort.signal)
        if (!abort.signal.aborted && epoch===pollEpoch.current) { if(chatRef.current!==value)discussionCache.set(storageKey,value);chatRef.current=value;setChat(previous=>previous.revision&&previous.revision===value.revision?previous:value); setError(''); setLoading(false) }
        if(value.busy)delay=250
      } catch(err) {
        if (!abort.signal.aborted && epoch===pollEpoch.current) { setError(err instanceof Error ? err.message : String(err)); setLoading(false) }
      } finally { if(!abort.signal.aborted)timer=setTimeout(()=>void refresh(),delay) }
    }
    void refresh()
    return () => { abort.abort(); clearTimeout(timer) }
  }, [sessionId, teamId, discussion])
  async function send(): Promise<void> {
    const submitted = textRef.current, message = submitted.trim(); if (!message || loading || sendingRef.current || chat.busy) return
    sendingRef.current = true
    pollEpoch.current++; latest(); setSending(true); setError('')
    try {
      const result = await request('conversation_send', message)
      if (liveRef.current) { pollEpoch.current++; chatRef.current=result;discussionCache.set(storageKey,result);setChat(result); changeText(remainingMessage(textRef.current,submitted)) }
      else { try { if (sessionStorage.getItem(storageKey) === submitted) sessionStorage.removeItem(storageKey) } catch { /* Keep a recoverable draft if storage is unavailable. */ } }
    }
    catch (err) { if (liveRef.current) setError(err instanceof Error ? err.message : String(err)) }
    finally { sendingRef.current = false; if (liveRef.current) setSending(false) }
  }
  const generating = !error && (sending || chat.busy)
  return <div className={css.embeddedChat}>
    <div ref={transcript} tabIndex={0} className={css.embeddedTranscript} aria-busy={generating} onScroll={()=>{const el=transcript.current;if(el){followBottom.current=el.scrollHeight-el.scrollTop-el.clientHeight<48;if(followBottom.current)setUnread(false)}}} aria-label={l("独立讨论记录")}>{chat.messages.map(message => <div key={message.id} data-streaming={!!message.streaming && generating} className={message.role === 'user' ? css.userMessage : css.assistantMessage}><strong>{message.role === 'user' ? l("你") : 'AI'}</strong>{message.role === 'user' ? <p>{message.text}</p> : <AssistantReply text={message.text} streaming={!!message.streaming && generating} />}</div>)}
      {loading && <p role="status">{l("正在读取讨论记录…")}</p>}{error && <p role="alert" className={css.error}>{workflowMessage(error, l)}</p>}
    </div>
    {(generating||unread)&&<div className={css.discussionStatus}>{generating && <div className={css.discussionGenerating} role="status"><span className={css.discussionLogo} aria-hidden="true"><BrandIcon size={26}/></span><span>{tail?.streaming ? l("正在回复…") : l("AI 正在思考…")}</span></div>}{unread&&<button type="button" className={css.latestReply} onClick={latest}>{l("查看最新回复")} ↓</button>}</div>}
    <form className={css.embeddedComposer} onSubmit={event => { event.preventDefault(); void send() }}><label>{l("继续讨论")}<textarea value={text} onChange={event => changeText(event.target.value)}
      onCompositionStart={() => { composingRef.current = true }} onCompositionEnd={() => { composingRef.current = false }}
      onKeyDown={event => {
        if (event.key !== 'Enter' || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey || composingRef.current || event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return
        event.preventDefault()
        if (!event.repeat) void send()
      }}
      placeholder={discussion.startsWith('task:') ? l("例如：帮我细化这个任务的要求，或分析失败原因…") : discussion.startsWith('member:') ? l("例如：让这个 Agent 更专注于需求分析…") : l("输入你想讨论的问题…")} /></label><small role={storageError ? 'alert' : undefined}>{workflowMessage(storageError,l) || [l("Enter 发送 · Shift+Enter 换行"), text ? l("草稿保存在此标签页，切换讨论或刷新可恢复。") : ""].filter(Boolean).join(" · ")}</small><button type="submit" className={css.primary} disabled={!text.trim() || loading || chat.busy || sending}>{sending ? l("发送中…") : l("发送")}</button></form>
  </div>
}
