import type {} from './supervisor-card-definition.ts'
import {useEffect,useRef,useState} from 'react'
import type {PropsRuntime,PropsLocale} from '@deepseek-ai/dsh-client-ui-slots'
import type {SessionId} from '@deepseek-ai/dsh-session/types'
import {WorkflowWorkbench} from './WorkflowWorkbench.tsx'
import type {WorkflowLauncherProps} from './WorkflowLauncher.tsx'
import css from './SuperAgent.module.css'

export function SupervisorMessage({node,sessionId,t,sessions,modelDirectories,openMember}:PropsRuntime<'conversation.chat.node','teamflow-supervisor'>&PropsLocale<'agentTeams'>&WorkflowLauncherProps){
  const card=node.data, en=t('language.code')==='en'
  const [open,setOpen]=useState(false),[error,setError]=useState(''),[asking,setAsking]=useState(false),[question,setQuestion]=useState(''),[busy,setBusy]=useState(false)
  const token=useRef<AbortController>()
  useEffect(()=>()=>token.current?.abort(),[])
  const caption=card.status==='open'?({review:en?'Review needed':'需要你验收',proposal:en?'Confirm proposal':'需要确认提案',block:en?'Input needed':'需要你介入',progress:en?'Node activity':'节点动态'})[card.item.kind]:
    ({approved:en?'Approved':'已通过',rejected:en?'Returned':'已退回',closed:en?'Closed':'已结束'})[card.status]
  async function locate(){
    token.current?.abort();const abort=new AbortController();token.current=abort
    try{const ref=sessions.retain(card.captain as SessionId,{source:'teamflowLauncher',signal:abort.signal});await ref.ready;if(!abort.signal.aborted)setOpen(true)}
    catch(e){if(!abort.signal.aborted)setError(String(e))}
  }
  async function ask(){
    if(!question.trim()||busy)return
    setBusy(true)
    try{const res=await fetch('/plugins/dsh-agent-teams/super-agent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'ask',workspaceId:card.workspaceId,sessionId,key:card.key,question})})
      if(!res.ok)throw Error((await res.json()).error)
      setAsking(false);setQuestion('');setError('')
    }catch(e){setError(String(e))}finally{setBusy(false)}
  }
  return <article className={css.chatCard} data-supervisor-card={card.key}>
    <small>Super Agent · {caption}</small><h3>{card.item.title}</h3><p>{card.project} / {card.workflow}{card.item.round?' · '+(en?'Round ':'第 ')+card.item.round+(en?'':' 轮'):''}</p>
    {card.summary&&<blockquote>{card.summary}</blockquote>}
    <button onClick={locate}>{card.item.kind==='review'?(en?'View round evidence':'查看本轮证据'):(en?'Open Workflow':'查看 Workflow')} ↗</button>
    <button onClick={()=>setAsking(!asking)}>{en?'Ask about this':'询问此事项'}</button>
    {asking&&<form onSubmit={e=>{e.preventDefault();void ask()}}><input autoFocus aria-label={en?'Question':'问题'} value={question} maxLength={4000} onChange={e=>setQuestion(e.target.value)}/><button disabled={busy||!question.trim()}>{en?'Send':'发送'}</button></form>}
    {error&&<p role="alert">{error}</p>}
    {open&&<WorkflowWorkbench initiallyOpen sessionId={card.captain} teamId={card.teamId} t={t} supervisorTarget={card.item} modelDirectory={modelDirectories.directoryFor(card.captain as SessionId)} openExecution={(id,parent)=>openMember((parent??card.captain) as SessionId,id as SessionId)} onClose={()=>{setOpen(false);token.current?.abort()}}/>}
  </article>
}
