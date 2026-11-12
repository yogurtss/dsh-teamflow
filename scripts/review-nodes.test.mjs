import assert from 'node:assert/strict'
import { test } from 'node:test'
import { randomUUID } from 'node:crypto'
import { applyWorkflowOperations, parseWorkflowOperations, checkpointReady, branchCheckpoint, decideCheckpoint, validateWorkflowGraph } from '../lib/workflow.js'
import { configureLoop, startLoop, reconcileLoops, decideLoop, loopInputFingerprint } from '../lib/workflow-loops.js'
import { workflowMaterialEvidence } from '../lib/workflow-material-evidence.js'
import { templateSeed, instantiateTemplate, extractedTemplate, templateGenerationFormat } from '../lib/templates.js'
import { isCheckpoint } from '../lib/workflow-validation.js'
import { isGateTask } from '../lib/workflow-node-kind.js'
import { reviewHistoryEdges } from '../lib/client/workflow-layout.js'
import { resetTaskForRerun } from '../lib/task-rerun.js'
import { activityStatus } from '../lib/client/activity-status.js'

const task = (id, dependencies = []) => ({ id, subject:id, description:`Do and verify ${id}`, dependencies, assignee:'worker', status:'pending', attempt:0, createdAt:1, updatedAt:1 })
const fixture = () => ({ id:'reviews', name:'Review nodes', captainSessionId:'captain', phase:'running', taskSeq:5, createdAt:1,
  members:['worker','reviewer'].map(name=>({id:'',name,summary:name,status:'idle',joinedAt:1})), tasks:[task('a'),task('b',['a'])] })
const add = (team, kind) => applyWorkflowOperations(team, parseWorkflowOperations([{ action:'add_task',id:'review',subject:'Review',description:'Review results',checkpoint:true,checkpointKind:kind,dependencies:['b'] }]))
const config = {gateId:'review',entryId:'a',mode:'human',maxRounds:3,timeoutMinutes:30}
const finish = team => { for(const t of team.tasks.filter(t=>!t.checkpoint && t.id!=='after')) Object.assign(t,{status:'completed',output:`Result ${t.id}`,updatedAt:Date.now()});reconcileLoops(team) }
const decide = (team,loop,decision) => decideLoop(team,loop.id,{decisionId:randomUUID(),runId:loop.runId,round:loop.round,fingerprint:loopInputFingerprint(team,loop),decision,note:'Check boundaries',taskIds:decision==='revise'?['a']:[]},'human')
const materials='Current reviewed evidence', evidence=workflowMaterialEvidence(materials)

test('gate drafts cannot become ordinary acceptance or execute without a return loop',()=>{
  let team=add(fixture(),'gate'), gate=team.tasks.at(-1)
  assert.equal(gate.workflowConfigPending,true)
  team=applyWorkflowOperations(team,[{action:'update_task',id:'review',confirmConfiguration:true}]);gate=team.tasks.at(-1)
  assert.equal(gate.workflowConfigPending,true,'saving requirements must not bypass the return edge')
  assert.equal(checkpointReady(team,gate),false)
  assert.throws(()=>decideCheckpoint(team,'review','approve',evidence,evidence,'yes',materials),/循环门控/)
  const tampered=structuredClone(team);tampered.tasks.at(-1).workflowConfigPending=false
  assert.throws(()=>validateWorkflowGraph(tampered),/返回线/)
  assert.throws(()=>configureLoop(team,{...config,entryId:'review'}),/上游/)
  configureLoop(team,config)
  assert.equal(gate.workflowConfigPending,false)
  assert.equal(isGateTask(gate),true)
  assert.throws(()=>configureLoop(add(fixture(),'acceptance'),config),/验收节点/)
})

test('human and AI gates preserve node identities on return, then release the same exit',()=>{
  for(const mode of ['human','ai']){
    const team=add(fixture(),'gate');team.tasks.push(task('after',['review']))
    const loop=configureLoop(team,{...config,mode,reviewer:mode==='ai'?'reviewer':undefined})
    const ids=team.tasks.map(t=>t.id)
    startLoop(team,loop.id);finish(team);decide(team,loop,'revise')
    assert.deepEqual(team.tasks.map(t=>t.id),ids)
    assert.equal(team.tasks.find(t=>t.id==='review').checkpoint.kind,'gate')
    assert.equal(loop.round,2);assert.equal(team.tasks.at(-1).status,'pending')
    finish(team);decide(team,loop,'pass')
    assert.equal(team.tasks.find(t=>t.id==='review').status,'completed')
    assert.equal(loop.status,'passed')
  }
})

test('outer card follows PASS exits across loop rounds and never treats REJECT as an endpoint',()=>{
  for(const mode of ['human','ai']) for(const hasExit of [false,true]){
    const team=add(fixture(),'gate')
    const exit=task('after',['review'])
    if(hasExit)team.tasks.push(exit)
    const loop=configureLoop(team,{...config,mode,reviewer:mode==='ai'?'reviewer':undefined})
    const done=()=>activityStatus(team).state==='completed'
    startLoop(team,loop.id);finish(team)
    assert.equal(done(),false,'finishing the body still requires gate approval')
    decide(team,loop,'revise')
    assert.equal(done(),false,'a return begins another round')
    if(hasExit){
      exit.status='completed'
      assert.equal(done(),false,'an old downstream result cannot complete an active loop')
      exit.status='pending'
    }
    finish(team);decide(team,loop,'pass')
    assert.equal(done(),!hasExit,'a terminal gate completes on PASS, a downstream exit must still deliver')
    if(hasExit){exit.status='completed';assert.equal(done(),true)}
  }
})

test('repeated acceptance rejection preserves old paths and routes only new inputs back to one rectangular node',()=>{
  let team=add(fixture(),'acceptance');team.tasks.push(task('after',['review']));finish(team)
  const original=structuredClone(team.tasks.slice(0,2))
  team=branchCheckpoint(team,'review',['a'],evidence,evidence,'Fix boundaries',materials)
  let review=team.tasks.find(t=>t.id==='review')
  assert.deepEqual(team.tasks.slice(0,2),original)
  assert.equal(team.tasks.filter(t=>t.checkpoint).length,1)
  assert.equal(review.checkpoint.kind,'acceptance');assert.equal(isGateTask(review),false)
  assert.equal(checkpointReady(team,review),false)
  assert.deepEqual(reviewHistoryEdges(team.tasks),[{from:'b',to:'review'}])
  const firstInputs=[...review.dependencies]
  finish(team)
  team=branchCheckpoint(team,'review',firstInputs,evidence,evidence,'Recheck tests only',materials)
  review=team.tasks.find(t=>t.id==='review')
  assert.equal(team.tasks.filter(t=>t.checkpoint).length,1)
  assert.equal(review.checkpoint.round,3)
  assert.deepEqual(reviewHistoryEdges(team.tasks),[{from:'b',to:'review'},{from:firstInputs[0],to:'review'}])
  assert.ok(review.dependencies.every(id=>id!=='b'&&!firstInputs.includes(id)))
  assert.equal(team.tasks.find(t=>t.id==='after').status,'pending')
  assert.equal(isCheckpoint(JSON.parse(JSON.stringify(review.checkpoint))),true)
  finish(team);decideCheckpoint(team,'review','approve',evidence,evidence,'Accepted',materials)
  assert.equal(review.status,'completed')
  assert.deepEqual(team.tasks.find(t=>t.id==='after').dependencies,['review'])
  resetTaskForRerun(review,true)
  assert.equal(review.checkpoint.kind,'acceptance')
})

test('templates, extraction and reload preserve both review kinds including incomplete gates',()=>{
  for(const kind of ['gate','acceptance']){
    const team=add(fixture(),kind)
    const format=templateGenerationFormat(team)
    const extracted=extractedTemplate(team,format)
    const seed=templateSeed(team)
    assert.equal(extracted.tasks.at(-1).checkpointKind,kind)
    const restored=instantiateTemplate({...seed,id:'template',version:1},'instance','captain','Example','Example goal')
    assert.equal(restored.tasks.at(-1).checkpoint.kind,kind)
    assert.equal(restored.tasks.at(-1).workflowConfigPending,true)
    assert.equal(isGateTask(restored.tasks.at(-1)),kind==='gate')
    const invalid=structuredClone(format);invalid.tasks.at(-1).checkpointKind=kind==='gate'?'acceptance':'gate'
    assert.throws(()=>extractedTemplate(team,invalid),/保留/)
  }
  assert.throws(()=>parseWorkflowOperations([{action:'add_task',subject:'Invalid',dependencies:[],checkpointKind:'gate'}]),/checkpoint/)
  assert.equal(isCheckpoint({kind:'invalid',round:1,history:[]}),false)
  assert.equal(isGateTask({id:'legacy',checkpoint:{round:1,history:[]}},[{gateId:'legacy'}]),true)
})
