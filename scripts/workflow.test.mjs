import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createHash } from 'node:crypto'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { applyWorkflowOperations, applyWorkflowProposal, checkpointReady, decideCheckpoint, parseWorkflowOperations, proposeWorkflow, workflowFingerprint, workflowState } from '../lib/workflow.js'
import { workflowMaterials, installWorkflowWorkbench } from '../lib/workflow-runtime.js'
import { Readable } from 'node:stream'
import { installTeamScheduler } from '../lib/scheduler.js'
import { cancelUnfinishedTask, createTeamDir, readArchivedTeam, readTeam, writeTeam } from '../lib/state.js'
import { assertWorkflowArchivable, prepareArchivedWorkflow } from '../lib/workflow-lifecycle.js'
import { registerAgentTeamsTools } from '../lib/tools.js'
import { installWorkflowConversations } from '../lib/workflow-native.js'
import { connectionIssue, connectionTarget } from '../lib/client/workflow-connections.js'
import { openAgentTeamMember, openWorkflowConversation } from '../lib/client/session-navigation.js'
import { taskDraftOperations } from '../lib/client/workflow-draft.js'
import { rerunImpact, rerunnableTasks } from '../lib/task-rerun.js'
import { draftSource, editorKey, editorTarget, finishWorkbenchSave, initialWorkbenchView, selectWorkbench, targetDiscussion } from '../lib/client/workbench-selection.js'
import { arrangeTasks, fitGraph } from '../lib/client/workflow-layout.js'

const member = { id: '', name: 'worker', role: 'developer', provider: 'fixture', model: 'fixture', status: 'idle', joinedAt: 1 }
const task = (id, dependencies = []) => ({ id, subject: id, assignee: 'worker', dependencies, status: 'pending', attempt: 0, kind: 'work', createdAt: 1, updatedAt: 1 })
const team = () => ({ id: 'demo', name: 'Demo', captainSessionId: 'captain-id', members: [{ ...member }], tasks: [task('t1')], taskSeq: 1, createdAt: 1, phase: 'running' })
const withGate = () => applyWorkflowOperations(team(), [{ action: 'add_task', id: 'gate', subject: 'Human review', checkpoint: true, dependencies: ['t1'] }, { action: 'add_task', id: 'after', subject: 'After', dependencies: ['gate'], assignee: 'worker' }])

const sixOfSeven = () => {
  const source=team();source.tasks=Array.from({length:6},(_,i)=>({...task(`t${i+1}`),status:'completed',output:`result ${i+1}`}));source.taskSeq=6
  return applyWorkflowOperations(source,[{action:'add_task',id:'gate',subject:'人工检查',description:'核对全部六项成果',checkpoint:true,dependencies:source.tasks.map(t=>t.id)}])
}

test('archive tool refuses 6/7 workflows before modifying members or durable results', async t => {
  const root=mkdtempSync(join(tmpdir(),'workflow-archive-guard-'));t.after(()=>rmSync(root,{recursive:true,force:true}))
  const source=sixOfSeven(), stateRoot=join(root,'.agent-teams');await createTeamDir(stateRoot,source)
  const captain={id:'captain-id',status:'idle',session:{header:{id:'captain-id',cwd:root},ownEvents:()=>[]}}
  const definitions=new Map(), noop=()=>{}
  const ctx={on:()=>noop,effect:fn=>fn(),logger:{warn:noop,debug:noop},tools:{register:value=>definitions.set(value.name,value)},agents:{get:id=>id===captain.id?captain:undefined},llm:{resolveCallConfig:async value=>value},subagents:{followup:async()=>{},registerContinuableSetup:()=>noop}}
  registerAgentTeamsTools(ctx,{stateDir:'.agent-teams',memberProvider:'spawn',memberMaxDepth:1,maxMembers:8,profiles:{},toolPolicies:{}})
  await assert.rejects(definitions.get('agent_teams_delete').execute({},{agent:captain,signal:new AbortController().signal}),/未完成节点.*不能归档/)
  assert.deepEqual(await readTeam(stateRoot,'demo'),JSON.parse(JSON.stringify(source)),'guard runs before retiring or deleting any member')
  assert.equal(await readArchivedTeam(stateRoot,'demo'),undefined)
  const status=await definitions.get('agent_teams_status').execute({},{agent:captain,signal:new AbortController().signal})
  const gate=status.tasks.find(t=>t.id==='gate');assert.equal(gate.human_checkpoint,true);assert.equal(gate.checkpoint_decision,'pending')
  const text=definitions.get('agent_teams_status').output.render({},status)[0].text
  assert.match(text,/HUMAN CHECKPOINT/);assert.match(text,/聊天文字不改变审批状态/)
})

test('restoring an archive preserves finished work and pauses unfinished execution with fresh members', () => {
  const source=sixOfSeven();source.members[0].id='retired-child';source.members[0].status='removed'
  source.tasks.push({...task('unfinished'),status:'claimed',attempt:2,attemptId:'old-capability',output:'partial output'})
  const before=structuredClone(source), restored=prepareArchivedWorkflow(source)
  assert.deepEqual(source,before);assert.equal(restored.phase,'staged');assert.equal(restored.planReviewState,'awaiting_review')
  assert.deepEqual(restored.tasks.slice(0,6),source.tasks.slice(0,6));assert.equal(restored.tasks[6].status,'pending')
  assert.equal(restored.members[0].status,'idle');assert.equal(restored.members[0].id,'');assert.ok(restored.members[0].previousSessionIds.includes('retired-child'))
  const unfinished=restored.tasks.at(-1)
  assert.equal(unfinished.status,'pending');assert.equal(unfinished.workflowPaused,true);assert.equal(unfinished.workflowRerunRequired,false)
  assert.equal(unfinished.attempt,2);assert.equal(unfinished.attemptId,undefined);assert.equal(unfinished.stoppedAttempts[0].output,'partial output')
  assert.equal(editorTarget(restored,{type:'task',id:'unfinished'}).type,'task')
  assertWorkflowArchivable({...restored,tasks:restored.tasks.map(t=>({...t,status:'cancelled'}))})
  const proposal=proposeWorkflow(sixOfSeven(),'old proposal',[{action:'update_member',name:'worker',summary:'old suggestion'}])
  workflowState(source).discussions['discussion:graph']={key:'graph',messages:[],calls:[],proposal}
  assert.equal(prepareArchivedWorkflow(source).workflow.discussions['discussion:graph'].proposal.status,'dismissed','stale proposals cannot block starting the restored plan')
})

test('archive recovery route is owner-bound, never starts work, and formal approval changes 6/7 into 7/7',async t=>{
  const root=mkdtempSync(join(tmpdir(),'workflow-recover-'));t.after(()=>rmSync(root,{recursive:true,force:true}))
  const stateRoot=join(root,'.agent-teams'), source=sixOfSeven();source.members[0].status='removed';source.members[0].id='retired-child'
  await createTeamDir(join(stateRoot,'archive'),source)
  const captain={id:'captain-id',status:'idle',session:{header:{id:'captain-id',cwd:root},ownEvents:()=>[]}}, stranger={...captain,id:'stranger'}
  let handler,status,response,kicks=0
  const ctx={agents:{get:id=>id===captain.id?captain:id===stranger.id?stranger:undefined},effect:fn=>fn(),logger:{warn(){}}}
  installWorkflowWorkbench(ctx,{stateDir:'.agent-teams',maxMembers:8},{kickTeam:async()=>{kicks++}},{register:value=>{handler=value;return()=>{}}})
  async function send(action,extra={}) {const req=Readable.from([JSON.stringify({sessionId:captain.id,teamId:'demo',action,...extra})]);req.method='POST';req.headers={};await handler.handler(req,{writeHead:code=>{status=code},end:body=>{response=JSON.parse(body)}})}
  await send('archive_state',{sessionId:stranger.id});assert.equal(status,409)
  await send('archive_state');assert.equal(status,200,JSON.stringify(response));assert.deepEqual(response.team,JSON.parse(JSON.stringify(source)))
  assert.equal(await readTeam(stateRoot,'demo'),undefined,'inspecting an archive never restores or starts it');assert.equal(kicks,0)
  await send('edit',{base:workflowFingerprint(source),title:'must not edit archive',operations:[{action:'update_member',name:'worker',summary:'unsafe'}]});assert.equal(status,409)
  await send('restore_archive',{sessionId:stranger.id});assert.equal(status,409);assert.equal(await readTeam(stateRoot,'demo'),undefined)
  await send('restore_archive');assert.equal(status,200,JSON.stringify(response));assert.equal(kicks,0);assert.equal(response.team.phase,'staged');assert.equal(response.activity.tasks.filter(t=>t.status==='completed').length,6)
  assert.deepEqual(await readArchivedTeam(stateRoot,'demo'),JSON.parse(JSON.stringify(source)),'original archive remains intact')
  await send('restore_archive');assert.equal(status,409,'cannot overwrite a live team')
  const restored=await readTeam(stateRoot,'demo');restored.phase='running';await writeTeam(stateRoot,restored)
  await send('materials',{discussion:'check:gate'});assert.equal(status,200,JSON.stringify(response))
  const evidence=response.team.workflow.discussions['discussion:check:gate'].evidence
  await send('review',{taskId:'gate',decision:'approve',note:'已核对六项成果',evidence})
  assert.equal(status,200,JSON.stringify(response));assert.equal(response.team.tasks.filter(t=>t.status==='completed').length,7)
  assert.equal(response.activity.tasks.filter(t=>t.status==='completed').length,7,'the main activity view receives the same approved state immediately')
  assert.equal(response.team.tasks.find(t=>t.id==='gate').checkpoint.decision,'approve');assert.ok(await readTeam(stateRoot,'demo'),'approval does not archive the team')
})

test('completed canvas tasks edit and rerun atomically while preserving unrelated work and suspending descendants',()=>{
  const source=withGate();source.tasks[0].status='completed';source.tasks[0].output='old result'
  source.tasks[0].attempt=1;source.tasks[0].objective='keep objective';source.tasks[0].acceptance=['keep acceptance']
  source.tasks[1].status='completed';source.tasks[1].checkpoint.decision='approve'
  source.tasks[2].status='completed';source.tasks[2].output='downstream old'
  source.tasks.push({...task('unrelated'),status:'completed',output:'preserved'})
  source.members.push({...member,name:'replacement'})
  const before=structuredClone(source), operation=parseWorkflowOperations([{action:'rerun_task',id:'t1',subject:'Revised task',description:'New requirement',assignee:'replacement',output:'ignore forged result'}])[0]
  assert.equal(editorTarget(source,{type:'task',id:'t1'},true).type,'task')
  const result=applyWorkflowOperations(source,[operation])
  assert.deepEqual(source,before);assert.equal(result.tasks[0].subject,'Revised task');assert.equal(result.tasks[0].description,'New requirement');assert.equal(result.tasks[0].assignee,'replacement')
  assert.equal(result.tasks[0].status,'pending');assert.equal(result.tasks[0].output,undefined);assert.equal(result.tasks[0].objective,'keep objective');assert.deepEqual(result.tasks[0].acceptance,['keep acceptance'])
  assert.equal(result.tasks[1].workflowPaused,true);assert.equal(result.tasks[1].checkpoint.decision,undefined);assert.equal(result.tasks[2].workflowRerunRequired,true)
  assert.deepEqual(result.tasks[3],source.tasks[3])
  for(const extra of [{subject:''},{assignee:'missing'}]) assert.throws(()=>applyWorkflowOperations(source,[{action:'rerun_task',id:'t1',...extra}]))
  assert.deepEqual(source,before,'rejected edited reruns leave all prior results intact')
})

test('member, task, checkpoint and discussion selection each own one property context', () => {
  const source=withGate(); let view=selectWorkbench(initialWorkbenchView(),{type:'task',id:'t1'},source)
  assert.equal(editorTarget(source,view.target).type,'task')
  view=selectWorkbench(view,{type:'member',id:'worker'},source)
  assert.deepEqual(view.target,{type:'member',id:'worker'});assert.equal(editorTarget(source,view.target).type,'member');assert.equal(targetDiscussion(view.target),'member:worker')
  view=selectWorkbench(view,{type:'check',id:'gate'},source)
  assert.equal(editorTarget(source,view.target).type,'check');assert.equal(targetDiscussion(view.target),'check:gate')
  view=selectWorkbench(view,{type:'edge',from:'t1',to:'gate'},source)
  assert.equal(editorTarget(source,view.target),undefined);assert.equal(targetDiscussion(view.target),'graph')
  view=selectWorkbench(view,{type:'discussion',key:'member:worker'},source)
  assert.equal(editorTarget(source,view.target),undefined,'leaving member editing cannot expose an old task selection')
})

test('unsaved member and task drafts survive switching while saved source is unchanged', () => {
  const source=team(), memberTarget={type:'member',id:'worker'}, taskTarget={type:'task',id:'t1'}
  let view=selectWorkbench(initialWorkbenchView(),memberTarget,source,{executionPrompt:'Unsaved PE'})
  const memberKey=editorKey(source.id,memberTarget)
  view=selectWorkbench(view,taskTarget,source,{description:'Unsaved task requirement'})
  const taskKey=editorKey(source.id,taskTarget)
  view=selectWorkbench(view,memberTarget,source)
  assert.equal(view.drafts[memberKey].values.executionPrompt,'Unsaved PE')
  assert.equal(view.drafts[taskKey].values.description,'Unsaved task requirement')
  assert.equal(view.drafts[memberKey].source,draftSource(source,memberTarget))
  const taskSource=draftSource(source,taskTarget);source.tasks[0].dependencies=['another-task'];source.tasks[0].updatedAt=2
  assert.equal(draftSource(source,taskTarget),taskSource,'moving or connecting nodes cannot invalidate property drafts that do not edit dependencies')
  source.members[0].role='Concurrent edit'
  assert.notEqual(view.drafts[memberKey].source,draftSource(source,memberTarget),'concurrent configuration changes cannot silently overwrite a retained draft')
  assert.notEqual(editorKey('another-team',memberTarget),memberKey)
})

test('late saves cannot move a newer selection or remove newer typing', () => {
  const source=team(), target={type:'task',id:'t1'}, key=editorKey(source.id,target)
  let view=selectWorkbench(initialWorkbenchView(),target,source,{description:'Submitted value'})
  const revision=view.revision, submitted=view.drafts[key]
  view=selectWorkbench(view,{type:'member',id:'worker'},source,{role:'Member draft'})
  const completed=finishWorkbenchSave(view,key,submitted,revision,source,{type:'discussion',key:'graph'})
  assert.deepEqual(completed.target,view.target);assert.equal(completed.revision,view.revision);assert.equal(completed.drafts[key],undefined)
  const memberKey=editorKey(source.id,{type:'member',id:'worker'})
  assert.equal(completed.drafts[memberKey].values.role,'Member draft')
  view=selectWorkbench(view,target,source,{description:'Newer typing during save'})
  assert.equal(finishWorkbenchSave(view,key,submitted,revision,source).drafts[key].values.description,'Newer typing during save')
  const saved=structuredClone(source);saved.tasks[0].description='Submitted value';saved.tasks[0].updatedAt=2
  const retained=finishWorkbenchSave(view,key,submitted,revision,saved,undefined,target)
  assert.equal(retained.drafts[key].values.description,'Newer typing during save')
  assert.equal(retained.drafts[key].source,draftSource(saved,target),'our own save advances the baseline without discarding newer typing')
  const memberTarget={type:'member',id:'worker'}, routeKey=editorKey(source.id,memberTarget)
  let routeView=selectWorkbench(initialWorkbenchView(),memberTarget,source,{model:'submitted-model',routeChanged:'yes'})
  const routeDraft=routeView.drafts[routeKey], routeRevision=routeView.revision
  routeView=selectWorkbench(routeView,memberTarget,source,{model:'newer-model',routeChanged:'yes'})
  saved.members[0].model='submitted-model'
  const routeSaved=finishWorkbenchSave(routeView,routeKey,routeDraft,routeRevision,saved,undefined,memberTarget)
  assert.equal(routeSaved.drafts[routeKey].values.model,'newer-model');assert.equal(routeSaved.drafts[routeKey].values.routeChanged,'yes','newer model changes still get submitted on the next save')
})

test('completed work remains a task selection and explicit member navigation clears it', () => {
  const source=team();source.tasks[0].status='completed'
  let view=selectWorkbench(initialWorkbenchView(),{type:'task',id:'t1'},source)
  assert.equal(editorTarget(source,view.target),undefined,'completed work has read-only task properties')
  view=selectWorkbench(view,{type:'member',id:'worker'},source,{rerunTaskId:'t1'})
  assert.equal(view.target.type,'member');assert.equal(editorTarget(source,view.target).type,'member')
  view=selectWorkbench(view,{type:'discussion',key:'member:worker'},source)
  assert.equal(view.target.type,'discussion','cancelling does not fall back to the completed task')
})

test('rerun overwrites the same task, suspends all transitive dependents and preserves unrelated work', () => {
  const source=withGate()
  source.members.push({...member,name:'other'})
  Object.assign(source.tasks[0],{status:'completed',attempt:3,attemptId:'old',output:'old result',profileSeedId:'seed',deliverables:['report.md'],coverageOf:['goal'],commandsRun:[{command:'check',status:'passed'}],supplementalEvidence:[{at:1,by:'worker',attempt:3,note:'old note'}]})
  decideCheckpoint(source,'gate','approve','old-evidence','old-evidence','old approval')
  Object.assign(source.tasks[2],{status:'completed',attempt:2,output:'dependent old result',assignee:'other',reviewedAttempt:3,reviewedArtifacts:[{path:'report.md',present:false}]})
  source.tasks.push({...task('parallel'),assignee:'other',status:'completed',output:'preserve this'}, {...task('future',['after']),assignee:'other'})
  workflowState(source).discussions['discussion:check:gate']={key:'check:gate',messages:[],calls:[],materials:'old materials',evidence:'old-evidence',materialsRound:1,native:{sessionId:'review-session',label:'review',reviewEvidence:'old-evidence'}}
  const before=structuredClone(source)
  const result=applyWorkflowOperations(source,[{action:'update_member',name:'worker',executionPrompt:'New PE'},{action:'rerun_task',id:'t1',instructions:'Check again'}])
  assert.deepEqual(source,before,'proposal validation is pure')
  assert.equal(result.tasks.length,source.tasks.length); assert.equal(result.taskSeq,source.taskSeq)
  assert.deepEqual(result.tasks.map(t=>[t.id,t.dependencies]),source.tasks.map(t=>[t.id,t.dependencies]),'IDs and connections do not change')
  const selected=result.tasks[0]
  assert.equal(selected.status,'pending'); assert.equal(selected.workflowPaused,false); assert.equal(selected.attempt,3,'generation stays monotonic')
  assert.equal(selected.attemptId,undefined); assert.equal(selected.output,undefined); assert.equal(selected.supplementalEvidence,undefined)
  assert.equal(selected.commandsRun,undefined); assert.match(selected.description,/Check again/)
  assert.equal(selected.profileSeedId,'seed'); assert.deepEqual(selected.deliverables,['report.md']); assert.deepEqual(selected.coverageOf,['goal'])
  for(const id of ['gate','after','future']) {
    const item=result.tasks.find(t=>t.id===id)
    assert.equal(item.status,'pending'); assert.equal(item.workflowPaused,true); assert.equal(item.workflowRerunRequired,true); assert.equal(item.output,undefined)
  }
  assert.equal(result.tasks[2].reviewedAttempt,undefined); assert.equal(result.tasks[2].reviewedArtifacts,undefined)
  assert.equal(result.tasks[1].checkpoint.round,2); assert.equal(result.tasks[1].checkpoint.decision,undefined); assert.equal(result.tasks[1].checkpoint.history.length,1)
  assert.deepEqual(result.tasks.find(t=>t.id==='parallel'),source.tasks.find(t=>t.id==='parallel'))
  assert.deepEqual(result.members[1],source.members[1]); assert.equal(result.members[0].executionPrompt,'New PE')
  assert.equal(checkpointReady(result,result.tasks[1]),false)
  const review=result.workflow.discussions['discussion:check:gate']
  assert.equal(review.materials,undefined);assert.equal(review.evidence,undefined);assert.equal(review.materialsRound,undefined);assert.equal(review.native.reviewEvidence,undefined);assert.equal(review.native.sessionId,'review-session','discussion context is retained while obsolete materials are invalidated')
  assert.deepEqual(rerunImpact(source.tasks,'t1').descendants.map(t=>t.id),['gate','after','future'])
})

test('rerun rejects active work and invalid targets without partially saving member changes', () => {
  for(const mutate of [s=>s.tasks[0].status='pending',s=>s.phase='staged',s=>s.halted=true,s=>s.members[0].status='removed',s=>s.members[0].stopping=true,s=>s.tasks[2].status='in_progress',s=>s.tasks.push({...task('busy'),status:'claimed'})]) {
    const source=withGate();source.tasks[0].status='completed';mutate(source)
    const before=structuredClone(source)
    assert.throws(()=>applyWorkflowOperations(source,[{action:'update_member',name:'worker',summary:'must not save'},{action:'rerun_task',id:'t1'}]))
    assert.deepEqual(source,before)
  }
  const source=withGate();source.tasks[0].status='completed'
  assert.throws(()=>applyWorkflowOperations(source,[{action:'rerun_task',id:'gate'}]),/只能重跑/)
  assert.throws(()=>applyWorkflowOperations(source,[{action:'rerun_task',id:'missing'}]),/不存在/)
  assert.deepEqual(rerunnableTasks(source.tasks,'worker').map(t=>t.id),['t1'])
  assert.deepEqual(parseWorkflowOperations([{action:'rerun_task',id:'t1',instructions:' fix ',output:'untrusted'}]),[{action:'rerun_task',id:'t1',instructions:'fix'}])
})

test('rerun route dispatches one task; downstream waits for manual confirmation and new human approval', async t => {
  const root=mkdtempSync(join(tmpdir(),'workflow-rerun-'));t.after(()=>rmSync(root,{recursive:true,force:true}))
  const source=withGate();Object.assign(source.tasks[0],{status:'completed',output:'OLD RESULT',attempt:1,attemptId:'old-capability'})
  source.members.push({...member,name:'other'})
  Object.assign(source.tasks[2],{status:'completed',output:'OLD DOWNSTREAM',attempt:1,assignee:'other'})
  decideCheckpoint(source,'gate','approve','old','old','previous approval')
  source.tasks.push({...task('parallel'),assignee:'other',status:'completed',output:'UNRELATED'})
  await createTeamDir(join(root,'.agent-teams'),source)
  const captain={id:'captain-id',status:'idle',session:{header:{cwd:root},ownEvents:()=>[]}}
  const dispatched=[];let route,status,response
  const ctx={agents:{get:id=>id===captain.id?captain:undefined},on(){},effect:fn=>fn(),logger:{warn:message=>{throw Error(message)}}}
  const scheduler=installTeamScheduler(ctx,{stateDir:'.agent-teams',dispatch:async(...args)=>{dispatched.push(args);return true}})
  installWorkflowWorkbench(ctx,{stateDir:'.agent-teams',maxMembers:8},scheduler,{register:value=>{route=value;return()=>{}}})
  const read=()=>readTeam(join(root,'.agent-teams'),'demo')
  async function send(action,extra={}) {const req=Readable.from([JSON.stringify({sessionId:captain.id,teamId:'demo',action,...action==='resume_task'?{base:workflowFingerprint(await read())}:{},...extra})]);req.method='POST';req.headers={};await route.handler(req,{writeHead:code=>{status=code},end:body=>{response=JSON.parse(body)}})}
  await send('edit',{base:workflowFingerprint(source),title:'Edit and rerun',operations:[{action:'update_member',name:'worker',role:'Adjusted role'},{action:'rerun_task',id:'t1'}]})
  assert.equal(status,200,JSON.stringify(response));assert.equal(dispatched.length,1);assert.equal(dispatched[0][2],'worker');assert.match(dispatched[0][3],/Task: t1/)
  let saved=await read();assert.equal(saved.tasks[0].attempt,2);assert.notEqual(saved.tasks[0].attemptId,'old-capability');assert.equal(saved.members[0].role,'Adjusted role')
  await send('resume_task',{taskId:'gate'});assert.equal(status,409);assert.match(response.error,/上游/)
  saved=await read();Object.assign(saved.tasks[0],{status:'completed',output:'NEW RESULT'});saved.members[0].status='idle';await writeTeam(join(root,'.agent-teams'),saved)
  await scheduler.kickTeam(root,'demo',captain);assert.equal(dispatched.length,1,'completion alone cannot release descendants')
  await send('resume_task',{taskId:'gate',base:'stale'});assert.equal(status,409);assert.match(response.error,/重新确认/)
  await send('state');assert.deepEqual(response.ready,[],'suspended gate is not ready for review')
  await send('resume_task',{taskId:'after'});assert.equal(status,409,'transitive consumer also waits for its direct predecessor')
  await send('resume_task',{taskId:'gate'});assert.equal(status,200);assert.deepEqual(response.ready,['gate']);assert.equal(dispatched.length,1,'checkpoint never dispatched')
  saved=await read();const materials=workflowMaterials(saved,'gate',root)
  assert.match(materials.text,/NEW RESULT/);assert.doesNotMatch(materials.text,/OLD RESULT|OLD DOWNSTREAM/)
  assert.throws(()=>decideCheckpoint(saved,'gate','approve','old',materials.evidence,''),/材料已变化/)
  decideCheckpoint(saved,'gate','approve',materials.evidence,materials.evidence,'new approval');await writeTeam(join(root,'.agent-teams'),saved)
  await scheduler.kickTeam(root,'demo',captain);assert.equal(dispatched.length,1,'approval does not auto-release paused downstream')
  await send('edit',{base:workflowFingerprint(await read()),title:'Adjust suspended task',operations:[{action:'update_task',id:'after',description:'Use the new input'}]})
  assert.equal(status,200,JSON.stringify(response));assert.equal(dispatched.length,1)
  await send('resume_task',{taskId:'after'});assert.equal(status,200);assert.equal(dispatched.length,2);assert.equal(dispatched[1][2],'other');assert.match(dispatched[1][3],/NEW RESULT/);assert.doesNotMatch(dispatched[1][3],/OLD RESULT/)
  saved=await read();assert.equal(saved.tasks[2].attempt,2);assert.deepEqual(saved.tasks.find(t=>t.id==='parallel'),source.tasks.find(t=>t.id==='parallel'))
  Object.assign(saved.tasks[0],{status:'completed',output:'NEW RESULT'});saved.members[0].status='idle';saved.tasks[2].status='completed';saved.members[1].status='idle';await writeTeam(join(root,'.agent-teams'),saved)
  await send('edit',{base:workflowFingerprint(saved),title:'Rerun again',operations:[{action:'rerun_task',id:'t1'}]})
  assert.equal(status,200);assert.equal(dispatched.length,3);assert.equal((await read()).tasks.length,source.tasks.length,'repeated reruns overwrite in place')
})

test('suspension survives reload and malformed confirmation flags fail the durable boundary', async t => {
  const root=mkdtempSync(join(tmpdir(),'workflow-rerun-state-'));t.after(()=>rmSync(root,{recursive:true,force:true}))
  const source=withGate();source.tasks[0].status='completed'
  const updated=applyWorkflowOperations(source,[{action:'rerun_task',id:'t1'}]);await createTeamDir(root,updated)
  assert.equal((await readTeam(root,'demo')).tasks[1].workflowRerunRequired,true)
  const cancelled=structuredClone(updated.tasks[2]);cancelUnfinishedTask(cancelled,'stop')
  assert.equal(cancelled.status,'cancelled');assert.equal(cancelled.workflowPaused,false);assert.equal(cancelled.workflowRerunRequired,false,'stopping the team must remove pending confirmation badges')
  updated.tasks[1].workflowRerunRequired='true';writeFileSync(join(root,'demo','team.json'),JSON.stringify(updated))
  await assert.rejects(readTeam(root,'demo'),/invalid AgentTeams state/)
})

test('malformed model operations explain the required action discriminator', () => {
  for (const operation of [{ type: 'update_member', name: 'worker' }, { op: 'update_member' }, { update_member: { name: 'worker' } }]) {
    assert.throws(() => parseWorkflowOperations([operation]), /action.*update_member/)
  }
  assert.deepEqual(parseWorkflowOperations([{ action: 'update_member', name: 'worker', summary: 'Three items' }]), [{ action: 'update_member', name: 'worker', summary: 'Three items' }])
})

test('manual numeric IDs advance the sequence used by original task tools', () => {
  const result = applyWorkflowOperations(team(), [{ action: 'add_task', id: 't20', subject: 'Manual', dependencies: [] }])
  assert.equal(result.taskSeq, 20)
  assert.equal(result.tasks.some(t => t.id === `t${result.taskSeq + 1}`), false)
})

test('cold read recovers the sequence of teams saved by early canvas builds', async t => {
  const root = mkdtempSync(join(tmpdir(), 'workflow-sequence-')); t.after(() => rmSync(root, { recursive: true, force: true }))
  const source = team(); source.tasks.push(task('t20'))
  await createTeamDir(root, source)
  assert.equal((await readTeam(root, source.id)).taskSeq, 20)
})

test('rework preserves the complete work order but does not inherit execution evidence', () => {
  const source = withGate()
  Object.assign(source.tasks[0], { status: 'completed', output: 'old output', deliverables: ['report.md'], nonGoals: ['deploy'], coverageOf: ['request-1'], sourceFindingIds: ['f1'], findingSourceTaskIds: ['review-0'], round: 2, commandsRun: [{ command: 'test', status: 'passed' }] })
  decideCheckpoint(source, 'gate', 'reject', 'a', 'a', 'fix report')
  const result = applyWorkflowOperations(source, [{ action: 'rework', id: 'gate', taskIds: ['t1'], instructions: 'Fix' }])
  const rerun = result.tasks.at(-1)
  for (const field of ['deliverables', 'nonGoals', 'coverageOf', 'sourceFindingIds', 'findingSourceTaskIds', 'round']) assert.deepEqual(rerun[field], source.tasks[0][field], field)
  assert.equal(rerun.output, undefined)
  assert.equal(rerun.commandsRun, undefined)
})

test('corrupt workflow and stopped-attempt records fail at the durable boundary', async t => {
  const root = mkdtempSync(join(tmpdir(), 'workflow-corrupt-')); t.after(() => rmSync(root, { recursive: true, force: true }))
  const source = team()
  await createTeamDir(root, source)
  assert.ok(await readTeam(root, source.id), 'legacy teams remain readable')
  workflowState(source)
  writeFileSync(join(root, source.id, 'team.json'), JSON.stringify(source))
  assert.ok(await readTeam(root, source.id))
  for (const workflow of [{}, { positions: {}, discussions: { 'discussion:graph': null }, history: [] }, { positions: {}, discussions: {}, history: [{ id: 'p', base: 'b', title: 'bad', status: 'pending', createdAt: 1, operations: [{ action: 'rework', id: 'g', taskIds: null }] }] }]) {
    writeFileSync(join(root, source.id, 'team.json'), JSON.stringify({ ...source, workflow }))
    await assert.rejects(readTeam(root, source.id), /invalid AgentTeams state/)
  }
  source.tasks[0].stoppedAttempts = [null]
  writeFileSync(join(root, source.id, 'team.json'), JSON.stringify(source))
  await assert.rejects(readTeam(root, source.id), /invalid AgentTeams state/)
})

test('canvas insertion replaces bypass edges atomically and preserves unrelated parents', () => {
  const source = team()
  source.tasks.push(task('t2'), task('next', ['t1', 't2']), task('parallel', ['t1']))
  const operations = taskDraftOperations(source, { checkpoint: true, subject: 'Review', dependencies: ['t1'], successors: ['next'] })
  assert.equal(operations[0].id, 't3', 'draft IDs skip existing aliases')
  const proposal = proposeWorkflow(source, 'Insert gate', operations)
  assert.deepEqual(source.tasks.find(t => t.id === 'next').dependencies, ['t1', 't2'], 'preview does not mutate execution')
  const result = applyWorkflowProposal(source, proposal)
  assert.deepEqual(result.tasks.find(t => t.id === 'next').dependencies, ['t2', 't3'])
  assert.deepEqual(result.tasks.find(t => t.id === 'parallel').dependencies, ['t1'])
  assert.deepEqual(result.tasks.find(t => t.id === 't3').dependencies, ['t1'])
  assert.equal(result.tasks.find(t => t.id === 't3').checkpoint.round, 1)
})

test('editing successors removes only deselected edges; rejected cycles and active targets leave source unchanged', () => {
  const source = withGate()
  const operations = taskDraftOperations(source, { id: 'gate', checkpoint: true, subject: 'Review', dependencies: ['t1'], successors: [] })
  const result = applyWorkflowOperations(source, operations)
  assert.deepEqual(result.tasks.find(t => t.id === 'after').dependencies, [])
  assert.deepEqual(source.tasks.find(t => t.id === 'after').dependencies, ['gate'])
  const cycle = taskDraftOperations(source, { checkpoint: false, subject: 'Cycle', dependencies: ['after'], successors: ['t1'] })
  assert.throws(() => applyWorkflowOperations(source, cycle), /循环|cycle/i)
  source.tasks.find(t => t.id === 'after').status = 'in_progress'
  const original = structuredClone(source)
  assert.throws(() => applyWorkflowOperations(source, taskDraftOperations(source, { checkpoint: true, subject: 'Too late', dependencies: ['gate'], successors: ['after'] })))
  assert.deepEqual(source, original)
})

test('connection magnet accepts node interiors and rejects duplicate, cyclic and active targets', () => {
  const tasks = [task('a'), task('b', ['a']), task('c')]
  const positions = { a: { x: 20, y: 20 }, b: { x: 290, y: 20 }, c: { x: 20, y: 180 } }
  assert.equal(connectionTarget(tasks, id => positions[id], { x: 105, y: 230 }, 'a').id, 'c')
  assert.equal(connectionTarget(tasks, id => positions[id], { x: -15, y: 235 }, 'a').id, 'c')
  assert.equal(connectionTarget(tasks, id => positions[id], { x: 900, y: 900 }, 'a'), undefined)
  assert.match(connectionIssue(tasks, 'a', 'b'), /已存在/)
  assert.match(connectionIssue(tasks, 'b', 'a'), /循环/)
  assert.match(connectionIssue(tasks, 'a', 'a'), /自身/)
  assert.equal(connectionIssue(tasks, 'a', 'c'), undefined)
  tasks[2].status = 'in_progress'
  assert.match(connectionIssue(tasks, 'a', 'c'), /停止/)
  Object.assign(tasks[2],{status:'pending',attempt:2,workflowPaused:true,workflowRerunRequired:true})
  assert.equal(connectionIssue(tasks,'a','c'),undefined,'suspended downstream nodes remain editable with drawio connections')
})

test('native discussion and return-to-captain navigation open ordinary sessions', async () => {
  const seen = []
  await openAgentTeamMember({}, 'discussion', 'discussion', { selectPanel: value => seen.push(value) }, { openSession: value => seen.push(value) })
  assert.deepEqual(seen, ['discussion', null])
})

test('restored native discussion is restricted and cannot propose outside its own scope', async t => {
  const root = mkdtempSync(join(tmpdir(), 'workflow-native-')); t.after(() => rmSync(root, { recursive: true, force: true }))
  const source = team(), label = 'native-label', nativeId = `session-at-discussion-${createHash('sha256').update('demo').digest('hex').slice(0, 16)}-00000000-0000-0000-0000-000000000001`
  source.tasks[0].status='completed'
  workflowState(source).discussions['discussion:member:worker'] = { key: 'member:worker', messages: [], calls: [], native: { sessionId: nativeId, label } }
  source.members.push({ ...source.members[0], name: 'unrelated' })
  source.tasks.push({ ...task('unrelated-task'), assignee: 'unrelated', output: 'UNRELATED EXECUTION' })
  await createTeamDir(join(root, '.agent-teams'), source)
  const definitions = new Map(); let setup
  const ctx = { tools: { register: definition => definitions.set(definition.name, definition) }, subagents: { registerContinuableSetup: fn => { setup = fn } } }
  installWorkflowConversations(ctx, { stateDir: '.agent-teams', maxMembers: 8 }, workflowMaterials)
  const restricted = []
  const agent = { id: nativeId, session: { header: { cwd: root }, ownEvents: () => [] } }
  const agentCtx = { agent, tools: { restrict: filter => { restricted.push(filter); return () => {} } }, systemPrompt: { section: () => () => {}, getSectionOrder: () => 0 }, on: () => () => {} }
  const dispose = setup(agentCtx)
  assert.deepEqual(restricted, [{ allow: ['agent_teams_workflow_context', 'agent_teams_workflow_propose'] }])
  const exec = { agent, signal: new AbortController().signal }
  const context = JSON.parse(await definitions.get('agent_teams_workflow_context').execute({}, exec))
  assert.equal(context.team.members.length, 1)
  assert.ok(context.team.tasks.every(task => task.assignee === 'worker'))
  assert.doesNotMatch(JSON.stringify(context), /UNRELATED EXECUTION/)
  assert.equal(context.team.members[0].runtimeSetup, undefined)
  const propose = args => definitions.get('agent_teams_workflow_propose').execute({ base: context.base, title: 'edit', operations: JSON.stringify(args) }, exec)
  await assert.rejects(propose([{ action: 'add_member', name: 'other', summary: 'other scope' }]), /只能调整/)
  await propose([{ action: 'update_member', name: 'worker', summary: 'new summary' }])
  await propose([{action:'rerun_task',id:'t1',instructions:'Only after human approval'}])
  await assert.rejects(propose([{action:'rerun_task',id:'unrelated-task'}]))
  const persisted = await readTeam(join(root, '.agent-teams'), 'demo')
  assert.equal(persisted.members[0].summary, undefined)
  assert.equal(persisted.tasks[0].status,'completed','proposing a rerun cannot execute it')
  assert.equal(persisted.workflow.discussions['discussion:member:worker'].proposal.status, 'pending')
  const intruder = { ...agent, id: nativeId.replace(/1$/, '2') }
  await assert.rejects(definitions.get('agent_teams_workflow_context').execute({}, { ...exec, agent: intruder }), /失效|关联记录缺失/)
  dispose()
})

test('fresh member discussion creates an independent session seeded with member facts and user intent', async t => {
  const root = mkdtempSync(join(tmpdir(), 'workflow-fresh-')); t.after(() => rmSync(root, { recursive: true, force: true }))
  const source = team(); source.members[0].summary = 'Review requirements'; source.members[0].executionPrompt = 'Check acceptance criteria'
  workflowState(source).discussions['discussion:member:worker'] = { key: 'member:worker', messages: [{ role: 'user', text: 'OLD HISTORY' }], calls: [], native: { sessionId: 'old-discussion', label: 'old' } }
  await createTeamDir(join(root, '.agent-teams'), source)
  let spec; const prompts = [], filters = [], grouped = []
  const ctx = { tools: { register() {} }, subagents: { registerContinuableSetup() {} }, llm: { resolveCallConfig: async value => value }, effect() {}, sessions: { flush: async () => {} }, agents: {
    get: () => ({ status: 'idle' }), create: async value => { spec = value; value.setup({ effect: fn => fn(), tools: { restrict: filter => { filters.push(filter); return () => {} } } }); return { agent: { id: value.sessionId, session: {}, whenIdle: async () => {}, followup: message => prompts.push(message) }, dispose() {} } },
  } }
  ctx.get = key => key === 'workspaceRegistry' ? { list: () => [{ sessionIds: ['captain-id'], attachSession: async id => grouped.push(id) }, { sessionIds: ['other-captain'], attachSession: () => { throw Error('wrong workspace') } }] } : undefined
  const runtime = installWorkflowConversations(ctx, { stateDir: '.agent-teams', maxMembers: 8 }, workflowMaterials)
  const captain = { id: 'captain-id', options: { provider: 'fake', model: 'fake' }, session: { header: { cwd: root }, requestHeader: () => ({ config: {} }) } }
  const id = await runtime.open(captain, source, 'member:worker', join(root, '.agent-teams'), { fresh: true, message: 'Focus on requirement risks' })
  assert.deepEqual(grouped, [id])
  assert.notEqual(id, captain.id); assert.notEqual(id, 'old-discussion')
  assert.equal(spec.resumeSessionId, undefined); assert.equal(spec.parentSessionId, undefined)
  assert.match(prompts[0].content[0].text, /Review requirements/)
  assert.match(prompts[0].content[0].text, /^## 独立讨论：worker/)
  assert.match(prompts[0].content[0].text, /### 执行指令（PE）/)
  assert.match(prompts[0].content[0].text, /### 已分配任务/)
  assert.match(prompts[0].content[0].text, /Check acceptance criteria/)
  assert.match(prompts[0].content[0].text, /Focus on requirement risks/)
  assert.doesNotMatch(prompts[0].content[0].text, /OLD HISTORY/)
  assert.deepEqual(filters, [{ allow: ['agent_teams_workflow_context', 'agent_teams_workflow_propose'] }])
  assert.ok(Object.entries(source.workflow.discussions).some(([key, value]) => key.startsWith('archive:') && value.native.sessionId === 'old-discussion'))
  const secondId = await runtime.open(captain, source, 'member:worker', join(root, '.agent-teams'), { fresh: true })
  assert.notEqual(secondId, id)
  assert.deepEqual(grouped, [id, secondId])
  assert.match(prompts[1].content[0].text, /询问我希望如何调整/)
  assert.ok(Object.entries(source.workflow.discussions).some(([key, value]) => key.startsWith('archive:') && value.native.sessionId === id))
})

test('independent workflow conversations navigate as ordinary sessions on both modern and legacy hosts', async () => {
  const target = 'session-at-discussion-example', calls = []
  const openMember = (parent, child) => openAgentTeamMember({ open: id => calls.push(['legacy', id]), openSubagent: () => { throw new Error('independent discussion must not use subagent navigation') }, refreshSubagents: async () => { throw new Error('unexpected catalog refresh') } }, parent, child, { selectPanel: () => {} }, { openSession: id => calls.push(['workspace', id]) })
  await openWorkflowConversation(openMember, target)
  assert.deepEqual(calls, [['workspace', target]])
  await openWorkflowConversation((parent, child) => openAgentTeamMember({ open: id => calls.push(['legacy', id]) }, parent, child), target)
  assert.deepEqual(calls[1], ['legacy', target])
})

test('direct graph edits persist atomically, reject stale bases and cycles, and pause newly added running work', async t => {
  const root = mkdtempSync(join(tmpdir(), 'workflow-edit-')); t.after(() => rmSync(root, { recursive: true, force: true }))
  const source = team(); source.tasks.push({ ...task('t2'), dependencies: [] })
  await createTeamDir(join(root, '.agent-teams'), source)
  const captain = { id: 'captain-id', session: { header: { cwd: root }, ownEvents: () => [] }, status: 'idle' }
  let route, status, result
  const ctx = { agents: { get: () => captain }, effect: fn => fn(), logger: { warn() {} } }
  installWorkflowWorkbench(ctx, { stateDir: '.agent-teams', maxMembers: 8 }, { kickTeam: async () => {} }, { register: value => { route = value; return () => {} } })
  async function send(operations, base, positions) {
    const req = Readable.from([JSON.stringify({ sessionId: captain.id, teamId: 'demo', action: 'edit', title: 'Canvas edit', operations, base, positions })]); req.method = 'POST'; req.headers = {}
    await route.handler(req, { writeHead: code => { status = code }, end: body => { result = JSON.parse(body) } })
  }
  const original = workflowFingerprint(source)
  await send([{ action: 'update_task', id: 't2', dependencies: ['t1'] }], original, { t1: { x: 100, y: 180 }, t2: { x: 400, y: 280 } })
  assert.equal(status, 200, JSON.stringify(result)); assert.deepEqual(result.team.tasks[1].dependencies, ['t1'])
  assert.deepEqual(result.team.workflow.positions['task:t2'], { x: 400, y: 280 })
  await send([{ action: 'update_task', id: 't2', dependencies: [] }], original)
  assert.equal(status, 409); assert.match(result.error, /团队已变化/)
  let current = await readTeam(join(root, '.agent-teams'), 'demo')
  await send([{ action: 'update_task', id: 't1', dependencies: ['t2'] }], workflowFingerprint(current))
  assert.equal(status, 409)
  await send([{ action: 'update_task', id: 't2', dependencies: [] }], workflowFingerprint(current))
  assert.equal(status, 200); assert.deepEqual(result.team.tasks[1].dependencies, [])
  await send([{ action: 'add_task', subject: 'Wire before running', dependencies: [] }], result.base)
  assert.equal(status, 200); assert.equal(result.team.tasks.at(-1).workflowPaused, true)
  const addedId = result.team.tasks.at(-1).id
  await send([{ action: 'update_task', id: addedId, dependencies: ['t2'] }], result.base)
  assert.equal(status, 200)
  current = await readTeam(join(root, '.agent-teams'), 'demo')
  assert.equal(current.tasks.find(task => task.id === addedId).subject, 'Wire before running')
  assert.deepEqual(current.tasks.find(task => task.id === addedId).dependencies, ['t2'])
  assert.equal(current.tasks.find(task => task.id === addedId).workflowPaused, true)
  const beforeLayout = workflowFingerprint(current)
  async function layout(positions) {
    const req = Readable.from([JSON.stringify({ sessionId: captain.id, teamId: 'demo', action: 'layout', positions })]); req.method = 'POST'; req.headers = {}
    await route.handler(req, { writeHead: code => { status = code }, end: body => { result = JSON.parse(body) } })
  }
  const arranged = arrangeTasks(current.tasks)
  await layout(arranged)
  assert.equal(status, 200)
  assert.equal(workflowFingerprint(result.team), beforeLayout, 'layout must not change execution or invalidate proposals')
  assert.deepEqual(result.team.workflow.positions[`task:${addedId}`], arranged[addedId])
  await layout({ t1: { x: 9, y: 9 }, t2: { x: -1, y: 0 } })
  assert.equal(status, 409)
  current = await readTeam(join(root, '.agent-teams'), 'demo')
  assert.deepEqual(current.workflow.positions['task:t1'], arranged.t1, 'invalid batch cannot partially move nodes')
  await layout({ missing: { x: 0, y: 0 } })
  assert.equal(status, 409)
})

test('canvas layout separates branching cards and fits tall as well as wide graphs', () => {
  const tasks = [task('a'), task('b'), task('c', ['a']), task('d', ['a', 'b']), task('e', ['c', 'd'])]
  const points = arrangeTasks(tasks)
  for (const a of tasks) for (const b of tasks) {
    if (a.id === b.id) continue
    assert.ok(Math.abs(points[a.id].x - points[b.id].x) >= 225 || Math.abs(points[a.id].y - points[b.id].y) >= 150)
  }
  for (const item of tasks) for (const dep of item.dependencies) assert.ok(points[item.id].x > points[dep].x)
  assert.ok(fitGraph(800, 400, 600, 1200) * 1200 <= 368)
  assert.ok(fitGraph(400, 800, 1200, 600) * 1200 <= 368)
  assert.equal(fitGraph(1200, 800, 600, 400), 1)
})

test('opening a new review round refreshes the native conversation once', async t => {
  const root = mkdtempSync(join(tmpdir(), 'workflow-round-')); t.after(() => rmSync(root, { recursive: true, force: true }))
  const source = withGate(); source.tasks[0].status = 'completed'; source.tasks[1].checkpoint.round = 2
  workflowState(source).discussions['discussion:check:gate'] = { key: 'check:gate', messages: [], calls: [], native: { sessionId: 'review', label: 'review', reviewEvidence: 'old' } }
  await createTeamDir(join(root, '.agent-teams'), source)
  const prompts = []
  const ctx = { tools: { register() {} }, subagents: { registerContinuableSetup() {} }, agents: { get: () => ({ status: 'idle', followup: message => prompts.push(message) }) } }
  const runtime = installWorkflowConversations(ctx, { stateDir: '.agent-teams', maxMembers: 8 }, () => ({ text: 'new evidence', evidence: 'new' }))
  const captain = { session: { header: { cwd: root } } }
  await runtime.open(captain, source, 'check:gate', join(root, '.agent-teams'))
  await runtime.open(captain, source, 'check:gate', join(root, '.agent-teams'))
  assert.equal(prompts.length, 1)
  assert.match(prompts[0].content[0].text, /第 2 轮/)
  assert.equal(source.tasks[1].status, 'pending')
})
test('configuration proposal is isolated until applied and cannot be replayed', () => {
  const source = team(), before = structuredClone(source)
  const proposal = proposeWorkflow(source, 'new role', [{ action: 'update_member', name: 'worker', summary: 'Review code', role: 'reviewer', executionPrompt: 'Read only' }])
  assert.deepEqual(source, before)
  const result = applyWorkflowProposal(source, proposal)
  assert.equal(result.members[0].role, 'reviewer'); assert.equal(source.members[0].role, 'developer')
  assert.throws(() => applyWorkflowProposal(result, proposal), /已变化/)
})
test('execution progress invalidates a pending proposal, discussion and layout do not', () => {
  const source = team(), proposal = proposeWorkflow(source, 'edit', [{ action: 'update_task', id: 't1', subject: 'updated' }])
  workflowState(source).positions['task:t1'] = { x: 25, y: 30 }
  assert.equal(applyWorkflowProposal(source, proposal).tasks[0].subject, 'updated')
  source.tasks[0].status = 'claimed'
  assert.throws(() => applyWorkflowProposal(source, proposal), /已变化/)
})
test('cycle or dangling link rejects an entire multi-operation edit', () => {
  const source = withGate(), before = structuredClone(source)
  assert.throws(() => applyWorkflowOperations(source, [{ action: 'update_member', name: 'worker', summary: 'changed' }, { action: 'update_task', id: 't1', dependencies: ['after'] }]), /循环/)
  assert.deepEqual(source, before)
  assert.throws(() => applyWorkflowOperations(source, [{ action: 'update_task', id: 't1', dependencies: ['missing'] }]), /不存在|does not exist/)
})
test('active work and active member instructions cannot change until stopped', () => {
  const source = team(); source.tasks[0].status = 'in_progress'; source.tasks[0].attempt = 1
  assert.throws(() => applyWorkflowOperations(source, [{ action: 'update_member', name: 'worker', role: 'other' }]), /先停止/)
  assert.throws(() => applyWorkflowOperations(source, [{ action: 'update_task', id: 't1', description: 'other' }]), /已开始/)
})
test('completed work is immutable, and members with pending assignments cannot be removed', () => {
  const source = team()
  assert.throws(() => applyWorkflowOperations(source, [{ action: 'remove_member', name: 'worker' }]), /重新分配/)
  source.tasks[0].status = 'completed'
  assert.throws(() => applyWorkflowOperations(source, [{ action: 'update_task', id: 't1', subject: 'rewrite' }]), /已开始/)
  const removed = applyWorkflowOperations(source, [{ action: 'remove_member', name: 'worker' }])
  assert.equal(removed.members[0].status, 'removed'); assert.equal(removed.tasks[0].assignee, 'worker')
})
test('malformed model proposals cannot smuggle approvals or unsupported operations', () => {
  assert.throws(() => parseWorkflowOperations([{ action: 'approve', id: 'gate' }]), /未知/)
  assert.throws(() => parseWorkflowOperations([{ action: 'add_task', subject: 'gate', dependencies: [], checkpoint: 'yes' }]), /布尔/)
  const ops = parseWorkflowOperations([{ action: 'update_task', id: 't1', status: 'completed' }])
  assert.equal(ops[0].status, undefined)
})
test('checkpoint stays blocked until upstream completes; only current evidence is accepted', () => {
  const source = withGate(), gate = source.tasks[1]
  assert.equal(checkpointReady(source, gate), false)
  assert.throws(() => decideCheckpoint(source, 'gate', 'approve', 'a', 'a', ''), /不能验收/)
  source.tasks[0].status = 'completed'
  assert.equal(checkpointReady(source, gate), true)
  assert.throws(() => decideCheckpoint(source, 'gate', 'approve', 'a', 'b', ''), /材料已变化/)
  decideCheckpoint(source, 'gate', 'approve', 'a', 'a', 'reviewed')
  assert.equal(gate.status, 'completed'); assert.equal(gate.checkpoint.history[0].note, 'reviewed')
  assert.throws(() => decideCheckpoint(source, 'gate', 'approve', 'a', 'a', ''), /不能验收/)
})
test('reject preserves downstream blocking; confirmed rework creates new attempts without rewriting history', () => {
  const source = withGate(); source.tasks[0].status = 'completed'; source.tasks[0].output = 'first result'
  decideCheckpoint(source, 'gate', 'reject', 'a', 'a', 'missing evidence')
  assert.equal(source.tasks[1].status, 'pending')
  const result = applyWorkflowOperations(source, [{ action: 'rework', id: 'gate', taskIds: ['t1'], instructions: 'Add evidence' }])
  assert.equal(result.tasks[0].output, 'first result'); assert.equal(result.tasks[0].status, 'completed')
  assert.equal(result.tasks[1].checkpoint.round, 2); assert.equal(result.tasks[1].checkpoint.history.length, 1)
  assert.notEqual(result.tasks[1].dependencies[0], 't1')
  assert.equal(result.tasks.at(-1).status, 'pending'); assert.equal(checkpointReady(result, result.tasks[1]), false)
})
test('rework also repeats downstream computation before the checkpoint', () => {
  const source = applyWorkflowOperations(team(), [{ action: 'add_task', id: 'build', subject: 'Build', dependencies: ['t1'] }, { action: 'add_task', id: 'gate', subject: 'Review', dependencies: ['build'], checkpoint: true }])
  source.tasks[0].status = source.tasks[1].status = 'completed'
  decideCheckpoint(source, 'gate', 'reject', 'a', 'a', '')
  const result = applyWorkflowOperations(source, [{ action: 'rework', id: 'gate', taskIds: ['t1'], instructions: 'Fix' }])
  assert.equal(result.tasks.length, 5)
  assert.deepEqual(result.tasks[4].dependencies, [result.tasks[3].id])
  assert.deepEqual(result.tasks[2].dependencies, [result.tasks[4].id])
})
test('artifact bytes changing invalidates review evidence, even if task results did not change', t => {
  const root = mkdtempSync(join(tmpdir(), 'workflow-evidence-')); t.after(() => rmSync(root, { recursive: true, force: true }))
  const source = withGate(); source.tasks[0].status = 'completed'; source.tasks[0].changedPaths = ['result.txt']
  writeFileSync(join(root, 'result.txt'), 'first')
  const first = workflowMaterials(source, 'gate', root)
  writeFileSync(join(root, 'result.txt'), 'second')
  const second = workflowMaterials(source, 'gate', root)
  assert.notEqual(first.evidence, second.evidence)
  assert.throws(() => decideCheckpoint(source, 'gate', 'approve', first.evidence, second.evidence, ''), /材料已变化/)
})
test('scheduler never dispatches a human checkpoint or a task paused for editing', async t => {
  const root = mkdtempSync(join(tmpdir(), 'workflow-scheduler-')); t.after(() => rmSync(root, { recursive: true, force: true }))
  const source = withGate(); source.tasks[0].status = 'completed'
  source.tasks.push({ ...task('paused'), workflowPaused: true })
  source.tasks.push({ ...task('unconfigured'), workflowConfigPending: true, workflowPaused: false })
  await createTeamDir(join(root, '.agent-teams'), source)
  const captain = { id: 'captain-id', session: { header: { cwd: root }, ownEvents: () => [] }, status: 'idle' }
  const dispatched = []
  const ctx = { agents: { get: id => id === captain.id ? captain : undefined }, on() {}, effect() {}, logger: { warn() {} } }
  const scheduler = installTeamScheduler(ctx, { stateDir: '.agent-teams', dispatch: async (...args) => { dispatched.push(args); return true } })
  await scheduler.kickTeam(root, 'demo', captain)
  assert.equal(dispatched.length, 0)
  assert.equal((await readTeam(join(root, '.agent-teams'), 'demo')).tasks[1].status, 'pending')
})
test('manual aliases cannot cause generated ID collisions and names respect durable identity', () => {
  const source = team()
  const result = applyWorkflowOperations(source, [{ action: 'add_task', id: 't2', subject: 'alias', dependencies: [] }, { action: 'add_task', subject: 'generated', dependencies: [] }])
  assert.equal(new Set(result.tasks.map(t => t.id)).size, 3)
  assert.throws(() => applyWorkflowOperations(source, [{ action: 'add_member', name: 'CAPTAIN', summary: 'reserved' }]), /保留/)
})
test('pausing a queued task preserves another running task and its member stop boundary; route disposes cleanly', async t => {
  const root = mkdtempSync(join(tmpdir(), 'workflow-pause-')); t.after(() => rmSync(root, { recursive: true, force: true }))
  const source = team()
  source.members[0].id = 'child'; source.members[0].status = 'working'; source.members[0].stopping = true
  source.tasks[0].status = 'in_progress'; source.tasks[0].attemptId = 'original-attempt'; source.tasks[0].attempt = 1
  source.tasks.push(task('queued'))
  await createTeamDir(join(root, '.agent-teams'), source)
  const captain = { id: 'captain-id', session: { header: { cwd: root }, ownEvents: () => [] }, status: 'idle' }
  const disposers = []; let route, removed = false, response, status
  const ctx = { agents: { get: id => id === captain.id ? captain : undefined }, effect: fn => disposers.push(fn()), logger: { warn() {} } }
  installWorkflowWorkbench(ctx, { stateDir: '.agent-teams', maxMembers: 8 }, {}, { register: value => { route = value; return () => { removed = true } } })
  const req = Readable.from([JSON.stringify({ sessionId: captain.id, teamId: 'demo', action: 'stop_task', taskId: 'queued' })]); req.method = 'POST'; req.headers = {}
  await route.handler(req, { writeHead: code => { status = code }, end: body => { response = JSON.parse(body) } })
  assert.equal(status, 200, JSON.stringify(response))
  assert.equal(response.team.tasks[1].workflowPaused, true)
  assert.equal(response.team.tasks[0].attemptId, 'original-attempt')
  assert.equal(response.team.members[0].stopping, true); assert.equal(response.team.members[0].id, 'child')
  disposers.reverse().forEach(dispose => dispose?.()); assert.equal(removed, true)
})

test('first human review opens an isolated conversation with checklist and stored evidence before the model responds', async t => {
  const root = mkdtempSync(join(tmpdir(), 'workflow-review-intro-')); t.after(() => rmSync(root, { recursive: true, force: true }))
  const source = withGate(); source.tasks[0].status = 'completed'; source.tasks[0].output = 'Implemented login validation'
  source.tasks[1].description = 'Check validation and error messages'
  await createTeamDir(join(root, '.agent-teams'), source)
  let spec; const prompts = []
  const ctx = { tools: { register() {} }, subagents: { registerContinuableSetup() {} }, llm: { resolveCallConfig: async value => value }, effect() {}, sessions: { flush: async () => {} }, agents: {
    get: () => ({ status: 'idle' }), create: async value => { spec = value; return { agent: { id: value.sessionId, session: {}, whenIdle: async () => {}, followup: message => prompts.push(message) }, dispose() {} } },
  } }
  const runtime = installWorkflowConversations(ctx, { stateDir: '.agent-teams', maxMembers: 8 }, workflowMaterials)
  const captain = { id: 'captain-id', options: { provider: 'fake', model: 'fake' }, session: { header: { cwd: root }, requestHeader: () => ({ config: {} }) } }
  const id = await runtime.open(captain, source, 'check:gate', join(root, '.agent-teams'))
  assert.notEqual(id, captain.id); assert.equal(spec.parentSessionId, undefined)
  assert.match(prompts[0].content[0].text, /^## 待你验收/)
  assert.match(prompts[0].content[0].text, /Check validation and error messages/)
  assert.match(prompts[0].content[0].text, /Implemented login validation/)
  const saved = await readTeam(join(root, '.agent-teams'), source.id)
  const discussion = saved.workflow.discussions['discussion:check:gate']
  assert.equal(discussion.materialsRound, 1)
  assert.equal(discussion.native.reviewEvidence, discussion.evidence)
  assert.match(discussion.materials, /Implemented login validation/)
  await runtime.open(captain, source, 'check:gate', join(root, '.agent-teams'))
  assert.equal(prompts.length, 1)
  assert.equal(source.tasks[1].checkpoint.decision, undefined)
})

test('member model and thinking changes validate and persist atomically in workflow edits', async t => {
  const root = mkdtempSync(join(tmpdir(), 'workflow-route-')); t.after(() => rmSync(root, { recursive: true, force: true }))
  const source = team(); source.phase = 'staged'; Object.assign(source.members[0], { activeProvider: 'old', activeModel: 'fallback', fallbackActive: true })
  await createTeamDir(join(root, '.agent-teams'), source)
  const captain = { id: 'captain-id', options: { provider: 'fixture', model: 'fixture' }, session: { header: { cwd: root }, requestHeader: () => ({ config: { provider: 'fixture', model: 'fixture' } }), ownEvents: () => [] }, status: 'idle' }
  let route, status, result
  const ctx = { agents: { get: () => captain }, llm: { resolveCallConfig: async config => { if (config.model === 'invalid') throw Error('unknown model'); return { ...config, reasoningEffort: config.reasoningEffort ?? 'medium' } } }, effect: fn => fn(), logger: { warn() {} } }
  installWorkflowWorkbench(ctx, { stateDir: '.agent-teams', maxMembers: 8 }, { kickTeam: async () => {} }, { register: value => { route = value; return () => {} } })
  async function send(operation, base) {
    const req = Readable.from([JSON.stringify({ sessionId: captain.id, teamId: source.id, action: 'edit', title: 'Change route', operations: [operation], base })]); req.method = 'POST'; req.headers = {}
    await route.handler(req, { writeHead: code => { status = code }, end: body => { result = JSON.parse(body) } })
  }
  await send({ action: 'update_member', name: 'worker', provider: 'fixture', model: 'model-b', reasoningEffort: 'high' }, workflowFingerprint(source))
  assert.equal(status, 200, JSON.stringify(result)); assert.equal(result.team.members[0].model, 'model-b'); assert.equal(result.team.members[0].reasoningEffort, 'high'); assert.equal(result.team.members[0].fallbackActive, undefined); assert.equal(result.team.members[0].activeModel, undefined)
  let saved = await readTeam(join(root, '.agent-teams'), source.id); assert.equal(saved.members[0].reasoningEffort, 'high')
  await send({ action: 'update_member', name: 'worker', provider: 'fixture', model: 'invalid', reasoningEffort: 'high', summary: 'should not save' }, workflowFingerprint(saved))
  assert.equal(status, 409); saved = await readTeam(join(root, '.agent-teams'), source.id); assert.equal(saved.members[0].model, 'model-b'); assert.notEqual(saved.members[0].summary, 'should not save')
  await send({ action: 'update_member', name: 'worker', provider: 'fixture', model: 'model-b', reasoningEffort: 'default' }, workflowFingerprint(saved))
  assert.equal(status, 200); assert.equal(result.team.members[0].reasoningEffort, 'medium')
})

test('human confirms a proposal directly from the bound independent discussion', async t => {
  const root = mkdtempSync(join(tmpdir(), 'workflow-inline-confirm-')); t.after(() => rmSync(root, { recursive: true, force: true }))
  const source = team(), nativeId = `session-at-discussion-${createHash('sha256').update('demo').digest('hex').slice(0, 16)}-00000000-0000-0000-0000-000000000002`
  const proposal = proposeWorkflow(source, 'Update member', [{ action: 'update_member', name: 'worker', summary: 'Updated after discussion' }])
  workflowState(source).discussions['discussion:member:worker'] = { key: 'member:worker', messages: [], calls: [], native: { sessionId: nativeId, label: 'native' }, proposal }
  await createTeamDir(join(root, '.agent-teams'), source)
  const captain = { id: 'captain-id', session: { header: { cwd: root }, ownEvents: () => [] }, status: 'idle' }
  const native = { id: nativeId, session: { header: { cwd: root }, ownEvents: () => [] }, status: 'idle' }
  let route, status, result
  const ctx = { agents: { get: id => id === captain.id ? captain : id === native.id ? native : undefined }, effect: fn => fn(), logger: { warn() {} } }
  installWorkflowWorkbench(ctx, { stateDir: '.agent-teams', maxMembers: 8 }, { kickTeam: async () => {} }, { register: value => { route = value; return () => {} } })
  const req = Readable.from([JSON.stringify({ action: 'apply', sessionId: nativeId, discussion: 'member:worker', teamId: source.id, proposalId: proposal.id })]); req.method = 'POST'; req.headers = {}
  await route.handler(req, { writeHead: code => { status = code }, end: body => { result = JSON.parse(body) } })
  assert.equal(status, 200, JSON.stringify(result)); assert.equal(result.currentDiscussion, 'member:worker')
  assert.equal((await readTeam(join(root, '.agent-teams'), source.id)).members[0].summary, 'Updated after discussion')
})

test('embedded discussion reads and sends only the bound isolated session', async t => {
  const root = mkdtempSync(join(tmpdir(), 'workflow-embedded-')); t.after(() => rmSync(root, { recursive: true, force: true }))
  const source = team(), nativeId = `session-at-discussion-${createHash('sha256').update('demo').digest('hex').slice(0, 16)}-00000000-0000-0000-0000-000000000003`
  workflowState(source).discussions['discussion:member:worker'] = { key: 'member:worker', messages: [], calls: [], native: { sessionId: nativeId, label: 'native' } }
  await createTeamDir(join(root, '.agent-teams'), source)
  const events = [{ type:'user/message', seq:1, data:{ source:{kind:'user'}, content:[{type:'text',text:'Original discussion'}] } }, { type:'assistant/message', seq:2, data:{ message:{ source:{kind:'model'}, content:[{type:'text',text:'AI response'}] } } }], sent = []
  const captain = { id:'captain-id', session:{header:{cwd:root},ownEvents:()=>[]},status:'idle' }
  const agent = { id:nativeId, session:{header:{cwd:root},ownEvents:()=>events},status:'idle',followup:message=>sent.push(message) }
  let route, status, result
  const ctx = { tools:{register(){}},subagents:{registerContinuableSetup(){}},agents:{get:id=>id===captain.id?captain:id===agent.id?agent:undefined},effect:fn=>fn(),logger:{warn(){}} }
  const conversations = installWorkflowConversations(ctx, {stateDir:'.agent-teams',maxMembers:8}, workflowMaterials)
  installWorkflowWorkbench(ctx, {stateDir:'.agent-teams',maxMembers:8}, {kickTeam:async()=>{}}, {register:value=>{route=value;return()=>{}}}, conversations)
  async function call(action, message, discussion = 'member:worker') { const req = Readable.from([JSON.stringify({sessionId:captain.id,teamId:'demo',discussion,action,message})]); req.method='POST'; req.headers={}; await route.handler(req,{writeHead:code=>{status=code},end:body=>{result=JSON.parse(body)}}) }
  await call('conversation_state'); assert.equal(status,200); assert.deepEqual(result.messages.map(m=>m.text), ['Original discussion','AI response'])
  await call('conversation_send','Make the role more specific'); assert.equal(status,200); assert.equal(sent[0].content[0].text,'Make the role more specific')
  assert.equal(captain.session.ownEvents().length,0)
  agent.status='running'; await call('conversation_send','another'); assert.equal(status,409); assert.equal(sent.length,1)
  await call('conversation_state',undefined,'graph'); assert.equal(status,409)
})

test('edited approval applies the human version, audits the AI suggestion and rejects stale or invalid changes', async t => {
  const root = mkdtempSync(join(tmpdir(), 'workflow-human-edit-')); t.after(() => rmSync(root, {recursive:true,force:true}))
  const source=team(); source.tasks.push(task('t2',['t1']))
  const proposal=proposeWorkflow(source,'AI suggestion',[{action:'update_member',name:'worker',summary:'AI version'}])
  workflowState(source).discussions['discussion:graph']={key:'graph',messages:[],calls:[],proposal}
  await createTeamDir(join(root,'.agent-teams'),source)
  const captain={id:'captain-id',session:{header:{cwd:root},ownEvents:()=>[]},status:'idle'}
  let route,status,result
  const ctx={agents:{get:()=>captain},effect:fn=>fn(),logger:{warn(){}}}
  installWorkflowWorkbench(ctx,{stateDir:'.agent-teams',maxMembers:8},{kickTeam:async()=>{}},{register:value=>{route=value;return()=>{}}})
  async function send(operations,id=proposal.id) { const req=Readable.from([JSON.stringify({action:'apply',sessionId:captain.id,teamId:source.id,discussion:'graph',proposalId:id,operations})]);req.method='POST';req.headers={};await route.handler(req,{writeHead:code=>{status=code},end:body=>{result=JSON.parse(body)}}) }
  await send([{action:'update_member',name:'worker',summary:'Wrong id'}],'replaced');assert.equal(status,409)
  await send([{action:'update_task',id:'t1',dependencies:['t2']}]);assert.equal(status,409)
  assert.equal((await readTeam(join(root,'.agent-teams'),source.id)).workflow.discussions['discussion:graph'].proposal.status,'pending')
  const current=await readTeam(join(root,'.agent-teams'),source.id);current.tasks[0].output='Concurrent result';await writeTeam(join(root,'.agent-teams'),current)
  await send([{action:'update_member',name:'worker',summary:'Human version'}]);assert.equal(status,409)
  await writeTeam(join(root,'.agent-teams'),source)
  await send([{action:'update_member',name:'worker',summary:'Human version'}]);assert.equal(status,200,JSON.stringify(result))
  const saved=await readTeam(join(root,'.agent-teams'),source.id)
  assert.equal(saved.members[0].summary,'Human version')
  assert.equal(saved.workflow.history.at(-1).suggestedOperations[0].summary,'AI version')
  assert.equal(saved.workflow.discussions['discussion:graph'].proposal.operations[0].summary,'Human version')
  await send([{action:'update_member',name:'worker',summary:'Replay'}]);assert.equal(status,409)
})

test('reopening member discussions preserves history and pending proposals without generating again', async t => {
  const root = mkdtempSync(join(tmpdir(), 'workflow-reopen-')); t.after(() => rmSync(root, {recursive:true,force:true}))
  const source = team(), agents = new Map(), events = [], sent = []; let created = 0, resumed = 0
  await createTeamDir(join(root,'.agent-teams'),source)
  const makeAgent = id => ({id,status:'idle',session:{header:{cwd:root},ownEvents:()=>events},whenIdle:async()=>{},followup:message=>{ sent.push(message); events.push({type:'user/message',seq:events.length+1,data:message}) }})
  const ctx = { tools:{register(){}},subagents:{registerContinuableSetup(){}},llm:{resolveCallConfig:async value=>value},effect(){},sessions:{flush:async()=>{}},agents:{
    get:id=>agents.get(id),
    create:async spec=>{created++;const agent=makeAgent(spec.sessionId);agents.set(agent.id,agent);return {agent,dispose(){}}},
    resume:async spec=>{resumed++;const agent=makeAgent(spec.resumeSessionId);agents.set(agent.id,agent);return {agent,dispose(){}}},
  } }
  const captain={id:'captain-id',options:{provider:'fake',model:'fake'},session:{header:{cwd:root},requestHeader:()=>({config:{}})}}
  const runtime=installWorkflowConversations(ctx,{stateDir:'.agent-teams',maxMembers:8},workflowMaterials)
  const stateRoot=join(root,'.agent-teams'), id=await runtime.open(captain,source,'member:worker',stateRoot)
  const discussion=source.workflow.discussions['discussion:member:worker']
  discussion.messages.push({role:'user',text:'Keep my earlier requirements',at:1})
  discussion.proposal=proposeWorkflow(source,'Existing suggestion',[{action:'update_member',name:'worker',summary:'Pending summary'}])
  await writeTeam(stateRoot,source)
  for(let i=0;i<3;i++) assert.equal(await runtime.open(captain,source,'member:worker',stateRoot),id)
  assert.equal(created,1); assert.equal(sent.length,1)
  assert.equal(source.workflow.discussions['discussion:member:worker'].proposal.id,discussion.proposal.id)
  assert.equal(Object.keys(source.workflow.discussions).filter(key=>key.startsWith('archive:')).length,0)
  agents.delete(id)
  const restored=await readTeam(stateRoot,source.id)
  assert.equal(await runtime.open(captain,restored,'member:worker',stateRoot),id)
  const transcript=await runtime.readEmbedded(restored,'member:worker')
  assert.equal(resumed,1);assert.equal(created,1);assert.equal(sent.length,1)
  assert.equal(transcript.messages.length,1)
  assert.equal(restored.workflow.discussions['discussion:member:worker'].messages[0].text,'Keep my earlier requirements')
})
