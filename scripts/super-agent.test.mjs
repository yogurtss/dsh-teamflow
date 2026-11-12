import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createTeamDir, readTeam, writeTeam } from '../lib/state.js'
import { listWatchRows, setWatch, watchRow } from '../lib/super-agent.js'
import { workflowFingerprint } from '../lib/workflow.js'
import { configureLoop, startLoop } from '../lib/workflow-loops.js'
import { recordNodeChanges } from '../lib/super-agent-watch.js'

test('progress starts at subscription, follows actual dependencies and coalesces claimed/running',()=>{
  const state=team('progress')
  state.tasks.push(task('parallel'))
  state.superAgentWatch={...config,kinds:['progress']}
  recordNodeChanges(state)
  assert.deepEqual(watchRow(state).progress,[])
  state.tasks[0].status='completed'
  state.tasks[1].status='claimed'
  state.tasks[2].status='in_progress'
  recordNodeChanges(state)
  state.tasks[1].status='in_progress'
  recordNodeChanges(state)
  const row=watchRow(state)
  assert.deepEqual(row.items,[])
  assert.deepEqual(row.progress.map(c=>[c.title,c.status,c.inputs]),[['a','completed',[]],['b','started',['a']],['parallel','started',[]]])
  state.superAgentWatch=config
  recordNodeChanges(state)
  assert.equal(state.watchProgress,undefined)
})

const task=(id,dependencies=[])=>({id,subject:id,description:'Review evidence',status:'pending',dependencies,createdAt:1,updatedAt:1,checkpoint:{round:1,history:[]}})
const team=(id)=>({id,name:'Same name',captainSessionId:'captain-'+id,phase:'running',createdAt:1,taskSeq:2,tasks:[task('a'),task('b',['a'])],members:[],workflow:{positions:{},discussions:{},history:[]}})
const config={kinds:['review','proposal','block'],keep:false}

test('opt-in, compare-and-set edits, filtering and durable completion without an open panel',async t=>{
  const root=await mkdtemp(join(tmpdir(),'super-agent-'))
  t.after(()=>rm(root,{recursive:true,force:true}))
  await createTeamDir(root,team('one'));await createTeamDir(root,team('two'))
  const path=join(root,'one','team.json'), original=await readFile(path,'utf8')
  assert.deepEqual(await listWatchRows(root),[])
  assert.equal((await listWatchRows(root,true)).length,2)
  assert.equal(await readFile(path,'utf8'),original)
  const fingerprint=workflowFingerprint(await readTeam(root,'one'))
  await setWatch(root,'one',config,null)
  assert.equal(workflowFingerprint(await readTeam(root,'one')),fingerprint)
  const rows=await listWatchRows(root)
  assert.equal(rows.length,1);assert.deepEqual(rows[0].items.map(i=>i.taskId),['a'])
  await assert.rejects(setWatch(root,'one',null,null),/changed/)
  await assert.rejects(setWatch(root,'../one',null,null),/Invalid/)
  const held=await readTeam(root,'one')
  Object.assign(held.tasks[0],{status:'completed'});held.tasks[0].checkpoint.decision='approve'
  await writeTeam(root,held);assert.deepEqual((await listWatchRows(root))[0].items.map(i=>i.taskId),['b'])
  Object.assign(held.tasks[1],{status:'completed'});held.tasks[1].checkpoint.decision='approve'
  await writeTeam(root,held)
  const reopened=await readTeam(root,'one');reopened.tasks[1].status='pending';delete reopened.tasks[1].checkpoint.decision
  await writeTeam(root,reopened);assert.deepEqual(await listWatchRows(root),[])
  const persistent={kinds:['block'],keep:true};await setWatch(root,'one',persistent,null)
  reopened.superAgentWatch=persistent;reopened.tasks[1].status='completed';reopened.tasks[1].checkpoint.decision='approve'
  await writeTeam(root,reopened);assert.equal((await listWatchRows(root))[0].complete,true)
  reopened.tasks[1].status='pending';delete reopened.tasks[1].checkpoint.decision
  await writeTeam(root,reopened);assert.deepEqual((await listWatchRows(root))[0].items,[])
  await setWatch(root,'one',null,persistent);assert.deepEqual(await listWatchRows(root),[])
})

test('only current proposals, human reviews and explicitly actionable blockers are surfaced',()=>{
  const state=team('example');state.superAgentWatch=config
  const proposal={key:'graph',proposal:{id:'p',title:'Update',status:'pending'}}
  state.workflow.discussions={'discussion:graph':proposal,'archive:old':proposal}
  state.tasks[0].checkpoint.mode='ai'
  state.tasks[1].workflowConfigPending=true
  assert.deepEqual(watchRow(state).items.map(i=>i.kind),['proposal','block'])
  state.workflow.discussions['discussion:graph'].proposal.status='applied'
  state.tasks[1].workflowConfigPending=false
  assert.deepEqual(watchRow(state).items,[])
})

test('changing a subscription cannot advance a running loop to review',async t=>{
  const root=await mkdtemp(join(tmpdir(),'super-agent-loop-'))
  t.after(()=>rm(root,{recursive:true,force:true}))
  const state=team('loop')
  const work=state.tasks[0]
  delete work.checkpoint
  work.assignee='writer'
  state.members.push({id:'',name:'writer',status:'idle',joinedAt:1})
  state.tasks[1].checkpoint.kind='gate'
  const loop=configureLoop(state,{entryId:'a',gateId:'b',mode:'human',maxRounds:2,timeoutMinutes:10})
  startLoop(state,loop.id)
  await createTeamDir(root,state)
  // A persisted execution result may be present before the scheduler reconciles the gate.
  work.status='completed';work.output='Proof';work.updatedAt=2
  await writeFile(join(root,'loop','team.json'),JSON.stringify(state))
  const before=workflowFingerprint(await readTeam(root,'loop'))
  await setWatch(root,'loop',config,null)
  const after=await readTeam(root,'loop')
  assert.equal(after.workflow.loops[0].status,'running')
  assert.equal(workflowFingerprint(after),before)
})
