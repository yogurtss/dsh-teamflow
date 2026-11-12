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

test('native card replay folds status updates into the original review round',async()=>{
  const {supervisorDefinition:fold}=await import('../lib/client/supervisor-card-definition.js')
  const card={key:'["a","review-1"]',workspaceId:'w',project:'Project',teamId:'a',workflow:'A',captain:'captain',item:{id:'review-1',kind:'review',title:'Review',round:1},status:'open',summary:'Evidence'}
  const event=(revision,status)=>({type:'plugin:teamflow/super-agent-card',data:{revision,card:{...card,status}}})
  const start=event('start','open'),end=event('update','approved')
  assert.deepEqual(fold.match(start),{id:card.key,role:'start'})
  assert.deepEqual(fold.match(end),{id:card.key,role:'update'})
  assert.equal(fold.update({}, {event:end}).status,'approved')
})

import { conversationUnread } from '../lib/super-agent-unread.js'

test('only incoming visible entries are unread, and one card retains its identity across revisions', () => {
  const card = {key:'review',captain:'a',workspaceId:'project',item:{title:'Review'}}
  const record = (seq, revision) => ({seq,type:'plugin:teamflow/super-agent-card',data:{revision,card}})
  const events = [
    {seq:0,type:'user/message',data:{content:[{type:'text',text:'question'}]}},
    record(1,'start'), record(2,'update'),
    {seq:3,type:'assistant/message',data:{message:{content:[{type:'toolCall'}]}}},
    {seq:4,type:'assistant/message',data:{message:{content:[{type:'text',text:'answer'}]}}},
  ]
  assert.deepEqual(conversationUnread(events), {latest:4,count:2})
  assert.deepEqual(conversationUnread(events,2), {latest:4,count:1})
  assert.deepEqual(conversationUnread(events,4), {latest:4,count:0})
  assert.deepEqual(conversationUnread([...events,record(5,'update')],4), {latest:5,count:1})
})

test('requirements resolve named targets and require a project when names repeat', async () => {
  const {resolveRelayTarget}=await import('../lib/super-agent-relay.js')
  const a={project:'Alpha',workspaceId:'w1',teamId:'a',workflow:'Release notes',conversation:'Discuss launch'}
  const b={...a,project:'Beta',workspaceId:'w2'}
  assert.throws(()=>resolveRelayTarget([a,b],'Release notes'),/Alpha.*Beta/)
  assert.equal(resolveRelayTarget([a,b],'Discuss launch','beta'),b)
  assert.throws(()=>resolveRelayTarget([a,b],'nonexistent','Beta'),/没有找到/)
})

test('requirement rounds survive restart, deduplicate delivery and update one return card', async t => {
  const {Session}=await import('@deepseek-ai/dsh-session')
  const {createRequirementRelay}=await import('../lib/super-agent-relay.js')
  const {readMailbox,CAPTAIN_KEY}=await import('../lib/state.js')
  const {readCard}=await import('../lib/super-agent-card.js')
  const home=await mkdtemp(join(tmpdir(),'teamflow-relay-'))
  t.after(()=>rm(home,{recursive:true,force:true}))
  const root=join(home,'teams'),target={workspaceId:'w',project:'Project',teamId:'a',workflow:'Release',captain:'captain-a'}
  await createTeamDir(root,team('a'))
  const inputs=[],notices=[],master={id:'coordinator',session:Session.create('coordinator'),followup:m=>notices.push(m)}
  let report
  const captain={id:'captain-a',session:{header:{version:4},ownEvents:()=>inputs.map((m,seq)=>({seq,type:'user/message',data:m}))},
    followup:m=>inputs.push(m),ctx:{tools:{register:tool=>{report=tool;return ()=>{}}}}}
  const ctx={effect:fn=>fn(),sessions:{flush:async()=>{}},agents:{get:()=>captain},logger:{warn:m=>assert.fail(m)}}
  const start=()=>createRequirementRelay(ctx,home,'teams',()=>home,async()=>master,()=>master.id)
  const request=['coordinator',6,'Add a summary']
  let relay=start()
  const {id}=await relay.queue(target,...request)
  await relay.pass()
  relay=start();await relay.queue(target,...request);await relay.pass()
  assert.equal(inputs.length,1)
  await report.execute({id,round:1,kind:'question',text:'Which language?'})
  relay=start();await relay.pass()
  await Promise.all([relay.answer(id,1,'Chinese'),relay.answer(id,1,'Chinese')])
  await assert.rejects(relay.answer(id,1,'English'),/已被回复/)
  await relay.pass();assert.equal(inputs.length,2)
  await assert.rejects(report.execute({id,round:1,kind:'result',text:'stale'}),/stale/)
  await report.execute({id,round:2,kind:'result',text:'摘要已加入。'})
  await relay.pass()
  relay=start();await relay.queue(target,...request);await relay.pass()
  const cards=master.session.ownEvents().map(readCard).filter(Boolean)
  assert.deepEqual(cards.map(e=>e.card.requirement.kind),['question','answered','result'])
  assert.equal(new Set(cards.map(e=>e.card.key)).size,1)
  assert.equal(notices.length,2)
  assert.equal((await readMailbox(root,'a',CAPTAIN_KEY)).length,2)
  assert.equal((await readTeam(root,'a')).superAgentWatch,undefined)
})

test('a queued handoff is correlated with its own turn even when prompt assembly fails',async()=>{
  const {requirementTurn}=await import('../lib/super-agent-relay.js')
  const input=text=>({source:{kind:'agent-teams'},content:[{type:'text',text}]})
  const splice=(start,removedCount,...inserted)=>({type:'agent/inbox/spliced',data:{target:'next-turn',start,removedCount,inserted}})
  const start=turn=>({type:'turn/start',data:{turn}})
  const end=(turn,kind)=>({type:'turn/end',data:{turn,reason:{kind}}})
  const events=[splice(0,0,input('another'),input('[request]')),start(2),splice(0,1),end(2,'completed')]
  assert.deepEqual(requirementTurn(events,'[request]'),{accepted:true,end:undefined,text:''})
  events.push(start(3),splice(0,1),end(3,'error'),start(4),end(4,'completed'))
  assert.deepEqual(requirementTurn(events,'[request]'),{accepted:true,end:'error',text:''})
})
