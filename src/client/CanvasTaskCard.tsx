import type { TeamState, TeamTask } from '../types.ts'
import { LEAD_ART, REVIEW_ART, memberArtUrl } from './artwork.ts'
import { useWorkflowText } from './workflow-i18n.tsx'
import { taskReadiness, type ExecutionState } from './task-readiness.ts'
import { TaskStateBadge } from './TaskStateBadge.tsx'
import type { taskControlState } from './task-control.ts'
import css from './CanvasTaskCard.module.css'

export function CanvasTaskCard({team,task,control,execution,archived,reviewing,adapting,draft,systemOwned=false,onMember,selectedMember}: {
  team:TeamState; task:TeamTask; control:ReturnType<typeof taskControlState>; execution?:ExecutionState; archived:boolean
  reviewing:boolean; adapting:boolean; draft:boolean; systemOwned?:boolean
  onMember:(name:string)=>void; selectedMember?:string
}) {
  const l=useWorkflowText(), english=l.language==='en'
  const tr=(zh:string,en:string)=>english?en:zh
  const member=team.members.find(m=>m.name===task.assignee)
  const previous=task.reassigning && team.members.find(m=>m.id && m.id===task.handoffFromMemberId)?.name
  const live=!archived && !team.halted && !task.workflowPaused && !task.reassigning && (reviewing || execution==='active')
  const tone=live?'running':task.status==='completed'?'complete':task.status==='failed'||execution==='interrupted'||['blocked','reviewRejected'].includes(control.visual)?'blocked':
    draft||control.visual==='reviewReady'?'decision':adapting?'adapt':'ready'
  const captain=adapting||task.assignee==='captain'
  const actor=captain?'Captain':reviewing?tr('验收 Agent','Review agent'):task.checkpoint?(task.checkpoint.mode==='ai'?tr('验收 Agent','Review agent'):tr('你','You')):member?.name||task.assignee||(systemOwned?tr('系统','System'):tr('待分配','Unassigned'))
  const role=adapting?tr('正在适配流程','Adapting workflow'):task.checkpoint?(reviewing?tr('初审','Initial review'):tr('验收决策人','Decision owner')):member?.role||member?.summary||tr('执行成员','Task owner')
  const portrait=captain?LEAD_ART:task.checkpoint?REVIEW_ART:memberArtUrl(actor,role)
  const status=adapting?tr('适配中','Adapting'):draft?tr('待确认','Review draft'):reviewing?tr('初审中','Reviewing'):previous?tr('交接中','Handoff'):tone==='decision'?tr('待决策','Decision'):execution==='interrupted'?tr('执行中断','Interrupted'):undefined
  const requirements=task.description?.trim()||team.workflow?.templateDefinition?.tasks.find(t=>t.id===task.id)?.general.requirements
  const detail=taskReadiness(team,task,l,execution).detail
  const latest=task.supplementalEvidence?.at(-1)?.note?.trim() || task.output?.trim() || task.checkpoint?.note?.trim()
  const footer=draft?tr('查看并确认本次任务要求','Review the proposed requirements'):adapting && task.assignee?tr('适配后由 ','Assigned after adaptation: ')+task.assignee:
    tone==='blocked'?latest||detail:tone==='decision'?tr('核对要求与结果，提交本轮决定。','Check the results and decide this round.'):latest||detail
  const caption=tone==='blocked'?tr('阻塞信息','Blocker'):tone==='decision'?tr('待你处理','Decision'):latest?tr('最近记录','Latest record'):tr('当前状态','Status')
  const identity=<><img className={css.avatar} src={portrait} alt="" draggable={false}/>
    <span className={css.identity}><b title={actor}>{previous && previous+' → '}{actor}</b><small title={role}>{role}</small></span></>
  return <div className={css.card} data-card-tone={tone}>
    <span className={css.header}>{member && !captain && !task.checkpoint
      ? <button type="button" className={css.memberLink} data-card-member={member.name} aria-pressed={selectedMember===member.name}
          aria-label={tr('查看 Agent · ','View agent · ')+member.name}
          onClick={e=>{e.stopPropagation();onMember(member.name)}}>{identity}</button>
      : <span className={css.actor}>{identity}</span>}
      <TaskStateBadge control={control} className={css.badge} detail={detail} labelText={status}/></span>
    <button type="button" className={css.body} data-card-task={task.id} aria-label={tr('查看任务 · ','View task · ')+task.subject}><strong>{task.subject}</strong><span title={requirements}>{requirements||tr('待填写任务要求','Task requirements pending')}</span></button>
    <span className={css.footer} title={footer}><b>{caption}</b><span>{footer}</span></span>
  </div>
}
