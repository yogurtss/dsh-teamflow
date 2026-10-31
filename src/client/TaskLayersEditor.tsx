import { briefDisplay } from './workflow-text.ts'
import { useWorkflowText } from './workflow-i18n.tsx'
import { useState } from 'react'
import type { TaskLayers } from '../task-layers.ts'
import css from './TemplateGallery.module.css'

export function TaskLayersView({layers,issue}:{layers:TaskLayers;issue?:string}){
  const l = useWorkflowText()

  return <div className={css.layers}><details><summary>{l("通用任务 · ")}{layers.general.requirements.slice(0,45)||l("尚未填写")}</summary><p>{briefDisplay(layers.general,l)}</p></details><strong>{l("本次任务 · 完整执行要求")}</strong><p>{briefDisplay(layers.specific,l)||l("等待统一适配")}</p>{issue&&<p role="alert" className={css.warning}>{l("需要确认：")}{issue}</p>}</div>
}
export function TaskLayersEditor({values,onChange,hasGeneral=false,issue=false}:{values:Record<string,string>;onChange:(v:Record<string,string>)=>void;hasGeneral?:boolean;issue?:boolean}){
  const l = useWorkflowText()

  const [unlock,setUnlock]=useState(!hasGeneral)
  const field=(key:string,label:string,disabled=false)=><label>{label}<textarea value={values[key]??''} disabled={disabled} maxLength={16000} onChange={e=>onChange({...values,[key]:e.target.value})}/></label>
  return <div className={css.layers}><details open={!hasGeneral}><summary>{l("通用任务 · 可复用的方法与约束")}</summary>{hasGeneral&&<label className={css.toggle}><input type="checkbox" checked={unlock} onChange={e=>setUnlock(e.target.checked)}/>{l("修改当前流程的通用要求")}</label>}
    <p className={css.muted}>{l("模板只保存此层。修改后需重新生成或确认本次任务，不会覆盖模板。")}</p>
    {field('generalRequirements',l("通用任务要求"),!unlock)}<details><summary>{l("通用交付物与验收要求")}</summary>{field('generalDeliverables',l("通用交付物"),!unlock)}{field('generalAcceptance',l("通用验收要求"),!unlock)}</details></details>
    <strong>{l("本次任务 · 完整执行要求")}</strong><p className={css.muted}>{l("Agent 只读取本次要求。请包含具体化后的全部通用约束、交付物与验收条件，不要仅写补充说明。")}</p>{field('description',l("本次任务要求"))}<details open={!!values['specificDeliverables']||!!values['specificAcceptance']}><summary>{l("本次交付物与验收要求")}</summary>{field('specificDeliverables',l("本次交付物"))}{field('specificAcceptance',l("本次验收要求"))}</details>
    {(issue||values['adaptationIssue'])&&<>{field('adaptationIssue',l("适配问题（处理后清空，并确认配置）"))}<p className={css.warning}>{l("保留节点并调整要求；存在未处理问题时不能启动。")}</p></>}
  </div>
}
