/** Workflow completion is separate from archiving and human approval. */
import type { TeamState } from './types.ts'
import { TERMINAL_TASK_STATUSES } from './types.ts'
import { resetTaskForRerun } from './task-rerun.ts'

export function assertWorkflowArchivable(team: TeamState): void {
  if (!team.workflow && !team.tasks.some(task=>task.checkpoint)) return
  const unfinished=team.tasks.filter(task=>!TERMINAL_TASK_STATUSES.includes(task.status))
  if(unfinished.length) throw new Error(`流程还有未完成节点，不能归档：${unfinished.map(task=>`${task.id} ${task.subject}`).join('、')}。聊天中的“验收通过”不会完成正式人工审批；请在团队与流程打开验收材料并点击“通过验收”。明确放弃时，先由用户停止团队，再归档。`)
}

/** Restore a reviewable copy; retain the archive and all finished results. */
export function prepareArchivedWorkflow(archived: TeamState): TeamState {
  if(!archived.workflow && !archived.tasks.some(task=>task.checkpoint)) throw new Error('此历史记录不包含可恢复的 TeamFlow 流程')
  const team=structuredClone(archived), now=Date.now()
  team.phase='staged';team.planReviewState='awaiting_review';team.halted=false;delete team.haltedAt
  team.workflow??={positions:{},discussions:{},history:[]}
  for(const discussion of Object.values(team.workflow.discussions)) if(discussion.proposal?.status==='pending') discussion.proposal.status='dismissed'
  for(const member of team.members) {
    if(member.id) member.previousSessionIds=[...new Set([...member.previousSessionIds??[],member.id])]
    member.id='';member.status='idle';member.stopping=false;delete member.runtimeSetup
    delete member.activeProvider;delete member.activeModel;delete member.fallbackActive
  }
  for(const task of team.tasks) {
    if(TERMINAL_TASK_STATUSES.includes(task.status)) continue
    if(task.output || task.attemptId) {task.stoppedAttempts??=[];task.stoppedAttempts.push({attemptId:task.attemptId,output:task.output,at:now})}
    resetTaskForRerun(task,!task.checkpoint,now)
    task.workflowRerunRequired=false
    if(task.checkpoint) {
      delete task.assignee
      const discussion=team.workflow.discussions[`discussion:check:${task.id}`]
      if(discussion) {delete discussion.materials;delete discussion.evidence;delete discussion.materialsRound;if(discussion.native) delete discussion.native.reviewEvidence}
    }
  }
  return team
}
