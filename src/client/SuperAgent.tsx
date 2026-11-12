import { ConversationCard } from './SupervisorCard.tsx'
import type { SupervisorCard } from '../super-agent-card.ts'
import { BrandIcon } from './BrandIcon.tsx'
import { AssistantReply } from './EmbeddedDiscussion.tsx'
import { WorkflowLocale } from './workflow-i18n.tsx'
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type { SessionReference } from '@deepseek-ai/dsh-api-session-controller/client'
import type { SessionProviderComponent, PropsRenderFactories } from '@deepseek-ai/dsh-client-ui-slots'
import type { ReactNode } from 'react'
import type { ConversationViewsProps } from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { WorkflowLauncherProps } from './WorkflowLauncher.tsx'
import { selectedWorkflowWorkspace } from './workflow-launcher.ts'
import { WorkflowWorkbench } from './WorkflowWorkbench.tsx'
import { superAgentEntry, type SupervisorVisit } from './super-agent-navigation.ts'
import { defaultWatchKinds, watchKinds, type NodeChange, type WatchRow, type WatchItem, type WorkflowWatch, type WatchKind } from '../super-agent-watch.ts'
import css from './SuperAgent.module.css'

type Props = WorkflowLauncherProps
type HostChat = {SessionProvider?:SessionProviderComponent;renderChat?:()=>ReactNode}
const unreadChanged='teamflow:unread-changed'
const openCurrentChat='teamflow:open-current-chat'
type Transcript={latest:number;archives:{id:string;at:number}[];sessionId:string;busy:boolean;records:{seq:number;card:SupervisorCard}[];messages:{id:string;role:string;text:string}[]}

function ChatView({renderSlot}:ConversationViewsProps){return <>{renderSlot('conversation.session',{view:'chat'})}</>}
export function NativeChatBody({renderFactorySlot}:PropsRenderFactories){
  // Use DSH's bottom-docked composer from the first message onward.
  return <>{renderFactorySlot('conversation.content',{variant:'embedded',phase:'active',hero:false},{slots:{views:ChatView}})}</>
}
function NativeChat({id,sessions,SessionProvider,renderChat,en}:Props & Required<HostChat> & {id:string;en:boolean}){
  const [reference,setReference]=useState<SessionReference>(),[error,setError]=useState('')
  useEffect(()=>{
    const controller=new AbortController()
    const ref=sessions.retain(id as SessionId,{source:'teamflowLauncher',signal:controller.signal})
    void ref.ready.then(()=>{if(!controller.signal.aborted)setReference(ref)},e=>{if(!controller.signal.aborted)setError(String(e))})
    return ()=>{controller.abort();ref.release()}
  },[sessions,id])
  if(!reference)return <p role={error?'alert':'status'}>{error||(en?'Opening conversation…':'正在打开对话…')}</p>
  return <SessionProvider session={reference}>{renderChat()}</SessionProvider>
}

function GlobalConversation(props:Props & HostChat & {anchor?:string;close?:()=>void;inline?:boolean;settings?:()=>void;visible?:boolean}){
  const en=props.t('language.code')==='en'
  const [log,setLog]=useState<Transcript>(),[draft,setDraft]=useState(''),[error,setError]=useState(''),[sending,setSending]=useState(false)
  const [readError,setReadError]=useState('')
  const [archive,setArchive]=useState(''),[confirm,setConfirm]=useState(false),[generation,reload]=useState(0)
  const native=!archive&&!!props.renderChat&&!!props.SessionProvider
  const feed=useRef<HTMLDivElement>(null),input=useRef<HTMLTextAreaElement>(null)
  const stick=useRef(!props.anchor),anchored=useRef(false)
  useEffect(()=>{
    const open=()=>{if(archive){setLog(undefined);setArchive('')}setConfirm(false);stick.current=true}
    window.addEventListener(openCurrentChat,open)
    return ()=>window.removeEventListener(openCurrentChat,open)
  },[archive])
  useEffect(()=>{
    const before=document.activeElement as HTMLElement|null
    if(props.visible===false)return
    input.current?.focus()
    const controller=new AbortController()
    let timer:ReturnType<typeof setTimeout>
    let acknowledged=-1,seenSession=''
    async function refresh(){
      try{const next=await request<Transcript>('','history',{archive:archive||undefined,summaryOnly:native},controller.signal)
        if(!controller.signal.aborted){
          setLog(next)
          const displayedId=feed.current?.querySelector<HTMLElement>('[data-conversation-session]')?.dataset.conversationSession
          if(!archive && !document.hidden && feed.current?.getClientRects().length && (!native||displayedId===next.sessionId) && (seenSession!==next.sessionId || next.latest>acknowledged)){
            const result=await request<{count:number}>('','seen',{sessionId:next.sessionId,through:next.latest},controller.signal)
            seenSession=next.sessionId;acknowledged=next.latest
            window.dispatchEvent(new CustomEvent(unreadChanged,{detail:result.count}))
          }
          setReadError('')
        }
      }catch(e){if(!controller.signal.aborted)setReadError(String(e))}
      finally{if(!controller.signal.aborted)timer=setTimeout(refresh,1200)}
    }
    void refresh()
    return ()=>{controller.abort();clearTimeout(timer);before?.focus()}
  },[archive,generation,props.visible,native])
  useEffect(()=>{
    if(!feed.current)return
    if(props.anchor&&!anchored.current){
      const card=Array.from(feed.current.querySelectorAll<HTMLElement>('[data-supervisor-card]')).find(el=>el.dataset.supervisorCard===props.anchor)
      if(card){card.scrollIntoView({block:'center'});anchored.current=true}
    }else if(!native&&stick.current)feed.current.scrollTop=feed.current.scrollHeight
  },[log,props.anchor,native])
  async function send(){
    if(sending||!draft.trim())return
    setSending(true);setError('')
    try{await request('','send',{question:draft,sessionId:log?.sessionId});setDraft('');stick.current=true}
    catch(e){setError(String(e))}finally{setSending(false)}
  }
  const entries=!native&&log?[...log.messages.map(m=>({seq:Number(m.id),view:<div className={css.chatLine} data-role={m.role}><b>{m.role==='user'?(en?'You':'你'):'Super Agent'}</b>{m.role==='user'?m.text:<AssistantReply text={m.text} streaming={false}/>}</div>})),
    ...log.records.map(r=>({seq:r.seq,view:<ConversationCard {...props} archived={!!archive} sessionId={log.sessionId} card={r.card}/>}))].sort((a,b)=>a.seq-b.seq):[]
  return <div className={props.inline?css.chatPage:css.dialogShade}><section className={css.globalChat} role={props.inline?'region':'dialog'} aria-modal={props.inline?undefined:true} aria-label={en?'Global conversation':'全局对话'}>
    <header><BrandIcon/><h2>Super Agent · {en?'Global conversation':'全局对话'}</h2>{props.settings&&<button className={css.watchSettingsButton} onClick={props.settings}>{en?'Watch settings':'监听设置'}</button>}
      {!!log?.archives.length&&<select aria-label={en?'Conversation history':'对话历史'} value={archive} onChange={e=>{setArchive(e.target.value);setLog(undefined)}}><option value="">{en?'Current conversation':'当前对话'}</option>{log.archives.map((a,i)=><option key={a.id} value={a.id}>{en?'History':'历史对话'} {i+1}</option>)}</select>}
      {!archive&&<button disabled={!log} onClick={()=>setConfirm(true)}>{en?'Clear context':'清除上下文'}</button>}
      {!archive&&!native&&log&&<button onClick={async()=>{const id=log.sessionId as SessionId;try{props.close?.();await props.openMember(id,id)}catch(e){setError(String(e))}}}>{en?'Open in DSH chat':'在 DSH 对话中打开'}</button>}
      {props.close&&<button onClick={props.close}>{en?'Close':'关闭'}</button>}</header>
    {confirm&&<div className={css.resetPrompt}><p>{en?'Start a fresh conversation? History, subscriptions and running workflows are retained.':'开始一段新对话？旧聊天可在历史中查看，订阅和运行中的流程会保留。'}</p>
      <button onClick={()=>setConfirm(false)}>{en?'Cancel':'取消'}</button>
      <button onClick={async()=>{try{await request('','reset',{sessionId:log?.sessionId});setLog(undefined);setDraft('');setConfirm(false);reload(n=>n+1)}catch(e){setError(String(e))}}}>{en?'Start fresh':'确认清除'}</button></div>}
    {native?<div className={css.nativeChat} ref={feed}>{log&&props.visible!==false&&<NativeChat key={log.sessionId} {...props} SessionProvider={props.SessionProvider!} renderChat={props.renderChat!} id={log.sessionId} en={en}/>}</div>:<div className={css.chatHistory} ref={feed} onScroll={e=>{const el=e.currentTarget;stick.current=el.scrollHeight-el.scrollTop-el.clientHeight<80}}>
      {!entries.length&&<p>{!log?(en?'Loading…':'正在读取…'):(en?'Ask about watched workflows across your projects.':'可以在这里询问各项目中已监听的流程。')}</p>}
      <WorkflowLocale t={props.t}>{entries.map(e=><div key={e.seq}>{e.view}</div>)}</WorkflowLocale>
      {log?.busy&&<small role="status">{en?'Super Agent is responding…':'Super Agent 正在回复…'}</small>}
    </div>}
    {(error||readError)&&<p role="alert">{error||readError}</p>}
    {!archive&&!native&&<form onSubmit={e=>{e.preventDefault();void send()}}><textarea ref={input} aria-label={en?'Message':'消息'} placeholder={en?'Message Super Agent':'给 Super Agent 发消息'} value={draft} maxLength={4000} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();void send()}}}/><button disabled={!log||sending||!draft.trim()}>{en?'Send':'发送'}</button></form>}
  </section></div>
}
const changed = 'teamflow:watch-settings-changed'
const workspaceChoiceEvent = 'teamflow:super-agent-workspace'
let chosenWorkspace=''
const attentionEvent = 'teamflow:super-agent-attention'
type Attention = { workspaceId:string; rows:WatchRow[] }
async function request<T>(workspaceId:string, action:string, fields:Record<string,unknown>={}, signal?:AbortSignal):Promise<T> {
  const response=await fetch('/plugins/dsh-agent-teams/super-agent',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({action,workspaceId,...fields}),signal:signal??AbortSignal.timeout(12000)})
  const value=await response.json()
  if(!response.ok)throw new Error(value.error??String(response.status))
  return value
}

function progressText(change:NodeChange,en:boolean){
  const state=en?{started:'Started',completed:'Completed',cancelled:'Cancelled',failed:'Failed'}:{started:'开始执行',completed:'已完成',cancelled:'已取消',failed:'失败'}
  const parent=change.inputs.join(en?', ':'、')
  return (parent?(en?'Completed '+parent:'已完成 '+parent)+' → ':'')+change.title+' · '+state[change.status]
}

function useWorkspace(props:Props, owner?:string) {
  const spaces=props.workspaces.list, sessions=props.sessions.list
  const workspaces=useSyncExternalStore(fn=>spaces.subscribe(fn),()=>spaces.getSnapshot()).items
  const list=useSyncExternalStore(fn=>sessions.subscribe(fn),()=>sessions.getSnapshot())
  const choice=useSyncExternalStore(listener=>{
    window.addEventListener(workspaceChoiceEvent,listener)
    return ()=>window.removeEventListener(workspaceChoiceEvent,listener)
  },()=>chosenWorkspace)
  function choose(id:string){chosenWorkspace=id;window.dispatchEvent(new Event(workspaceChoiceEvent))}
  const selected=owner ? workspaces.find(w=>w.sessionIds.includes(owner as SessionId))??workspaces.find(w=>w.workspaceId===choice)
    : workspaces.find(w=>w.workspaceId===choice)??selectedWorkflowWorkspace(workspaces,list)??(workspaces.length===1?workspaces[0]:undefined)
  return {workspaces,selected,choose,sessionRows:list.byId}
}

type WatchView<T> = {rows:T[]; error?:string;missingWorkspace?:boolean}
type Feed<T> = {subscribe:(fn:()=>void)=>()=>void; read:()=>WatchView<T>|undefined}
const feeds=new Map<string,Feed<WatchRow>>()
const emptyFeed:Feed<WatchRow>={subscribe:()=>()=>{},read:()=>undefined}

/** The icon, panel and transient visits share one scoped read and one timer. */
function createFeed<T>(workspaceId:string,action:'catalog'|'overview'|'subscriptions',onActive?:(active:boolean)=>void):Feed<T> {
  const listeners=new Set<()=>void>()
  let data:WatchView<T>|undefined, pending:AbortController|undefined, timer:ReturnType<typeof setTimeout>
  async function refresh(){
    clearTimeout(timer)
    pending?.abort()
    const current=new AbortController()
    pending=current
    try {
      const value=await request<WatchView<T>>(workspaceId,action,{},AbortSignal.any([current.signal,AbortSignal.timeout(12000)]))
      if(current.signal.aborted)return
      data=value
    } catch(error){
      if(current.signal.aborted)return
      data={rows:data?.rows??[],error:String(error)}
    }
    for(const notify of listeners)notify()
    if(listeners.size&&action!=='catalog')timer=setTimeout(refresh,data.rows.length||action==='subscriptions'?6000:60000)
  }
  return {read:()=>data,subscribe(fn){
    listeners.add(fn)
    if(listeners.size===1){
      onActive?.(true)
      window.addEventListener(changed,refresh)
      void refresh()
    }
    return ()=>{
      listeners.delete(fn)
      if(listeners.size)return
      pending?.abort()
      clearTimeout(timer)
      window.removeEventListener(changed,refresh)
      data=undefined
      onActive?.(false)
    }
  }}
}
function workspaceFeed(workspaceId:string,catalog:boolean):Feed<WatchRow> {
  const key=JSON.stringify([workspaceId,catalog])
  const existing=feeds.get(key)
  if(existing)return existing
  const feed=createFeed<WatchRow>(workspaceId,catalog?'catalog':'overview',active=>{
    if(active)feeds.set(key,feed)
    else if(feeds.get(key)===feed)feeds.delete(key)
  })
  feeds.set(key,feed)
  return feed
}
function useRows(workspaceId:string|undefined,catalog:boolean) {
  const feed=useMemo(()=>workspaceId?workspaceFeed(workspaceId,catalog):emptyFeed,[workspaceId,catalog])
  return useSyncExternalStore(feed.subscribe,feed.read,feed.read)
}

export function SuperAgentIcon(props:Props & {size:number}) {
  const icon=useRef<HTMLSpanElement>(null)
  const {selected}=useWorkspace(props)
  const status=useRows(selected?.workspaceId,false)
  const [count,setCount]=useState(0)
  useEffect(()=>{
    const controller=new AbortController()
    const entry=icon.current?.closest('button,[role="button"],a')
    const open=()=>window.dispatchEvent(new Event(openCurrentChat))
    entry?.addEventListener('click',open)
    let timer:ReturnType<typeof setTimeout>,version=0
    async function refresh(){
      const at=version
      try{const value=await request<{count:number}>('','unread',{},controller.signal);if(!controller.signal.aborted&&at===version)setCount(value.count)}
      catch{/* Keep last known count while reconnecting. */}
      finally{if(!controller.signal.aborted)timer=setTimeout(refresh,2000)}
    }
    const seen=(e:Event)=>{version++;setCount((e as CustomEvent<number>).detail)}
    window.addEventListener(unreadChanged,seen);void refresh()
    return ()=>{controller.abort();clearTimeout(timer);entry?.removeEventListener('click',open);window.removeEventListener(unreadChanged,seen)}
  },[])
  useEffect(()=>{
    if(selected && status && !status.error)window.dispatchEvent(new CustomEvent<Attention>(attentionEvent,{detail:{workspaceId:selected.workspaceId,rows:status.rows}}))
  },[selected?.workspaceId,status])
  return <span ref={icon} className={css.icon} role="status" aria-label={'Super Agent · '+count+(props.t('language.code')==='en'?' unread':' 条未读')}>
    <svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><ellipse cx="12" cy="12" rx="10" ry="5" transform="rotate(-35 12 12)"/><circle cx="12" cy="12" r="3"/><circle cx="18" cy="5" r="1.5" fill="currentColor"/></svg>
    {count>0&&<b>{count>99?'99+':count}</b>}</span>
}

export function SuperAgentOverlay(props:Props & HostChat) {
  const [visit,setVisit]=useState<SupervisorVisit>()
  const [notice,setNotice]=useState<{workspaceId:string;row:WatchRow;item:WatchItem;count:number;progress?:NodeChange}>()
  const seen=useRef(new Map<string,Set<string>>())
  const [chat,setChat]=useState<{key?:string}>()
  useEffect(()=>{
    const open=()=>setChat({})
    window.addEventListener('teamflow:global-chat',open)
    return ()=>window.removeEventListener('teamflow:global-chat',open)
  },[])
  function openNotice(){
    if(!notice)return
    setChat({key:JSON.stringify([notice.workspaceId,notice.row.teamId,notice.progress?'progress':notice.item.id])})
    setNotice(undefined)
  }
  useEffect(()=>{
    const open=(event:Event)=>{event.preventDefault();setVisit((event as CustomEvent<SupervisorVisit>).detail)}
    const onAttention=(event:Event)=>{
      const {workspaceId,rows}=(event as CustomEvent<Attention>).detail
      const storage='teamflow:attention:'+workspaceId
      let previous=seen.current.get(workspaceId)??new Set<string>()
      try{
        const stored=JSON.parse(localStorage.getItem(storage)??'null')
        if(Array.isArray(stored))previous=new Set(stored.filter(id=>typeof id==='string'))
      }catch{/* fall back to this mounted view */}
      const active=new Set<string>()
      let first:typeof notice
      for(const row of rows)for(const item of row.items){
        const id=JSON.stringify([row.teamId,item.id])
        active.add(id)
        if(!previous.has(id)){
          if(first)first.count++
          else first={workspaceId,row,item,count:1}
        }
      }
      for(const row of rows)for(const change of [...row.progress??[]].reverse()){
        const id=JSON.stringify([row.teamId,change.id])
        active.add(id)
        if(!previous.has(id)&&!first)first={workspaceId,row,item:{kind:'progress',id:change.id,title:change.title,taskId:change.taskId},count:1,progress:change}
      }
      seen.current.set(workspaceId,active)
      try{
        if(active.size)localStorage.setItem(storage,JSON.stringify([...active]))
        else localStorage.removeItem(storage)
      }catch{/* optional browser receipt storage */}
      setNotice(old=>first??(old?.workspaceId===workspaceId && active.has(JSON.stringify([old.row.teamId,old.item.id]))?old:undefined))
    }
    window.addEventListener(superAgentEntry,open)
    window.addEventListener(attentionEvent,onAttention)
    return ()=>{window.removeEventListener(superAgentEntry,open);window.removeEventListener(attentionEvent,onAttention)}
  },[])
  if(chat)return createPortal(<GlobalConversation {...props} anchor={chat.key} close={()=>setChat(undefined)}/>,document.body)
  if(!visit){
    if(!notice)return null
    const en=props.t('language.code')==='en'
    return createPortal(<aside className={css.notice} role="status"><b>Super Agent</b><span>{notice.row.name} › {notice.progress?progressText(notice.progress,en):notice.item.title}{notice.count>1?' +'+(notice.count-1):''}</span>
      <button onClick={openNotice}>{en?'Open conversation card':'查看对话卡片'}</button>
      <button aria-label={en?'Dismiss reminder':'收起提醒'} onClick={()=>setNotice(undefined)}>×</button></aside>,document.body)
  }
  const back=()=>{setVisit(undefined);visit.returnToWorkflow()}
  return createPortal(<div className={css.overlay} role="dialog" aria-modal="true" aria-label="Super Agent"><SuperAgentPanel {...props} visit={visit} back={back}/></div>,document.body)
}

type Subscription=Pick<WatchRow,'teamId'|'captainSessionId'|'name'|'conversationTitle'> & {workspaceId:string;project:string;watch:WorkflowWatch}
const subscriptions=createFeed<Subscription>('','subscriptions')
type SessionRows=ReturnType<typeof useWorkspace>['sessionRows']
function conversationName(row:Pick<WatchRow,'conversationTitle'|'captainSessionId'>,sessions:SessionRows,en:boolean){
  return row.conversationTitle?.trim()||sessions[row.captainSessionId as SessionId]?.title?.trim()||(en?'Untitled conversation':'未命名对话')
}
function watchKindLabel(kind:WatchKind,en:boolean){
  return (en?{review:'Human review',proposal:'Pending proposal',block:'Human intervention',progress:'Node progress'}:
    {review:'人工验收',proposal:'待确认提案',block:'人工介入',progress:'节点状态变化'})[kind]
}
function WatchedWorkflows({en,sessions,onEdit}:{en:boolean;sessions:SessionRows;onEdit:(workspaceId:string,teamId:string)=>void}){
  const view=useSyncExternalStore(subscriptions.subscribe,subscriptions.read,subscriptions.read)
  return <section className={css.watched} aria-label={en?'Watched workflows':'正在监听的流程'}>
    <h2>{en?'Watched workflows':'正在监听的流程'} {view&&!view.error&&<small>{view.rows.length}</small>}</h2>
    {!view?<p role="status">{en?'Loading subscriptions…':'正在读取监听范围…'}</p>:<>
      {view.error&&<p role="alert">{en?'Could not refresh subscriptions.':'监听列表刷新失败。'} <button onClick={()=>window.dispatchEvent(new Event(changed))}>{en?'Retry':'重试'}</button></p>}
      {!view.error&&!view.rows.length&&<p>{en?'No subscriptions. Choose a project and workflow below to start watching.':'尚未监听任何流程。可在下方选择项目和流程，开启监听。'}</p>}
      <ul>{view.rows.map(r=>{
        const chat=conversationName(r,sessions,en)
        const duplicate=view.rows.some(other=>other!==r&&other.project===r.project&&other.name===r.name&&conversationName(other,sessions,en)===chat)
        return <li key={JSON.stringify([r.workspaceId,r.teamId])}><button onClick={()=>onEdit(r.workspaceId,r.teamId)}>
          <span><small>{r.project} / {chat}</small><strong>{r.name}</strong>{duplicate&&<small>{r.workspaceId} / {r.teamId}</small>}</span>
          <span className={css.watchKinds}>{r.watch.kinds.map(k=>watchKindLabel(k,en)).join(' · ')||(en?'No alerts selected':'未选择提醒类型')}</span>
          <span aria-hidden="true">›</span></button></li>
      })}</ul></>}
  </section>
}

export function SuperAgentPanel(props:Props & HostChat & {visit?:SupervisorVisit;back?:()=>void}) {
  const [settings,setSettings]=useState(false)
  const [editing,setEditing]=useState(true)
  const [selection,setSelection]=useState({workspaceId:props.visit?.workspaceId,teamId:props.visit?.teamId??''})
  const editor=useRef<HTMLDivElement>(null)
  useEffect(()=>{
    const open=()=>setSettings(false)
    window.addEventListener(openCurrentChat,open)
    return ()=>window.removeEventListener(openCurrentChat,open)
  },[])
  const picker=useWorkspace(props,props.visit?.sessionId)
  const {workspaces,choose}=picker
  const selected=workspaces.find(w=>w.workspaceId===selection.workspaceId)??picker.selected
  const en=props.t('language.code')==='en'
  return <><div hidden={settings} className={css.chatPage}><GlobalConversation {...props} inline visible={!settings} settings={()=>{setEditing(true);setSettings(true)}} close={props.back}/></div>{settings&&<main className={css.panel}>
    <header className={css.hero}><div className={css.identity}><span className={css.mark}><BrandIcon size={36}/></span><div><small>Super Agent</small><h1>{en?'Watch settings':'监听设置'}</h1></div></div>
      <button onClick={()=>setSettings(false)}>{en?'Back to chat':'返回对话'}</button>
      {props.back&&<button onClick={props.back}>{props.visit?.workspaceId?(en?'Close':'关闭'):(en?'Back to Workflow':'返回原工作台')}</button>}
    </header>
    <div className={css.content}>
      <WatchedWorkflows en={en} sessions={picker.sessionRows} onEdit={(workspaceId,teamId)=>{
        setSelection({workspaceId,teamId});setEditing(true);requestAnimationFrame(()=>editor.current?.focus())
      }}/>
      <div ref={editor} tabIndex={-1} className={css.projectBar}><label>{en?'Project':'项目'} <select aria-label={en?'Workspace':'工作区'} value={selected?.workspaceId??''} onChange={e=>{choose(e.target.value);setSelection({workspaceId:e.target.value,teamId:''})}}>
        <option value="" disabled>{en?'Choose a workspace':'选择工作区'}</option>
        {workspaces.map(w=><option key={w.workspaceId} value={w.workspaceId}>{w.title}</option>)}</select></label>
        {selected&&<button onClick={()=>setEditing(!editing)}>{editing?(en?'Project overview':'项目概览'):(en?'Configure workflow':'配置流程')}</button>}
      </div>
      {selected?<WorkspacePanel key={selected.workspaceId} {...props} workspaceId={selected.workspaceId} project={selected.title} sessionRows={picker.sessionRows} en={en} settings={editing} setSettings={setEditing} selection={selection.teamId} select={teamId=>setSelection({workspaceId:selected.workspaceId,teamId})}/>:<p>{en?'Select a project to configure workflows.':'请选择项目以配置流程。'}</p>}
    </div>
  </main>}</>
}

function WorkspacePanel({workspaceId,project,sessionRows,en,settings,setSettings,selection,select,sessions,modelDirectories,t,openMember}:Props & {workspaceId:string;project:string;sessionRows:SessionRows;en:boolean;settings:boolean;setSettings:(value:boolean)=>void;selection:string;select:(id:string)=>void}) {
  const result=useRows(workspaceId,settings)
  const [busy,setBusy]=useState(false),[error,setError]=useState('')
  const [target,setTarget]=useState<{row:WatchRow;item:WatchItem}>()
  const handle=useRef<ReturnType<typeof sessions.retain>>()
  const life=useRef<AbortController>()
  const focus=useRef<HTMLElement|null>(null)
  useEffect(()=>{const token=new AbortController();life.current=token;return ()=>{token.abort();handle.current?.release()}},[])
  const rows=result?.rows??[], row=rows.find(r=>r.teamId===selection)??rows[0]
  const watching=rows.filter(r=>r.watch)
  const items=watching.flatMap(r=>r.items.map(item=>({row:r,item})))
  const label=(zh:string,english:string)=>en?english:zh
  const kindLabel=(kind:WatchKind)=>watchKindLabel(kind,en)
  const identity=(r:WatchRow)=>{
    const title=conversationName(r,sessionRows,en)
    return [project,title,...(r.name!==title?[r.name]:[])].join(' / ')
  }
  const progress=watching.flatMap(r=>(r.progress??[]).map(change=>({r,change}))).sort((a,b)=>b.change.at-a.change.at)
  const itemLabel=(item:WatchItem)=>item.reason?({
    configuration:label('需要补全配置','Configuration needed'),rerun:label('待确认重跑','Rerun needs confirmation'),
    rejected:label('验收已退回，待处理','Review returned for revision'),'loop-paused':label('循环暂停，待人工处理','Loop paused for intervention'),
  })[item.reason]:kindLabel(item.kind)
  async function run(fn:(signal:AbortSignal)=>Promise<void>){
    if(busy||!life.current)return
    const signal=life.current.signal
    setBusy(true);setError('')
    try{await fn(signal)}catch(e){if(!signal.aborted)setError(String(e))}
    finally{if(!signal.aborted)setBusy(false)}
  }
  function save(watch:WorkflowWatch|null){
    if(!row)return
    void run(async signal=>{
      try{await request(workspaceId,'set',{teamId:row.teamId,previous:row.watch??null,watch},signal)}
      finally{window.dispatchEvent(new Event(changed))}
    })
  }
  function locate(r:WatchRow,item:WatchItem){
    focus.current=document.activeElement as HTMLElement
    void run(async signal=>{
      handle.current?.release()
      const ref=sessions.retain(r.captainSessionId as SessionId,{source:'teamflowLauncher',signal})
      handle.current=ref
      try{await ref.ready;signal.throwIfAborted();setTarget({row:r,item})}
      catch(e){ref.release();handle.current=undefined;throw e}
    })
  }
  function close(){setTarget(undefined);handle.current?.release();handle.current=undefined;window.dispatchEvent(new Event(changed));requestAnimationFrame(()=>focus.current?.focus())}
  return <section aria-busy={busy}>
    {(error||result?.error)&&<p role="alert">{error||result?.error} <button onClick={()=>window.dispatchEvent(new Event(changed))}>{label('刷新','Refresh')}</button></p>}
    {!result?<p role="status">{label('正在读取…','Loading…')}</p>:result.missingWorkspace?<p>{label('此项目已不在工作区列表中，请选择其他项目。','This project is no longer in the workspace list. Choose another project.')}</p>:settings?<div className={css.settings}><h2>{label('配置流程','Configure workflow')}</h2>
      {row?<><label>{label('选择流程','Workflow')} <select value={row.teamId} disabled={busy} onChange={e=>select(e.target.value)}>{rows.map(r=><option value={r.teamId} key={r.teamId}>{identity(r)}{rows.some(other=>other.teamId!==r.teamId&&identity(other)===identity(r))?' · '+r.teamId:''}</option>)}</select></label>
        <div className={css.row}><span>{row.watch?label('正在监听','Watching'):label('未监听','Not watched')}{row.complete?' · '+label('已完成','Completed'):''}</span>
          <button disabled={busy} onClick={()=>save(row.watch?null:{kinds:[...defaultWatchKinds],keep:row.complete})}>{row.watch?label('取消监听','Unsubscribe'):row.complete?label('监听后续重开','Watch future reopens'):label('监听此流程','Watch workflow')}</button></div>
        <fieldset disabled={busy||!row.watch}><legend>{label('需要提醒我的事项','Notify me about')}</legend>
          {watchKinds.map(kind=><label key={kind}><input type="checkbox" checked={row.watch?.kinds.includes(kind)??false} onChange={e=>row.watch&&save({...row.watch,kinds:e.target.checked?[...row.watch.kinds,kind]:row.watch.kinds.filter(k=>k!==kind)})}/>{kindLabel(kind)}</label>)}</fieldset>
        <label><input type="checkbox" disabled={busy||!row.watch} checked={row.watch?.keep??false} onChange={e=>row.watch&&save(row.complete&&!e.target.checked?null:{...row.watch,keep:e.target.checked})}/>{label('整个流程完成后继续监听','Keep watching after workflow completion')}</label></>:<p>{label('此工作区没有可选流程。','No workflows in this workspace.')}</p>}</div>:<div className={css.columns}><section className={css.queue}>
      <h2>{label('待你处理','Needs you')} <small>{items.length}</small></h2>
      {items.map(({row:r,item})=><div className={css.row} key={r.teamId+':'+item.id}><div><small>{identity(r)}</small><b>{item.title}</b><small className={css.status}>{itemLabel(item)}{item.round!==undefined?' · '+label('第 '+item.round+' 轮','Round '+item.round):''}</small></div>
        <button disabled={busy} onClick={()=>locate(r,item)}>{item.kind==='review'?label('查看本轮证据','Review evidence'):item.kind==='proposal'?label('查看提案','View proposal'):label('定位节点','Locate node')} ↗</button></div>)}
      {!items.length&&<p>{watching.length?label('已监听流程暂无待处理事项。','No pending items in watched workflows.'):label('尚未监听任何流程。打开监听设置，选择需要关注的流程。','No workflows watched. Choose workflows in Watch settings.')}</p>}
      {watching.some(r=>r.watch?.kinds.includes('progress'))&&<><h2>{label('节点动态','Node activity')}</h2>
        {!progress.length&&<p>{label('开启后发生的节点变化会显示在这里。','Node changes will appear here after subscribing.')}</p>}
        {progress.slice(0,40).map(({r,change})=><div className={css.row} key={change.id}><div><small>{identity(r)} · {new Date(change.at).toLocaleTimeString()}</small>{progressText(change,en)}</div>
          <button disabled={busy} onClick={()=>locate(r,{kind:'progress',title:change.title,taskId:change.taskId,id:change.id})}>{label('定位节点','Locate node')} ↗</button></div>)}</>}
      </section><aside className={css.scope}><h2>{label('监听范围','Watched workflows')} <small>{watching.length}</small></h2>{!watching.length&&<p>{label('尚未订阅流程','No subscriptions')}</p>}{watching.map(r=><button key={r.teamId} onClick={()=>{select(r.teamId);setSettings(true)}}><span>{identity(r)}</span><small>{r.watch?.kinds.map(kindLabel).join(' · ')}</small></button>)}</aside>
    </div>}
    {target&&<WorkflowWorkbench initiallyOpen sessionId={target.row.captainSessionId} teamId={target.row.teamId} supervisorTarget={target.item} onClose={close}
      t={t} modelDirectory={modelDirectories.directoryFor(target.row.captainSessionId as SessionId)} openExecution={(id,parent)=>openMember((parent??target.row.captainSessionId) as SessionId,id as SessionId)}/>}
  </section>
}
