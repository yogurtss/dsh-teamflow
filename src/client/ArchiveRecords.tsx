import { useState } from 'react'
import type { TeamState, TeamTask } from '../types.ts'
import { workflowRequest } from './workflow-request.ts'
import { useWorkflowText } from './workflow-i18n.tsx'
interface Manifest {gitCommit?:string;tasks:TeamTask[];files:{path:string;present:boolean;copied:boolean;skipped?:string;reason?:string;size?:number;sha256?:string}[];loops:{id:string;round:number;historyCount:number}[]}

export function ArchiveRecords({sessionId,team,task,archived}:{sessionId:string;team:TeamState;task:TeamTask;archived:boolean}){
  const l=useWorkflowText(),[busy,setBusy]=useState(''),[error,setError]=useState(''),[record,setRecord]=useState<{id:string;text:string;manifest:Manifest}>()
  if(task.kind!=='archive')return null
  async function open(id:string){
    setBusy(id);setError('')
    try{const result=await workflowRequest<{manifest:Manifest}>({action:'task_archive',sessionId,teamId:team.id,taskId:task.id,recordId:id,archived});setRecord({id,text:JSON.stringify(result.manifest,null,2),manifest:result.manifest})}catch(e){setError(String(e))}finally{setBusy('')}
  }
  function download(){if(!record)return;const url=URL.createObjectURL(new Blob([record.text],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`archive-${record.id}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
  return <section data-archive-records><h4>{l('成果归档记录')}</h4><p>{l('每次归档单独保存，上游重跑不会覆盖已完成的归档。清单记录文件摘要；Git 版本引用不代表工作区没有未提交修改。')}</p>{!task.archiveRecords?.length?<p>{l('归档完成后可在这里查看清单。')}</p>:[...task.archiveRecords].reverse().map(r=><div key={r.id}><button type="button" aria-pressed={record?.id===r.id} disabled={!!busy} onClick={()=>void open(r.id)}>{new Date(r.createdAt).toLocaleString()} · {r.fileCount} {l('文件引用')} / {r.copiedCount} {l('文件副本')}</button><small style={{display:'block',overflowWrap:'anywhere'}}>{r.manifestPath}</small></div>)}{error&&<p role="alert">{error}</p>}{record&&<>
    <button type="button" onClick={download}>{l('下载归档清单')}</button>
    {record.manifest.gitCommit&&<p style={{overflowWrap:'anywhere'}}>Git · <code>{record.manifest.gitCommit}</code></p>}
    <h4>{l('已保存的成果与证据')}</h4>{record.manifest.tasks.map(t=><details key={t.id}><summary>{t.subject} · {t.checkpoint?l('第 {0} 轮',t.checkpoint.round):`#${t.attempt??0}`}</summary><p style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{t.output||l('尚未提交结果说明')}</p>{t.checkpoint?.history.map((h,i)=><p key={i}>{l('第 {0} 轮',h.round)} · {h.decision==='approve'?l('通过'):h.decision==='branch'?l('创建返工分支'):l('退回')} · {h.note}</p>)}</details>)}
    {!!record.manifest.files.length&&<><h4>{l('文件引用')}</h4>{record.manifest.files.map(f=><details key={f.path}><summary>{f.path} · {f.skipped?l('按策略跳过内容审计，请在本机检查'):f.copied?l('文件副本'):f.present?l('文件引用'):l('文件不存在')}</summary><code style={{overflowWrap:'anywhere'}}>{f.sha256}</code>{f.size!==undefined&&<p>{f.size.toLocaleString()} bytes</p>}{f.reason&&<p>{f.reason}</p>}</details>)}</>}
    {record.manifest.loops.map(loop=><p key={loop.id}>{l('第 {0} 轮',loop.round)} · {l('循环历史记录')} {loop.historyCount}</p>)}
    <details><summary>{l('完整归档清单')}</summary><pre style={{maxHeight:360,overflow:'auto',whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{record.text}</pre></details>
  </>}</section>
}
