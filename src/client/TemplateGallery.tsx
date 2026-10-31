import { useEffect, useRef, useState } from 'react'
import { isBuiltinTemplate } from '../templates.ts'
import type { TeamState } from '../types.ts'
import type { TemplateDefinition, TemplateVersion } from '../templates.ts'
import { briefText, type TaskBrief } from '../task-layers.ts'
import { arrangeTasks } from './workflow-layout.ts'
import { BrandIcon } from './BrandIcon.tsx'
import { EmbeddedDiscussion } from './EmbeddedDiscussion.tsx'
import css from './TemplateGallery.module.css'

async function api(sessionId:string,action:string,fields:Record<string,unknown>={}){
  const response=await fetch('/plugins/dsh-agent-teams/workflow',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({sessionId,action,...fields})})
  const result=await response.json()
  if(!response.ok)throw new Error(result.error??`HTTP ${response.status}`)
  return result
}
function MiniFlow({template,large=false}:{template:TemplateDefinition;large?:boolean}){
  const layout=arrangeTasks(template.tasks), points=template.tasks.map(t=>({task:t,p:{x:(layout[t.id]?.x??0)*.55,y:(layout[t.id]?.y??0)*.55}}))
  const width=Math.max(320,...points.map(({p})=>p.x+110)),height=Math.max(100,...points.map(({p})=>p.y+80))
  return <svg className={large?css.flowLarge:css.flow} viewBox={`-15 -15 ${width+30} ${height+30}`} role="img" aria-label={`流程预览，${template.tasks.length} 个节点`}>
    {points.flatMap(({task,p})=>task.dependencies.map(id=>{const start=points.find(item=>item.task.id===id)?.p;return start?<path key={`${id}:${task.id}`} d={`M${start.x+100},${start.y+30} C${start.x+160},${start.y+30} ${p.x-50},${p.y+30} ${p.x},${p.y+30}`} fill="none" stroke="currentColor" strokeWidth="3" opacity=".3"/>:null}))}
    {points.map(({task,p})=><g key={task.id}><rect x={p.x} y={p.y} width="100" height="60" rx="14" fill={task.checkpoint?'#f6c66c':'currentColor'} opacity={task.checkpoint?0.6:0.15}/><circle cx={p.x+17} cy={p.y+30} r="5" fill="currentColor"/><text x={p.x+30} y={p.y+34} fontSize="12" fill="currentColor">{task.subject.slice(0,5)}</text></g>)}
  </svg>
}
export function TemplateGallery({sessionId,team,archived=false,mode='browse',onApply,onBack}:{sessionId:string;team?:TeamState;archived?:boolean;mode?:'browse'|'save';onApply:(template:TemplateVersion,name:string,goal:string)=>Promise<void>;onBack:()=>void}){
  const [templates,setTemplates]=useState<TemplateVersion[]>([]),[warnings,setWarnings]=useState<string[]>([])
  const [search,setSearch]=useState(''),[tag,setTag]=useState(''),[selected,setSelected]=useState<TemplateVersion>()
  const [draft,setDraft]=useState<TemplateDefinition>(),[previous,setPrevious]=useState<{id:string;version:number}>()
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[goal,setGoal]=useState(''),[name,setName]=useState('')
  const [extracting,setExtracting]=useState(false),[aiDraft,setAiDraft]=useState<TemplateDefinition>(),[deleteId,setDeleteId]=useState('')
  const alive=useRef(true)
  useEffect(()=>{alive.current=true;return()=>{alive.current=false}},[])
  async function refresh(){const result=await api(sessionId,'template_list');if(alive.current){setTemplates(result.templates);setWarnings(result.warnings);setGoal(current=>current||result.context||'')}}
  async function run(action:()=>Promise<void>){setBusy(true);setError('');setNotice('');try{await action()}catch(e){if(alive.current)setError(e instanceof Error?e.message:String(e))}finally{if(alive.current)setBusy(false)}}
  useEffect(()=>{void run(async()=>{await refresh();if(mode==='save'&&team){const result=await api(sessionId,'template_seed',{teamId:team.id});if(alive.current)setDraft(result.definition)}})},[sessionId,mode,team?.id])
  useEffect(()=>{
    if(!extracting||!team)return
    let live=true
    const poll=()=>{void api(sessionId,'state',{teamId:team.id}).then(result=>{const candidate=result.team?.workflow?.discussions?.['discussion:template']?.templateDraft;if(live&&candidate){if(candidate.base===result.base)setAiDraft(candidate.definition);else setError('源流程已变化，请重新讨论后生成模板草稿。')}}).catch(e=>{if(live)setError(String(e))})}
    poll();const timer=setInterval(poll,2500);return()=>{live=false;clearInterval(timer)}
  },[extracting,team?.id,sessionId])
  function choose(item:TemplateVersion){setSelected(item);setName(item.name);setDeleteId('');setError('')}
  const tags=[...new Set(templates.flatMap(t=>t.tags))]
  const filtered=templates.filter(t=>(!tag||t.tags.includes(tag))&&`${t.name} ${t.description} ${t.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase()))
  function briefEditor(value:TaskBrief,change:(v:TaskBrief)=>void){return <><label>通用任务要求<textarea value={value.requirements} maxLength={16000} onChange={e=>change({...value,requirements:e.target.value})}/></label><details><summary>交付物与验收要求</summary><label>通用交付物<textarea value={value.deliverables} maxLength={16000} onChange={e=>change({...value,deliverables:e.target.value})}/></label><label>通用验收要求<textarea value={value.acceptance} maxLength={16000} onChange={e=>change({...value,acceptance:e.target.value})}/></label></details></>}
  return <section className={css.gallery} aria-label="流程模板库">
    <header className={css.hero}><div className={css.heroIcon}><BrandIcon name="gallery" size={38}/></div><div><small>MY TEAMFLOW GALLERY</small><h2>{draft?'编辑流程模板':'流程模板库'}</h2><p>留下有效的方法，让下一次协作从这里开始。</p></div><button onClick={onBack} disabled={busy}>返回当前流程</button></header>
    {error&&<p className={css.warning} role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}{warnings.map(w=><p key={w} role="alert">{w}</p>)}
    {draft?<div className={css.editorGrid}><div className={css.definition}>
      <div className={css.actions}><button onClick={()=>{setDraft(undefined);setExtracting(false);setPrevious(undefined)}} disabled={busy}>返回模板库</button>{mode==='save'&&team&&!archived&&<button disabled={busy} onClick={()=>void run(async()=>{await api(sessionId,'open_discussion',{teamId:team.id,discussion:'template'});setExtracting(true)})}>AI 提炼通用流程</button>}{aiDraft&&<button onClick={()=>{setDraft(structuredClone(aiDraft));setNotice('已载入 AI 草稿，请检查通用要求和成员指令。')}}>载入 AI 草稿</button>}</div>
      <p className={css.muted}>保存成员、通用任务、连线和人工检查点。具体任务、结果、审批、模型路由和旧会话不进入模板。</p>
      <label>模板名称<input value={draft.name} maxLength={120} onChange={e=>setDraft({...draft,name:e.target.value})}/></label>
      <label>适用说明<textarea value={draft.description} maxLength={2000} onChange={e=>setDraft({...draft,description:e.target.value})}/></label>
      <label>标签（逗号分隔）<input key={draft.tags.join('，')} defaultValue={draft.tags.join('，')} onBlur={e=>setDraft({...draft,tags:e.target.value.split(/[,，]/).map(s=>s.trim()).filter(Boolean)})}/></label>
      <label>应用前需要提供的信息<textarea value={draft.inputs} maxLength={4000} onChange={e=>setDraft({...draft,inputs:e.target.value})}/></label>
      <MiniFlow template={draft} large/>
      <h3>成员通用职责</h3>{draft.members.map((m,i)=><details key={m.name}><summary>{m.name} · {m.summary}</summary>{(['summary','role','executionPrompt'] as const).map(key=><label key={key}>{key==='summary'?'职责概述':key==='role'?'长期职责':'通用执行指令 / PE'}<textarea value={m[key]} maxLength={16000} onChange={e=>setDraft({...draft,members:draft.members.map((member,index)=>index===i?{...member,[key]:e.target.value}:member)})}/></label>)}</details>)}
      <h3>节点通用任务</h3>{draft.tasks.map((t,i)=><details key={t.id} open={!t.general.requirements}><summary>{t.checkpoint?'人工检查':'任务'} · {t.subject}</summary><label>通用节点名称<input value={t.subject} maxLength={200} onChange={e=>setDraft({...draft,tasks:draft.tasks.map((task,index)=>index===i?{...task,subject:e.target.value}:task)})}/></label>
        {briefEditor(t.general,general=>setDraft({...draft,tasks:draft.tasks.map((task,index)=>index===i?{...task,general}:task)}))}
        {mode==='save'&&team?.tasks.find(task=>task.id===t.id)?.description&&<details><summary>原任务（仅用于对照）</summary><p>{team.tasks.find(task=>task.id===t.id)?.description}</p></details>}
      </details>)}
      <div className={css.actions}>{mode==='save'&&team?.workflow?.templateSource&&!isBuiltinTemplate(team.workflow.templateSource.id)&&!previous&&<button disabled={busy} onClick={()=>setPrevious({id:team.workflow!.templateSource!.id,version:team.workflow!.templateSource!.version})}>作为来源模板的新版本</button>}<button className={css.primary} disabled={busy||!draft.name.trim()||draft.tasks.some(t=>!t.general.requirements.trim())} onClick={()=>void run(async()=>{const saved=await api(sessionId,'template_save',{definition:draft,...previous?{templateId:previous.id,version:previous.version}:{}});setDraft(undefined);setExtracting(false);setPrevious(undefined);await refresh();setNotice(`已保存「${saved.template.name}」v${saved.template.version}`)})}><BrandIcon name="save"/>{busy?'处理中…':previous?`保存为 v${previous.version+1}`:'保存新模板'}</button></div>
    </div>{extracting&&team?<div className={css.chat}><h3>提炼通用流程</h3><p>AI 只提出草稿，源流程保持不变。</p><EmbeddedDiscussion sessionId={sessionId} teamId={team.id} discussion="template"/></div>:<aside className={css.guide}><BrandIcon name="save" size={44}/><h3>保存做事的方法</h3><p>通用要求保留方法、交付约定和质量标准。项目名称、路径、数值等具体要求留给下次适配。</p><p>可先让 AI 提炼，再检查和修改。原流程的执行记录不会被改动。</p></aside>}</div>
    :selected?<div className={css.detail}><button onClick={()=>setSelected(undefined)}>← 所有模板</button><div className={css.detailHeading}><div><h2>{selected.name}</h2><p>{selected.description||'个人流程模板'}</p><small>{isBuiltinTemplate(selected.id)?'内置':'个人'} · v{selected.version} · {selected.members.length} 个角色 · {selected.tasks.length} 个节点</small></div><BrandIcon name="gallery" size={42}/></div><MiniFlow template={selected} large/>
      <div className={css.editorGrid}><div><h3>流程与通用要求</h3>{selected.tasks.map(t=><details key={t.id}><summary>{t.checkpoint?'人工检查':'任务'} · {t.subject}</summary><p>{briefText(t.general)}</p><small>负责人：{t.assignee||'人工／自动分配'} · 上游：{t.dependencies.map(id=>selected.tasks.find(n=>n.id===id)?.subject).join('、')||'无'}</small></details>)}<h3>角色分工</h3>{selected.members.map(m=><details key={m.name}><summary>{m.name} · {m.summary}</summary><p>{m.role}</p><p>{m.executionPrompt}</p></details>)}</div>
      <form className={css.apply} onSubmit={e=>{e.preventDefault();void run(()=>onApply(selected,name,goal))}}><h3>应用到本次任务</h3><p>{selected.inputs||'描述本次目标、工作范围和特殊要求。'}</p>{team&&<p className={css.warning}>当前对话已有流程。请在新的对话打开 Teamflow 后应用；不会覆盖当前流程。</p>}<label>流程名称<input required maxLength={120} value={name} onChange={e=>setName(e.target.value)}/></label><label>本次需求<textarea required maxLength={12000} value={goal} onChange={e=>setGoal(e.target.value)} placeholder="例如：实现算子 B，遵循当前项目接口，并验证正确性…"/></label><small>已有对话需求会带入适配。保留全部节点和连线，由 Captain 统一生成本次任务；确认后才执行。</small><button className={css.primary} disabled={busy||!!team||!goal.trim()}>使用模板并讨论本次任务</button></form></div>
      <div className={css.actions}><button onClick={()=>{setDraft(structuredClone(selected));setPrevious(isBuiltinTemplate(selected.id)?undefined:{id:selected.id,version:selected.version});setSelected(undefined)}}>{isBuiltinTemplate(selected.id)?'编辑并另存为个人模板':'编辑模板'}</button><button onClick={()=>{setDraft({...structuredClone(selected),name:`${selected.name} · 副本`});setPrevious(undefined);setSelected(undefined)}}>复制模板</button>{isBuiltinTemplate(selected.id)?<small>内置模板只读，修改后保存为个人模板。</small>:deleteId===selected.id?<><span>删除后已创建的流程不受影响。</span><button disabled={busy} onClick={()=>void run(async()=>{await api(sessionId,'template_delete',{templateId:selected.id,version:selected.version});setSelected(undefined);await refresh()})}>确认删除</button><button onClick={()=>setDeleteId('')}>取消</button></>:<button onClick={()=>setDeleteId(selected.id)}>删除模板</button>}</div>
    </div>:<><div className={css.filters}><input aria-label="搜索模板" placeholder="搜索模板名称、用途或标签" value={search} onChange={e=>setSearch(e.target.value)}/><select aria-label="标签筛选" value={tag} onChange={e=>setTag(e.target.value)}><option value="">所有标签</option>{tags.map(t=><option key={t}>{t}</option>)}</select><span>{filtered.length} 个模板</span></div>
      {busy&&!templates.length?<p role="status">正在读取模板库…</p>:!filtered.length?<div className={css.empty}><BrandIcon name="gallery" size={56}/><h3>{templates.length?'没有匹配的模板':'把有效的协作流程留在这里'}</h3><p>{templates.length?'试试其他关键词或标签。':'在流程画布点击「保存为模板」，提炼一次，以后直接套用。'}</p><button onClick={onBack}>返回流程</button></div>:<div className={css.cards}>{filtered.map(item=><article className={css.card} key={item.id}><button className={css.cardPreview} onClick={()=>choose(item)} aria-label={`查看 ${item.name}`}><MiniFlow template={item}/><h3>{item.name}</h3><p>{item.description||'个人流程模板'}</p></button><div className={css.tags}>{item.tags.map(t=><span key={t}>{t}</span>)}</div><small>{item.members.length} 个角色 · {item.tasks.length} 个节点 · {item.tasks.filter(t=>t.checkpoint).length} 个人工检查点</small><footer><small>{isBuiltinTemplate(item.id)?'内置':'个人'} · v{item.version} · {new Date(item.updatedAt).toLocaleDateString()}</small><button className={css.primary} onClick={()=>choose(item)}>使用模板</button></footer></article>)}</div>}</>}
  </section>
}
