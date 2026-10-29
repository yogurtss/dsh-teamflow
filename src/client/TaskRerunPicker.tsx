/** Shared, explicit selection and impact preview for an isolated member rerun. */
import type { TeamTask } from '../types.ts'
import { rerunImpact, rerunnableTasks } from '../task-rerun.ts'
import css from './TaskRerunPicker.module.css'
export function TaskRerunImpact({ tasks, taskId }: { tasks: readonly TeamTask[]; taskId: string }) {
  const impact=rerunImpact(tasks,taskId)
  return <div className={css.impact}>
    <p>所选任务开启新一轮执行，原有状态和提交结果保存在历史执行记录中。旧验证证据不作为本轮证据，无关分支保持不变。</p>
    {!!impact.descendants.length&&<p>以下下游节点会重置并挂起，待你逐个确认后执行或重新验收：{impact.descendants.map(task=>task.subject).join('、')}</p>}
    {!!impact.active.length&&<p role="alert">请先停止受影响的运行任务：{impact.active.map(task=>task.subject).join('、')}</p>}
  </div>
}
export function TaskRerunPicker({ tasks, member, taskId, onTask, disabled }: { tasks: readonly TeamTask[]; member: string; taskId: string; onTask: (id:string)=>void; disabled:boolean }) {
  const candidates=rerunnableTasks(tasks,member)
  if(!candidates.length) return null
  return <fieldset className={css.picker}><legend>单独重跑</legend><label className={css.field}>重跑任务<select value={taskId} disabled={disabled} onChange={event=>onTask(event.target.value)}>{candidates.map(task=><option key={task.id} value={task.id}>{task.subject}（{task.id}）</option>)}</select></label>
    <p>保存成员后进入任务编辑，查看上一轮结果并填写本轮要求，再确认重跑。</p>
  </fieldset>
}
