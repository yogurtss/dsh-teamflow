import { useState } from 'react'
import type { TaskLayers } from '../task-layers.ts'
import { briefText } from '../task-layers.ts'
import css from './TemplateGallery.module.css'

export function TaskLayersView({layers,issue}:{layers:TaskLayers;issue?:string}){
  return <div className={css.layers}><details><summary>通用任务 · {layers.general.requirements.slice(0,45)||'尚未填写'}</summary><p>{briefText(layers.general)}</p></details><strong>本次任务</strong><p>{briefText(layers.specific)||'等待统一适配'}</p>{issue&&<p role="alert" className={css.warning}>需要确认：{issue}</p>}</div>
}
export function TaskLayersEditor({values,onChange,hasGeneral=false,issue=false}:{values:Record<string,string>;onChange:(v:Record<string,string>)=>void;hasGeneral?:boolean;issue?:boolean}){
  const [unlock,setUnlock]=useState(!hasGeneral)
  const field=(key:string,label:string,disabled=false)=><label>{label}<textarea value={values[key]??''} disabled={disabled} maxLength={16000} onChange={e=>onChange({...values,[key]:e.target.value})}/></label>
  return <div className={css.layers}><details open={!hasGeneral}><summary>通用任务 · 可复用的方法与约束</summary>{hasGeneral&&<label className={css.toggle}><input type="checkbox" checked={unlock} onChange={e=>setUnlock(e.target.checked)}/>修改当前流程的通用要求</label>}
    <p className={css.muted}>仅影响当前流程。修改后需检查本次任务，不会覆盖模板。</p>
    {field('generalRequirements','通用任务要求',!unlock)}<details><summary>通用交付物与验收要求</summary>{field('generalDeliverables','通用交付物',!unlock)}{field('generalAcceptance','通用验收要求',!unlock)}</details></details>
    <strong>本次任务</strong>{field('description','本次任务要求')}<details open={!!values['specificDeliverables']||!!values['specificAcceptance']}><summary>本次交付物与验收要求</summary>{field('specificDeliverables','本次交付物')}{field('specificAcceptance','本次验收要求')}</details>
    {(issue||values['adaptationIssue'])&&<>{field('adaptationIssue','适配问题（处理后清空，并确认配置）')}<p className={css.warning}>保留节点并调整要求；存在未处理问题时不能启动。</p></>}
  </div>
}
