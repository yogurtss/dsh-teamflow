import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtemp, rm, readFile, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { saveGateSettings, configureLoop, decideLoop, startLoop, reconcileLoops, loopInputFingerprint, loopCanExecute, pauseLoop, pendingLoopHistory } from '../lib/workflow-loops.js'
import { readLoopHistory } from '../lib/workflow-loop-history.js'
import { previewGate, reviewerConflicts } from '../lib/workflow-loop-config.js'
import { createTeamDir, readTeam, writeTeam } from '../lib/state.js'
import { validateWorkflowGraph, applyWorkflowOperations } from '../lib/workflow.js'
import { applyQualityFollowUp, registerAgentTeamsTools } from '../lib/tools.js'
import { installTeamScheduler } from '../lib/scheduler.js'
import { installWorkflowWorkbench } from '../lib/workflow-runtime.js'
import { Readable } from 'node:stream'
import { workflowFingerprint } from '../lib/workflow.js'
import { templateSeed, instantiateTemplate } from '../lib/templates.js'
import { beginTaskAttempt, archiveTeamDir } from '../lib/state.js'
import { taskControlState, flowControlState, flowControlVersion } from '../lib/client/task-control.js'

test('loop controls preserve completed state, block node reruns, and distinguish AI from human review', () => {
  const { team, loop } = fixture('ai', 1); startLoop(team, loop.id); finish(team)
  const gate = team.tasks.find(t => t.id === 'gate'), completed = team.tasks[0]
  assert.equal(taskControlState(team, gate).reviewReady, false)
  assert.equal(taskControlState(team, completed).canRerun, false)
  assert.equal(taskControlState(team, gate).disabled, true)
  const version = flowControlVersion(team)
  decideLoop(team, loop.id, decision(team, loop, 'revise', ['b']), 'ai:reviewer')
  assert.equal(taskControlState(team, completed).label, 'task.status.completed')
  assert.notEqual(flowControlVersion(team), version)
  const region = { ...team, tasks: team.tasks.filter(t => t.id !== 'after') }
  assert.equal(flowControlState(region).canStart, false)
  assert.throws(() => startLoop(team, loop.id), /追加/)
  startLoop(team, loop.id, 1)
  assert.equal(loop.round, 2); assert.equal(team.tasks[0].status, 'completed')
  assert.ok(team.tasks[1].workflowRerunContext.instructions)
  const invalid = structuredClone(team); invalid.tasks.find(t => t.id === 'gate').assignee = 'worker'
  assert.throws(() => validateWorkflowGraph(invalid), /审核成员一致/)
})

test('a pending loop task can receive new requirements while its upstream is working', () => {
  const {team, loop} = fixture()
  startLoop(team, loop.id)
  beginTaskAttempt(team.tasks[0], 'worker')
  team.tasks[0].status = 'in_progress'
  const edit = {action:'update_task', id:'b', description:'Deliver a verified result', assignee:'worker', dependencies:['a']}
  const updated = applyWorkflowOperations(team, [edit])
  validateWorkflowGraph(updated)
  assert.equal(updated.tasks[1].description, edit.description)
  assert.deepEqual(updated.tasks[0], team.tasks[0])
  assert.equal(updated.workflow.loops[0].status, 'running')
  for (const change of [{id:'a'}, {assignee:'reviewer'}, {dependencies:[]}]) {
    assert.throws(() => applyWorkflowOperations(team, [{...edit, ...change}]), /循环|已开始/)
  }
  team.tasks[1].attempt = 1
  assert.equal(applyWorkflowOperations(team, [edit]).tasks[1].description, edit.description)
})

test('idle body and gate edits preserve execution, decisions and history across loop phases', () => {
  for (const phase of ['paused', 'reviewing', 'passed', 'cancelled', 'revise']) {
    const {team, loop} = fixture()
    startLoop(team, loop.id)
    finish(team)
    if (phase === 'passed' || phase === 'revise') {
      decideLoop(team, loop.id, decision(team, loop, phase === 'passed' ? 'pass' : 'revise', phase === 'passed' ? [] : ['b']), 'human')
    }
    if (phase === 'paused' || phase === 'cancelled') pauseLoop(team, loop.id, phase === 'cancelled')
    for (const halted of [false, true]) {
      team.halted = halted
      reconcileLoops(team)
      const updated = applyWorkflowOperations(team, ['b', 'gate'].map(id => ({action:'update_task', id, description:'Updated requirements'})))
      reconcileLoops(updated)
      assert.equal(updated.halted, halted)
      assert.equal(updated.workflow.loops[0].status, loop.status)
      assert.equal(updated.workflow.loops[0].historyCount, loop.historyCount)
      for (const id of ['b', 'gate']) {
        const before = team.tasks.find(t => t.id === id), after = updated.tasks.find(t => t.id === id)
        assert.equal(after.description, 'Updated requirements')
        for (const key of ['status','attempt','attemptId','output','checkpoint','workflowRerunContext']) assert.deepEqual(after[key], before[key])
      }
    }
  }
})

test('AI result drift pauses immediately and persists the reason without releasing downstream', async t => {
  const { team, loop } = fixture('ai'); startLoop(team, loop.id); finish(team)
  const gate = team.tasks.find(t => t.id === 'gate'); beginTaskAttempt(gate, 'reviewer')
  loop.reviewArtifactEvidence = 'old artifact digest'
  const f = await routeFixture(t, team)
  const input = decision(team, loop, 'pass', [])
  const result = await f.tool('agent_teams_decide_loop', { loop_id: loop.id, run_id: loop.runId, round: loop.round, fingerprint: input.fingerprint,
    attempt_id: gate.attemptId, decision_id: input.decisionId, decision: 'pass', note: input.note, task_ids: [] })
  assert.equal(result.status, 'paused')
  const saved = await f.read()
  assert.equal(saved.workflow.loops[0].status, 'paused'); assert.match(saved.workflow.loops[0].reason, /结果已变化/)
  assert.notEqual(saved.tasks.find(t => t.id === 'gate').status, 'completed')
  assert.equal(saved.tasks.find(t => t.id === 'after').status, 'pending')
})

test('a reviewer with the old requirements must refresh its review before passing', async t => {
  const {team, loop} = fixture('ai')
  startLoop(team, loop.id); finish(team)
  const gate = team.tasks.find(task => task.id === 'gate')
  beginTaskAttempt(gate, 'reviewer')
  gate.status = 'in_progress'
  const f = await routeFixture(t, team)
  const input = decision(team, loop, 'pass', [])
  loop.reviewArtifactEvidence = (await import('../lib/workflow-loop-evidence.js')).loopArtifactEvidence(f.root, team, loop)
  await writeTeam(f.stateRoot, team)
  const result = await f.call('edit', {base:workflowFingerprint(team), title:'Edit idle task during review', operations:[
    {action:'update_task', id:'b', description:'Revised acceptance criteria'}
  ]})
  assert.equal(result.code, 200, result.error)
  const saved = await f.read()
  assert.equal(saved.tasks.find(t => t.id === 'b').status, 'completed')
  assert.equal(saved.tasks.find(t => t.id === 'gate').attemptId, gate.attemptId)
  assert.equal((await f.tool('agent_teams_decide_loop', {loop_id:loop.id, run_id:loop.runId, round:loop.round,
    fingerprint:input.fingerprint, attempt_id:gate.attemptId, decision_id:input.decisionId, decision:'pass', note:input.note, task_ids:[]})).status, 'paused')
})

test('pausing live loop work revokes its attempt and resumes the same round with partial output retained', async t => {
  const { team, loop } = fixture(); startLoop(team, loop.id)
  const token = beginTaskAttempt(team.tasks[0], 'worker')
  team.tasks[0].status = 'in_progress'; team.tasks[0].output = 'Saved partial draft'
  const f = await routeFixture(t, team)
  const result = await f.call('loop_pause', { loopId: loop.id, base: workflowFingerprint(team) })
  assert.equal(result.code, 200, result.error)
  const saved = await f.read(), work = saved.tasks[0], paused = saved.workflow.loops[0]
  assert.equal(paused.status, 'paused'); assert.equal(work.status, 'pending'); assert.equal(work.attemptId, undefined)
  assert.equal(work.workflowRerunContext.previousAttemptId, token)
  assert.equal(work.workflowRerunContext.previousOutput, 'Saved partial draft')
  assert.ok((await readLoopHistory(f.stateRoot, saved, loop.id)).records.some(r => r.tasks.some(t => t.attemptId === token && t.output === 'Saved partial draft')))
  startLoop(saved, loop.id)
  assert.equal(paused.status, 'running'); assert.equal(paused.round, 1); assert.equal(saved.tasks.length, 4)
  assert.equal(work.workflowRerunContext.previousOutput, 'Saved partial draft')
})

test('gate preview follows the selected entry and matches save without mutating the draft', () => {
  const {team, loop} = fixture()
  team.tasks[0].assignee = 'reviewer'
  const config = {...loop, mode:'ai', reviewer:'reviewer'}
  const before = structuredClone(team)
  const preview = previewGate(team, config, ['after'])
  assert.match(preview.error, /reviewer.*「a」/)
  assert.deepEqual(reviewerConflicts(team, preview.bodyIds, 'reviewer').map(t => t.id), ['a'])
  assert.throws(() => saveGateSettings(team, config, ['after'], loop.id), {message:preview.error})
  const narrower = {...config, entryId:'b'}
  assert.equal(previewGate(team, narrower, ['after']).error, '')
  assert.ok(previewGate(team, narrower, ['a']).error)
  assert.deepEqual(team, before)
  saveGateSettings(team, narrower, ['after'], loop.id)
})

test('review materials compare the preceding decision with a partial rerun', async t => {
  const {team, loop} = fixture()
  startLoop(team, loop.id)
  team.tasks[1].acceptanceResults = [{criterion:'speed',status:'failed',evidence:'slow'}]
  finish(team)
  const f = await routeFixture(t, team)
  assert.equal((await f.call('loop_materials', {loopId:loop.id})).previous, undefined)
  decideLoop(team, loop.id, decision(team, loop, 'revise', ['b']), 'human')
  team.tasks[1].acceptanceResults = [{criterion:'speed',status:'passed',evidence:'fast'}]
  team.tasks[1].commandsRun = [{command:'benchmark',status:'failed',exitCode:1,evidence:'timeout'}]
  finish(team, ['b'])
  await writeTeam(f.stateRoot, team)
  const materials = await f.call('loop_materials', {loopId:loop.id})
  assert.equal(materials.code, 200, materials.error)
  assert.deepEqual(materials.executionRounds, {a:1,b:2})
  assert.equal(materials.previous.round, 1)
  assert.equal(materials.previous.tasks[1].acceptanceResults[0].status, 'failed')
  assert.equal(materials.tasks[1].acceptanceResults[0].status, 'passed')
  assert.equal(materials.tasks[1].commandsRun[0].command, 'benchmark')
})

test('human loop decisions review results independently of workspace changes', async t => {
  const { team, loop } = fixture(); startLoop(team, loop.id); finish(team)
  team.tasks[0].changedPaths = ['artifact.txt']
  const f = await routeFixture(t, team)
  await writeFile(join(f.root, 'artifact.txt'), 'a'.repeat(1024 * 1024))
  const materials = await f.call('loop_materials', { loopId: loop.id });assert.equal(materials.code,200);assert.deepEqual(materials.files,[])
  await writeFile(join(f.root, 'artifact.txt'), 'changed during human review')
  const result = await f.call('loop_decide', { loopId: loop.id, ...decision(team, loop, 'pass', []), artifactEvidence: materials.artifactEvidence })
  assert.equal(result.code,200);assert.equal((await f.read()).workflow.loops[0].status,'passed')
})

test('invalid configuration is atomic and upstream reruns cannot invalidate saved loop rounds', () => {
  const { team, loop } = fixture('ai')
  const pristine = structuredClone(team)
  assert.throws(() => configureLoop(team, { gateId: 'after', entryId: 'a', mode: 'human', maxRounds: 3, timeoutMinutes: 1 }))
  assert.deepEqual(team, pristine)
  team.tasks.unshift({ ...task('input'), status: 'completed', output: 'fixed input' })
  team.tasks.find(t => t.id === 'a').dependencies = ['input']
  startLoop(team, loop.id); finish(team); decideLoop(team, loop.id, decision(team, loop, 'pass', []), 'ai:reviewer')
  assert.throws(() => applyWorkflowOperations(team, [{ action: 'rerun_task', id: 'input', instructions: 'Change upstream' }]), /循环输入/)
  assert.equal(team.workflow.loops[0].status, 'passed')
})

test('finished AI loops retain history when members retire for archival', async t => {
  const root = await mkdtemp(join(tmpdir(), 'teamflow-loop-retired-')); t.after(() => rm(root, { recursive: true, force: true }))
  const { team, loop } = fixture('ai'); await createTeamDir(root, team)
  startLoop(team, loop.id); finish(team); decideLoop(team, loop.id, decision(team, loop, 'pass', []), 'ai:reviewer')
  team.members.forEach(member => { member.status = 'removed' })
  await writeTeam(root, team)
  const saved = await readTeam(root, team.id)
  assert.equal(saved.workflow.loops[0].status, 'passed')
  assert.ok((await readLoopHistory(root, saved, loop.id)).records.some(r => r.decision === 'pass'))
})

async function routeFixture(t, source, dispatch) {
  const root = await mkdtemp(join(tmpdir(), 'teamflow-loop-route-')); t.after(() => rm(root, { recursive: true, force: true }))
  const stateRoot = join(root, '.agent-teams'); await createTeamDir(stateRoot, source)
  const captain = { id: 'captain', status: 'idle', options: {provider:'fixture',model:'model-a'}, session: { header: { id: 'captain', cwd: root }, requestHeader: () => ({config:{provider:'fixture',model:'model-a'}}), ownEvents: () => [] } }
  const live = new Map([[captain.id, captain], ...source.members.map(m => [m.id, { id: m.id, status: 'running', session: { header: { id: m.id, cwd: root }, ownEvents: () => [] } }])])
  const definitions = new Map(), effects = [], noop = () => {}; let route
  const ctx = { on: () => noop, effect: fn => effects.push(fn()), logger: { warn: noop, debug: noop }, tools: { register: d => definitions.set(d.name, d) }, agents: { get: id => live.get(id) }, llm: { resolveCallConfig: async v => v, listModels: async () => [{id:"model-a"}] }, subagents: { followup: async () => {}, registerContinuableSetup: () => noop, drainChildren: async () => {} } }
  t.after(() => effects.forEach(fn => typeof fn === 'function' && fn()))
  const config = { stateDir: '.agent-teams', maxMembers: 8, memberProvider: 'spawn', memberMaxDepth: 1, profiles: {}, toolPolicies: {} }
  const runtime = registerAgentTeamsTools(ctx, config)
  const workflowRuntime = dispatch ? {...runtime, ...installTeamScheduler(ctx, {stateDir:config.stateDir, dispatch})} : runtime
  installWorkflowWorkbench(ctx, config, workflowRuntime, { register: value => { route = value; return noop } })
  return { root, stateRoot, live, read: () => readTeam(stateRoot, source.id),
    tool: (name, args, member = 'reviewer') => definitions.get(name).execute(args, { agent: member === 'captain' ? captain : live.get(`${member}-session`), signal: new AbortController().signal }),
    call: async (action, fields = {}) => {
      const req = Readable.from([JSON.stringify({ sessionId: 'captain', teamId: source.id, action, ...fields })]); req.method = 'POST'; req.headers = {}
      let code, body; await route.handler(req, { writeHead: c => { code = c }, end: value => { body = JSON.parse(value) } }); return { code, ...body }
    } }
}

const task = (id, dependencies = []) => ({ id, subject: id, description: `Complete ${id}`, assignee: 'worker', dependencies, kind: 'work', status: 'pending', attempt: 0, createdAt: 1, updatedAt: 1 })
function fixture(mode = 'human', maxRounds = 3) {
  const team = { id: 'demo', name: 'Loop demo', captainSessionId: 'captain', phase: 'running', createdAt: 1, taskSeq: 5,
    members: ['worker', 'reviewer'].map(name => ({ id: `${name}-session`, name, summary: name, status: 'idle', joinedAt: 1 })),
    tasks: [task('a'), task('b', ['a']), { ...task('gate', ['b']), assignee: undefined, checkpoint: { round: 1, history: [] } }, task('after', ['gate'])] }
  const loop = configureLoop(team, { gateId: 'gate', entryId: 'a', mode, reviewer: mode === 'ai' ? 'reviewer' : undefined, maxRounds, timeoutMinutes: 30 })
  return { team, loop }
}
function finish(team, ids = ['a', 'b']) {
  for (const id of ids) { const t = team.tasks.find(t => t.id === id); Object.assign(t, { status: 'completed', output: `${id} result ${(t.attempt ?? 0) + 1}`, attempt: (t.attempt ?? 0) + 1, attemptId: randomUUID(), updatedAt: Date.now() }) }
  reconcileLoops(team)
}
const decision = (team, loop, verdict = 'revise', taskIds = ['a']) => ({ decisionId: randomUUID(), runId: loop.runId, round: loop.round, fingerprint: loopInputFingerprint(team, loop), decision: verdict, note: 'Fix edge case and rerun verification', taskIds })

test('idle loop members can change configuration in every loop phase, including completed and halted teams', () => {
  for (const status of ['ready','running','reviewing','paused','passed','cancelled']) {
    const {team,loop}=fixture('ai')
    if(status!=='ready')startLoop(team,loop.id)
    if(['reviewing','passed'].includes(status))finish(team)
    if(status==='passed')decideLoop(team,loop.id,decision(team,loop,'pass',[]),'ai:reviewer')
    if(['paused','cancelled'].includes(status))pauseLoop(team,loop.id,status==='cancelled')
    assert.equal(loop.status,status)
    for(const halted of [false,true])for(const name of ['worker','reviewer']) {
      const source={...team,halted}, before=structuredClone(source)
      const updated=applyWorkflowOperations(source,[{action:'update_member',name,provider:'fixture',model:'model-b',reasoningEffort:'high',role:'Updated responsibility'}])
      assert.equal(updated.members.find(m=>m.name===name).model,'model-b')
      assert.equal(updated.halted,halted)
      assert.deepEqual(updated.tasks,source.tasks)
      assert.deepEqual(updated.workflow.loops,source.workflow.loops)
      assert.deepEqual(source,before,'editing must not mutate the previous state or loop history')
    }
  }
})

test('only the targeted busy member blocks configuration; loop membership alone does not', () => {
  for(const busy of ['claimed','in_progress','reassigning','stopping']) {
    const {team,loop}=fixture('ai');startLoop(team,loop.id)
    if(busy==='stopping')team.members[0].stopping=true
    else if(busy==='reassigning')team.tasks[0].reassigning=true
    else team.tasks[0].status=busy
    const before=structuredClone(team)
    assert.throws(()=>applyWorkflowOperations(team,[{action:'update_member',name:'worker',model:'model-b'}]),/正在执行|先停止/)
    assert.deepEqual(team,before)
    const updated=applyWorkflowOperations(team,[{action:'update_member',name:'reviewer',model:'model-b'}])
    assert.equal(updated.members[1].model,'model-b')
  }
  const {team}=fixture();team.halted=true
  assert.throws(()=>applyWorkflowOperations(team,[{action:'update_member',name:'worker',model:'model-b'},{action:'add_task',subject:'Unrelated',dependencies:[]}]),/团队已停止/)
})

test('completed loop HTTP model edits retire idle sessions, preserve recorded models and reject a still-running session', async t => {
  const {team,loop}=fixture('ai')
  Object.assign(team.members[0],{provider:'fixture',model:'model-a',activeProvider:'fallback',activeModel:'fallback-model',fallbackActive:true})
  startLoop(team,loop.id);finish(team);decideLoop(team,loop.id,decision(team,loop,'pass',[]),'ai:reviewer')
  team.tasks.find(task=>task.id==='after').status='completed'
  const f=await routeFixture(t,team), before=await f.read()
  const history=await readLoopHistory(f.stateRoot,before,loop.id)
  f.live.get('worker-session').status='idle'
  const saved=await f.call('edit',{base:workflowFingerprint(before),title:'Change idle worker model',operations:[{action:'update_member',name:'worker',provider:'fixture',model:'model-b',reasoningEffort:'high'}]})
  assert.equal(saved.code,200,JSON.stringify(saved))
  const current=await f.read(), worker=current.members.find(m=>m.name==='worker')
  assert.equal(worker.model,'model-b');assert.equal(worker.reasoningEffort,'high')
  assert.equal(worker.id,'');assert.ok(worker.previousSessionIds.includes('worker-session'))
  assert.equal(worker.activeModel,undefined);assert.equal(worker.fallbackActive,undefined)
  assert.equal(current.workflow.loops[0].status,'passed')
  assert.deepEqual(await readLoopHistory(f.stateRoot,current,loop.id),history)
  const rejected=await f.call('edit',{base:workflowFingerprint(current),title:'Still busy reviewer',operations:[{action:'update_member',name:'reviewer',provider:'fixture',model:'model-b'}]})
  assert.equal(rejected.code,409,JSON.stringify(rejected));assert.match(JSON.stringify(rejected),/仍在运行/)
  assert.deepEqual(await f.read(),current)
})

test('three business rounds reuse task identities and preserve complete histories before resetting', async t => {
  const root = await mkdtemp(join(tmpdir(), 'teamflow-loops-')); t.after(() => rm(root, { recursive: true, force: true }))
  let { team, loop } = fixture(); await createTeamDir(root, team)
  const originalIds = team.tasks.map(t => t.id)
  startLoop(team, loop.id); finish(team); await writeTeam(root, team)
  for (let round = 1; round <= 2; round++) {
    assert.equal(loop.status, 'reviewing')
    decideLoop(team, loop.id, decision(team, loop), 'human'); await writeTeam(root, team)
    assert.deepEqual(team.tasks.map(t => t.id), originalIds)
    assert.equal(loop.round, round + 1)
    assert.equal(team.tasks.find(t => t.id === 'gate').status, 'pending')
    assert.equal(team.tasks[0].workflowRerunContext.instructions, 'Fix edge case and rerun verification')
    assert.equal(team.tasks[0].stoppedAttempts, undefined)
    finish(team); await writeTeam(root, team)
  }
  decideLoop(team, loop.id, decision(team, loop, 'pass', []), 'human'); await writeTeam(root, team)
  team = await readTeam(root, 'demo'); loop = team.workflow.loops[0]
  assert.equal(loop.status, 'passed'); assert.equal(team.tasks[2].status, 'completed')
  const records = []; let cursor
  do { const page = await readLoopHistory(root, team, loop.id, cursor); records.push(...page.records); cursor = page.next } while (cursor)
  assert.deepEqual(records.filter(r => r.kind === 'decision').map(r => r.round), [3, 2, 1])
  assert.ok(records.some(r => r.tasks.some(t => t.output === 'a result 1')))
  assert.ok(!(await readFile(join(root, 'demo', 'team.json'), 'utf8')).includes('"tasks": [\n      {\n        "id": "a"'))
})

test('automatic review round ceiling pauses without releasing downstream; restart does not reset budget', async t => {
  const root = await mkdtemp(join(tmpdir(), 'teamflow-loop-limit-')); t.after(() => rm(root, { recursive: true, force: true }))
  const { team, loop } = fixture('ai', 1); startLoop(team, loop.id); finish(team)
  decideLoop(team, loop.id, decision(team, loop), 'ai:reviewer'); await createTeamDir(root, team)
  assert.equal(loop.status, 'paused'); assert.equal(loop.round, 1)
  assert.equal(team.tasks[2].status, 'pending'); assert.equal(loopCanExecute(team, team.tasks[0]), false)
  const reloaded = await readTeam(root, 'demo'), saved = reloaded.workflow.loops[0]
  assert.throws(() => startLoop(reloaded, saved.id), /轮次上限/)
  startLoop(reloaded, saved.id, 1); assert.equal(saved.round, 2); assert.equal(saved.maxRounds, 2)
})

test('stale decisions and duplicates cannot advance twice or approve incomplete work', () => {
  const { team, loop } = fixture(); startLoop(team, loop.id); finish(team)
  const input = decision(team, loop)
  decideLoop(team, loop.id, input, 'human'); decideLoop(team, loop.id, input, 'human')
  assert.equal(loop.round, 2)
  assert.throws(() => decideLoop(team, loop.id, { ...input, decisionId: randomUUID() }, 'human'), /轮次或材料/)
  team.tasks[0].status = 'failed'; reconcileLoops(team)
  assert.equal(loop.status, 'reviewing', 'failed input must reach the gate instead of deadlocking descendants')
  assert.throws(() => decideLoop(team, loop.id, decision(team, loop, 'pass', []), 'human'), /未通过/)
})

test('a provider failure pauses the loop while ordinary failed work stays reviewable', () => {
  const {team,loop}=fixture('human')
  startLoop(team,loop.id);finish(team,['a'])
  const work=team.tasks[1]
  work.status='failed';work.output='provider unavailable'
  reconcileLoops(team,Date.now(),work.id)
  assert.equal(loop.status,'paused')
  assert.equal(loop.failedExecutionTaskId,work.id)
  startLoop(team,loop.id)
  assert.equal(loop.status,'running')
  assert.equal(work.workflowRerunContext.previousOutput,'provider unavailable')
  assert.equal(team.tasks[0].status,'completed')
  assert.equal(loop.round,1)
})

test('reading an old reviewing loop after HTTP 500 restores both resume entry points',async t=>{
  for(const global of [false,true]){
    const {team,loop}=fixture('ai')
    startLoop(team,loop.id);finish(team)
    const f=await routeFixture(t,team)
    // Reproduce the pre-fix durable record without running the new write hook.
    const saved=await f.read()
    const failed=saved.tasks.find(task=>task.id===(global?'gate':'b'))
    failed.status='failed';failed.output='HTTP 500 Internal Server Error (code server_error)'
    await writeFile(join(f.stateRoot,team.id,'team.json'),JSON.stringify(saved))
    const state=await f.call('state')
    assert.equal(state.code,200,state.error)
    assert.equal(state.team.workflow.loops[0].status,'paused')
    assert.equal(flowControlState({...state.team,tasks:state.team.tasks.slice(0,3)}).canStart,true)
    const resumed=global ? await f.call('set_flow_enabled',{enabled:true,version:flowControlVersion(state.team)})
      : await f.call('loop_start',{loopId:loop.id,base:state.base})
    assert.equal(resumed.code,200,resumed.error)
    const current=resumed.team.workflow.loops[0]
    assert.equal(current.status,global?'reviewing':'running')
    assert.equal(current.round,1)
    assert.equal(current.failedExecutionTaskId,undefined)
    assert.equal(resumed.team.tasks[0].status,'completed')
    assert.equal(resumed.team.tasks[2].checkpoint.round,1)
    assert.equal(resumed.team.tasks[3].status,'pending')
    const paused=await f.call('loop_pause',{loopId:loop.id,base:resumed.base})
    assert.equal(paused.code,200,paused.error)
    assert.equal(paused.team.workflow.loops[0].status,'paused')
    if (!global) {
      const legacy=await f.read()
      legacy.tasks[1].workflowRerunContext.instructions=''
      await writeFile(join(f.stateRoot,team.id,'team.json'),JSON.stringify(legacy))
      const reopened=await f.call('state')
      assert.equal(reopened.code,200,reopened.error)
      assert.ok(reopened.team.tasks[1].workflowRerunContext.instructions)
    }
  }
})

test('partial revisions preserve unrelated branches and rerun the downstream closure', () => {
  const { team, loop } = fixture(); startLoop(team, loop.id); finish(team)
  const previous = team.tasks[0].attemptId
  decideLoop(team, loop.id, decision(team, loop, 'revise', ['b']), 'human')
  assert.equal(team.tasks[0].attemptId, previous); assert.equal(team.tasks[0].status, 'completed')
  assert.equal(team.tasks[1].status, 'pending'); assert.equal(team.tasks.length, 4)
})

test('graph rejects bypass exits and ordinary dependency cycles', () => {
  const { team } = fixture(); team.tasks[3].dependencies = ['a']
  assert.throws(() => validateWorkflowGraph(team), /必须经过门控/)
  team.tasks[0].dependencies = ['gate']
  assert.throws(() => validateWorkflowGraph(team), /循环/)
})

test('timeouts pause once and do not generate unbounded history', () => {
  const { team, loop } = fixture('ai'); startLoop(team, loop.id)
  const now = loop.startedAt + 31 * 60_000
  reconcileLoops(team, now); assert.equal(loop.status, 'paused'); const count = pendingLoopHistory(team).length
  for (let i = 0; i < 100; i++) reconcileLoops(team, now + i)
  assert.equal(pendingLoopHistory(team).length, count)
})

test('revision comparison refuses stale writers and paginated history is bounded', async t => {
  const root = await mkdtemp(join(tmpdir(), 'teamflow-loop-cas-')); t.after(() => rm(root, { recursive: true, force: true }))
  const { team } = fixture(); await createTeamDir(root, team)
  const first = await readTeam(root, 'demo'), stale = await readTeam(root, 'demo')
  startLoop(first, first.workflow.loops[0].id); await writeTeam(root, first)
  await assert.rejects(() => writeTeam(root, stale), /其他写入者/)
  assert.equal((await readTeam(root, 'demo')).workflow.loops[0].status, 'running')
  await assert.rejects(() => readLoopHistory(root, first, first.workflow.loops[0].id, '../team'), /标识无效/)
})

test('explicit loops disable legacy repair-node generation', () => {
  const { team } = fixture(); const work = team.tasks[0]; work.kind = 'review'; work.status = 'failed'
  assert.deepEqual(applyQualityFollowUp(team, work), { created: [], escalated: false }); assert.equal(team.tasks.length, 4)
})

test('actual scheduler dispatches the AI gate with a decision contract after failed business work', async t => {
  const root = await mkdtemp(join(tmpdir(), 'teamflow-loop-scheduler-')); t.after(() => rm(root, { recursive: true, force: true }))
  const { team, loop } = fixture('ai'); startLoop(team, loop.id); team.tasks[0].status = 'failed'; team.tasks[0].output = 'Validation failed'
  await createTeamDir(join(root, '.agent-teams'), team)
  const sent = [], captain = { id: 'captain', status: 'idle', session: { header: { cwd: root } } }, effects = []
  const ctx = { agents: { get: id => id === 'captain' ? captain : undefined }, effect: fn => effects.push(fn()), on() {}, logger: { warn() {} } }
  t.after(() => effects.forEach(fn => fn?.()))
  const scheduler = installTeamScheduler(ctx, { stateDir: '.agent-teams', dispatch: async (...args) => { sent.push(args); return true } })
  await scheduler.kickTeam(root, 'demo', captain)
  assert.equal(sent.length, 1); assert.equal(sent[0][2], 'reviewer')
  assert.match(sent[0][3], /agent_teams_decide_loop/); assert.match(sent[0][3], /Validation failed/)
  assert.equal((await readTeam(join(root, '.agent-teams'), 'demo')).tasks[2].status, 'claimed')
})

test('unreadable optional artifacts allow the AI reviewer to assess task results', async t => {
  const root = await mkdtemp(join(tmpdir(), 'teamflow-loop-artifact-failure-')); t.after(() => rm(root, { recursive: true, force: true }))
  const { team, loop } = fixture('ai'); startLoop(team, loop.id); finish(team)
  team.tasks[0].changedPaths = ['../outside-workspace.txt']
  await createTeamDir(join(root, '.agent-teams'), team)
  const sent = [], captain = { id: 'captain', status: 'idle', session: { header: { cwd: root } } }, effects = []
  const ctx = { agents: { get: id => id === 'captain' ? captain : undefined }, effect: fn => effects.push(fn()), on() {}, logger: { warn() {} } }
  t.after(() => effects.forEach(fn => fn?.()))
  const scheduler = installTeamScheduler(ctx, { stateDir: '.agent-teams', dispatch: async (...args) => { sent.push(args); return true } })
  await scheduler.kickTeam(root, 'demo', captain)
  const saved = await readTeam(join(root, '.agent-teams'), 'demo')
  assert.equal(saved.workflow.loops[0].status,'reviewing');assert.equal(sent.length,1);assert.ok(saved.tasks[2].attemptId)
  assert.equal(saved.tasks[3].status, 'pending')
})

test('human HTTP decisions preserve history, reject model bypasses and survive archive restoration', async t => {
  const { team, loop } = fixture('human', 1); startLoop(team, loop.id); finish(team)
  const f = await routeFixture(t, team), materials = await f.call('loop_materials', { loopId: loop.id })
  assert.equal(materials.code, 200)
  const fields = { loopId: loop.id, decisionId: randomUUID(), runId: loop.runId, round: 1, fingerprint: materials.fingerprint, artifactEvidence: materials.artifactEvidence, decision: 'revise', note: 'Correct the failed boundary and verify again', taskIds: ['b'] }
  const rejected = await f.call('loop_decide', fields); assert.equal(rejected.code, 200, rejected.error)
  assert.equal(rejected.team.workflow.loops[0].status, 'paused')
  const bypass = await f.call('start_path', { taskId: 'b', base: rejected.base }); assert.equal(bypass.code, 409)
  const all = await f.call('set_flow_enabled', { enabled: true, version: (await import('../lib/client/task-control.js')).flowControlVersion(rejected.team) })
  assert.equal(all.code, 200, all.error); assert.equal(all.team.workflow.loops[0].status, 'paused')
  const page = await f.call('loop_history', { loopId: loop.id }); assert.equal(page.code, 200); assert.ok(page.records.some(r => r.decision === 'revise'))
  await archiveTeamDir(f.stateRoot, 'demo')
  const archived = await f.call('loop_history', { loopId: loop.id, archived: true }); assert.equal(archived.code, 200)
  const restored = await f.call('restore_archive'); assert.equal(restored.code, 200, restored.error)
  const restoredHistory = await f.call('loop_history', { loopId: loop.id }); assert.equal(restoredHistory.code, 200); assert.equal(restoredHistory.records[0].id, page.records[0].id)
})

test('designated AI tool validates ownership and tokens and never accepts ordinary completion', async t => {
  const { team, loop } = fixture('ai', 1); startLoop(team, loop.id); finish(team)
  const gate = team.tasks[2]; beginTaskAttempt(gate, 'reviewer')
  const f = await routeFixture(t, team)
  const fresh = await f.read(), current = fresh.workflow.loops[0]
  current.reviewArtifactEvidence = await (await import('../lib/workflow-loop-evidence.js')).loopArtifactEvidence(f.root, fresh, current); await writeTeam(f.stateRoot, fresh)
  const args = { loop_id: loop.id, run_id: loop.runId, round: 1, decision_id: randomUUID(), fingerprint: loopInputFingerprint(fresh, current), attempt_id: gate.attemptId, decision: 'revise', note: 'Fix the output; verify all acceptance conditions', task_ids: ['a'] }
  await assert.rejects(() => f.tool('agent_teams_decide_loop', args, 'worker'), /指定 AI/)
  await assert.rejects(() => f.tool('agent_teams_decide_loop', { ...args, attempt_id: 'stale' }), /令牌/)
  await assert.rejects(() => f.tool('agent_teams_update_task', { task_id: 'gate', attempt_id: gate.attemptId, status: 'completed' }), /decide_loop/)
  const decided = await f.tool('agent_teams_decide_loop', args); assert.equal(decided.status, 'paused'); assert.equal(decided.round, 1)
  const duplicate = await f.tool('agent_teams_decide_loop', args); assert.deepEqual(duplicate, decided)
  assert.equal((await f.read()).tasks.length, 4)
})

test('loop templates preserve graph/configuration and generate new runtime identities', () => {
  const { team, loop } = fixture('ai'); const template = { ...templateSeed(team), id: 'saved', version: 1 }
  const copy = instantiateTemplate(template, 'copy', 'captain', 'Copied loop', 'Do the work')
  assert.equal(copy.workflow.explicitQuality, true); assert.equal(copy.workflow.loops[0].mode, 'ai')
  assert.notEqual(copy.workflow.loops[0].runId, loop.runId); assert.equal(copy.workflow.loops[0].historyCount, 0)
  assert.equal(copy.tasks[2].assignee, 'reviewer'); validateWorkflowGraph(copy)
})

test('queued loops start when external inputs arrive, without a backward dependency deadlock', () => {
  const { team, loop } = fixture(); team.tasks.unshift({ ...task('input'), workflowPaused: false }); team.tasks.find(t => t.id === 'a').dependencies = ['input']
  startLoop(team, loop.id); assert.equal(loop.queued, true); assert.equal(loop.status, 'ready')
  finish(team, ['input']); assert.equal(loop.status, 'running'); assert.equal(loop.queued, undefined)
  finish(team); assert.equal(loop.status, 'reviewing')
})

test('random forward DAGs revise exactly the affected closure without changing task identity', () => {
  let seed = 19; const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32 }
  for (let sample = 0; sample < 50; sample++) {
    const { team } = fixture(); delete team.workflow
    team.tasks = [task('n0')]
    for (let i = 1; i < 8; i++) team.tasks.push(task(`n${i}`, [...new Set(['n0', ...team.tasks.filter(() => random() > .6).map(t => t.id)])]))
    team.tasks.push({ ...task('gate', team.tasks.map(t => t.id)), assignee: undefined, checkpoint: { round: 1, history: [] } })
    const loop = configureLoop(team, { gateId: 'gate', entryId: 'n0', mode: 'human', maxRounds: 3, timeoutMinutes: 30 })
    startLoop(team, loop.id); finish(team, loop.bodyIds)
    const target = `n${Math.floor(random() * 8)}`, expected = new Set([target]); let progress = true
    while (progress) { progress = false; for (const t of team.tasks.filter(t => t.id !== 'gate')) if (!expected.has(t.id) && t.dependencies.some(id => expected.has(id))) { expected.add(t.id); progress = true } }
    decideLoop(team, loop.id, decision(team, loop, 'revise', [target]), 'human')
    assert.deepEqual(new Set(team.tasks.filter(t => t.id !== 'gate' && t.status === 'pending').map(t => t.id)), expected)
    assert.equal(team.tasks.length, 9)
  }
})

test('partial history writes cannot publish a new manifest; orphan records are invisible', async t => {
  const root = await mkdtemp(join(tmpdir(), 'teamflow-loop-fault-')); t.after(() => rm(root, { recursive: true, force: true }))
  const { team, loop } = fixture(); await createTeamDir(root, team)
  const original = await readFile(join(root, 'demo', 'team.json'), 'utf8')
  startLoop(team, loop.id); const record = pendingLoopHistory(team)[0]
  await writeFile(join(root, 'demo', 'loop-history', `${record.id}.json`), '{partial')
  await assert.rejects(() => writeTeam(root, team))
  assert.equal(await readFile(join(root, 'demo', 'team.json'), 'utf8'), original)
  const fresh = await readTeam(root, 'demo'); assert.deepEqual((await readLoopHistory(root, fresh, loop.id)).records, [])
  startLoop(fresh, loop.id); await writeTeam(root, fresh)
  assert.equal((await readLoopHistory(root, fresh, loop.id)).records.length, 1)
})

test('twenty-round history keeps hot state bounded and reloads original evidence', async t => {
  const root = await mkdtemp(join(tmpdir(), 'teamflow-loop-large-')); t.after(() => rm(root, { recursive: true, force: true }))
  const { team, loop } = fixture('human', 20); await createTeamDir(root, team); startLoop(team, loop.id)
  let initialBytes = 0; const started = performance.now()
  for (let round = 1; round <= 20; round++) {
    finish(team)
    for (const task of team.tasks.slice(0, 2)) task.output = `Round ${round}: ` + 'Evidence with Unicode 中文. '.repeat(1000)
    decideLoop(team, loop.id, decision(team, loop, round === 20 ? 'pass' : 'revise', round === 20 ? [] : ['a']), 'human'); await writeTeam(root, team)
    if (round === 2) initialBytes = (await readFile(join(root, 'demo', 'team.json'))).byteLength
  }
  const hotBytes = (await readFile(join(root, 'demo', 'team.json'))).byteLength
  assert.ok(hotBytes < initialBytes * 2, `${initialBytes} -> ${hotBytes}: hot state must not contain all round history`)
  const pageStart = performance.now(), page = await readLoopHistory(root, team, loop.id)
  assert.ok(page.records.length <= 5); assert.ok(page.next)
  let cursor = page.next, oldest = page.records.at(-1)
  while (cursor) { const next = await readLoopHistory(root, team, loop.id, cursor); oldest = next.records.at(-1); cursor = next.next }
  assert.equal(oldest.round, 1)
  t.diagnostic(JSON.stringify({ rounds: 20, historyRecords: loop.historyCount, hotBytes, baselineBytes: initialBytes, totalMs: Math.round(performance.now() - started), historyReadMs: Math.round(performance.now() - pageStart) }))
})


test('global pause cancels queued loops so later external completion cannot restart them',async t=>{
 const {team,loop}=fixture();team.tasks.unshift(task('input'));team.tasks.find(t=>t.id==='a').dependencies=['input']
 startLoop(team,loop.id);assert.equal(loop.queued,true)
 const f=await routeFixture(t,team),saved=await f.read()
 const paused=await f.call('set_flow_enabled',{enabled:false,version:flowControlVersion(saved)})
 assert.equal(paused.code,200,paused.error)
 const current=await f.read(),queued=current.workflow.loops[0]
 assert.equal(queued.queued,undefined);assert.equal(queued.status,'paused')
 finish(current,['input']);assert.equal(queued.status,'paused');assert.equal(current.tasks.find(t=>t.id==='a').workflowPaused,true)
})

test('confirming a staged team starts its configured loop', async t => {
  const {team} = fixture()
  team.phase = 'staged'
  const f = await routeFixture(t, team)
  const response = await f.call('start')
  assert.equal(response.code, 200, response.error)
  assert.equal(response.team.phase, 'running')
  assert.equal(response.team.workflow.loops[0].status, 'running')
  assert.equal(response.team.tasks.find(task => task.id === 'a').workflowPaused, false)
})

test('Start all requeues a manually paused loop and dispatches its entry after external input arrives', async t => {
  const {team,loop} = fixture()
  team.tasks.unshift(task('input'))
  team.tasks.find(t => t.id === 'a').dependencies = ['input']
  startLoop(team, loop.id)
  const f = await routeFixture(t, team)
  const paused = await f.call('set_flow_enabled', {enabled:false, version:flowControlVersion(await f.read())})
  assert.equal(paused.code, 200, paused.error)
  const resumed = await f.call('set_flow_enabled', {enabled:true, version:flowControlVersion(paused.activity)})
  assert.equal(resumed.code, 200, resumed.error)
  const saved = await f.read()
  assert.equal(saved.workflow.loops[0].queued, true)
  finish(saved, ['input'])
  assert.equal(saved.workflow.loops[0].status, 'running')
  await writeTeam(f.stateRoot, saved)
  const sent = [], captain = {id:'captain', status:'idle', session:{header:{cwd:f.root}}}
  const ctx = {agents:{get:id => id === 'captain' ? captain : undefined}, on(){}, effect:fn => t.after(fn()), logger:{warn(){}}}
  const scheduler = installTeamScheduler(ctx, {stateDir:'.agent-teams', dispatch:async (...args) => {sent.push(args); return true}})
  await scheduler.kickTeam(f.root, team.id, captain)
  assert.equal((await f.read()).tasks.find(t => t.id === 'a').status, 'claimed')
  assert.equal(sent.length, 1)
})

test('a loop-only flow can resume the same round after Pause all', async t => {
  const {team, loop} = fixture()
  team.tasks = team.tasks.filter(t => t.id !== 'after')
  startLoop(team, loop.id)
  const f = await routeFixture(t, team)
  const paused = await f.call('set_flow_enabled', {enabled:false, version:flowControlVersion(await f.read())})
  assert.equal(paused.code, 200, paused.error)
  assert.equal(flowControlState(paused.activity).canStart, true)
  const resumed = await f.call('set_flow_enabled', {enabled:true, version:flowControlVersion(paused.activity)})
  assert.equal(resumed.code, 200, resumed.error)
  assert.equal(resumed.team.workflow.loops[0].status, 'running')
  assert.equal(resumed.team.workflow.loops[0].round, 1)
  assert.equal(resumed.team.tasks.find(t => t.id === 'a').workflowPaused, false)
})

for (const cause of ['blocked', 'timeout']) test('Start all resumes a ' + cause + ' loop from the saved round', async t => {
  const {team, loop} = fixture()
  team.tasks = team.tasks.filter(task => task.id !== 'after')
  startLoop(team, loop.id)
  finish(team, cause === 'blocked' ? ['a', 'b'] : ['a'])
  if (cause === 'blocked') decideLoop(team, loop.id, decision(team, loop, 'blocked', []), 'human')
  else reconcileLoops(team, loop.startedAt + 31 * 60_000)
  const completed = structuredClone(team.tasks[0])
  const f = await routeFixture(t, team)
  const state = await f.call('state')
  assert.equal(state.team.workflow.loops[0].status, 'paused')
  assert.equal(flowControlState(state.activity).canStart, true)
  const resumed = await f.call('set_flow_enabled', {enabled:true, version:flowControlVersion(state.activity)})
  assert.equal(resumed.code, 200, resumed.error)
  assert.equal(resumed.team.workflow.loops[0].round, 1)
  assert.equal(resumed.team.workflow.loops[0].status, cause === 'blocked' ? 'reviewing' : 'running')
  assert.deepEqual(resumed.team.tasks[0], completed)
  assert.equal(resumed.team.tasks[1].workflowPaused, false)
  assert.equal(resumed.team.tasks[2].checkpoint.decision, undefined)
})

test('Start all recovers an interrupted AI review in a loop-only flow', async t => {
  const {team, loop} = fixture('ai')
  team.tasks = team.tasks.filter(task => task.id !== 'after')
  startLoop(team, loop.id)
  finish(team)
  const gate = team.tasks[2]
  beginTaskAttempt(gate, 'reviewer')
  gate.status = 'claimed'
  const sent = []
  const f = await routeFixture(t, team, async (...args) => { sent.push(args); return true })
  f.live.delete('reviewer-session')
  const state = await f.call('state')
  assert.equal(flowControlState(state.activity).canStart, true)
  const resumed = await f.call('set_flow_enabled', {enabled:true, version:flowControlVersion(state.activity)})
  assert.equal(resumed.code, 200, resumed.error)
  assert.equal(resumed.team.workflow.loops[0].status, 'reviewing')
  assert.equal(sent.length, 1)
  assert.equal(sent[0][2], 'reviewer')
  assert.equal(resumed.team.workflow.loops[0].round, 1)
  assert.notEqual(resumed.team.tasks[2].attemptId, gate.attemptId)
})

test('a loop with changed inputs does not prevent Start all from resuming an independent task', async t => {
  const {team, loop} = fixture()
  team.tasks.push(task('input'), {...task('independent'), workflowPaused:true})
  team.tasks[0].dependencies.push('input')
  finish(team, ['input'])
  startLoop(team, loop.id)
  finish(team, ['input'])
  assert.equal(loop.status, 'paused')
  const f = await routeFixture(t, team)
  const state = await f.call('state')
  const resumed = await f.call('set_flow_enabled', {enabled:true, version:flowControlVersion(state.activity)})
  assert.equal(resumed.code, 200, resumed.error)
  assert.equal(resumed.team.workflow.loops[0].status, 'paused')
  assert.match(resumed.skipped.join(' '), /gate.*外部输入/)
  assert.equal(resumed.team.tasks.find(task => task.id === 'independent').workflowPaused, false)
})

test('Start all accepts the activity snapshot of a workflow with an empty loop list', async t => {
  const {team} = fixture()
  team.workflow.loops = []
  team.tasks = [task('done'), task('todo', ['done'])]
  finish(team, ['done'])
  team.tasks[1].workflowPaused = true
  const f = await routeFixture(t, team)
  const state = await f.call('state')
  const resumed = await f.call('set_flow_enabled', {enabled:true, version:flowControlVersion(state.activity)})
  assert.equal(resumed.code, 200, resumed.error)
  assert.deepEqual(resumed.team.tasks[0], state.team.tasks[0])
  assert.equal(resumed.team.tasks[1].workflowPaused, false)
})

test('workflow and global control tokens include queued loop control changes',()=>{
 const {team,loop}=fixture();team.tasks.unshift(task('input'));team.tasks.find(t=>t.id==='a').dependencies=['input']
 const workflowBefore=workflowFingerprint(team),controlBefore=flowControlVersion(team)
 startLoop(team,loop.id)
 assert.notEqual(workflowFingerprint(team),workflowBefore)
 assert.notEqual(flowControlVersion(team),controlBefore)
})

test('one unreadable team cannot starve other teams loop watchdogs',async t=>{
 const root=await mkdtemp(join(tmpdir(),'teamflow-watchdog-isolation-'))
 const stateRoot=join(root,'.agent-teams'),effects=[],warnings=[]
 let watchdog
 const interval=globalThis.setInterval
 globalThis.setInterval=fn=>{watchdog=fn;return {unref(){}}}
 const captain={id:'captain',status:'idle',session:{header:{cwd:root}}}
 const ctx={agents:{get:id=>id==='captain'?captain:{id,status:'running'}},subagents:{drainChildren:async()=>{}},effect:fn=>effects.push(fn()),on(){},logger:{warn:message=>warnings.push(message)}}
 let scheduler
 try{scheduler=installTeamScheduler(ctx,{stateDir:'.agent-teams',dispatch:async()=>true})}finally{globalThis.setInterval=interval}
 t.after(async()=>{effects.forEach(fn=>fn?.());await rm(root,{recursive:true,force:true,maxRetries:5,retryDelay:100})})
 for(const id of ['broken','healthy']){
  const {team,loop}=fixture();team.id=id;loop.timeoutMinutes=1;startLoop(team,loop.id)
  beginTaskAttempt(team.tasks[0],'worker');team.tasks[0].status='in_progress'
  await createTeamDir(stateRoot,team);await scheduler.kickTeam(root,id,captain)
 }
 await writeFile(join(stateRoot,'broken','team.json'),'{bad')
 const clock=Date.now;Date.now=()=>clock()+120000
 try{
  watchdog()
  let state
  for(let i=0;i<500;i++){await new Promise(r=>setTimeout(r,10));state=await readTeam(stateRoot,'healthy');if(state.workflow.loops[0].status==='paused' && state.tasks[0].status==='pending')break}
  assert.equal(state.workflow.loops[0].status,'paused');assert.ok(warnings.length)
 }finally{Date.now=clock}
})

for (const target of ['human','ai']) test('running loop switches to '+target+' review before reaching the gate', async t => {
  const {team,loop} = fixture(target === 'ai' ? 'human' : 'ai')
  startLoop(team, loop.id)
  beginTaskAttempt(team.tasks[0], 'worker')
  team.tasks[0].status = 'in_progress'
  const f = await routeFixture(t, team)
  const before = await f.read(), fields = {taskId:'gate', base:workflowFingerprint(before)}
  assert.equal((await f.call('checkpoint_mode', {...fields, mode:'ai', reviewer:'worker'})).code, 409)
  const result = await f.call('checkpoint_mode', {...fields, mode:target, reviewer:'reviewer'})
  assert.equal(result.code, 200, result.error)
  const saved = await f.read(), current = saved.workflow.loops[0], gate = saved.tasks.find(task => task.id === 'gate')
  assert.equal(current.mode, target)
  assert.equal(gate.checkpoint.mode, target)
  assert.equal(gate.assignee, target === 'ai' ? 'reviewer' : undefined)
  assert.deepEqual(saved.tasks[0], before.tasks[0])
  for (const key of ['status','round','runId','historyHead','externalInputs']) assert.deepEqual(current[key], before.workflow.loops[0][key])
  finish(saved)
  await writeTeam(f.stateRoot, saved)
  const review = await f.read()
  assert.equal(review.workflow.loops[0].status, 'reviewing')
  assert.equal(loopCanExecute(review, review.tasks.find(task => task.id === 'gate')), target === 'ai')
  assert.equal((await f.call('checkpoint_mode', {...fields, base:workflowFingerprint(review), mode:target === 'human' ? 'ai' : 'human', reviewer:'reviewer'})).code, 409)
})

test('changing a queued gate reviewer preserves the pending start', async t => {
  const {team,loop} = fixture()
  team.tasks.unshift(task('input')); team.tasks.find(task => task.id === 'a').dependencies = ['input']
  startLoop(team, loop.id)
  const f = await routeFixture(t, team)
  const result = await f.call('checkpoint_mode',{taskId:'gate', mode:'ai', reviewer:'reviewer', base:workflowFingerprint(await f.read())})
  assert.equal(result.code, 200, result.error)
  const saved = await f.read()
  assert.equal(saved.workflow.loops[0].queued, true)
  finish(saved, ['input'])
  assert.equal(saved.workflow.loops[0].status, 'running')
  assert.equal(saved.workflow.loops[0].reviewer, 'reviewer')
})

test('IF settings update both routes atomically and retain the run across reviewer changes', () => {
  const {team, loop} = fixture()
  const config = {gateId:'gate', entryId:'b', mode:'ai', reviewer:'reviewer', maxRounds:4, timeoutMinutes:20, rejectToEntry:true}
  team.tasks.push(task('ship', ['after']))
  const original = structuredClone(team)
  assert.throws(() => saveGateSettings(team, config, ['a'], loop.id))
  assert.deepEqual(team, original)
  saveGateSettings(team, config, ['ship'], loop.id)
  const updated = team.workflow.loops[0]
  assert.equal(updated.runId, loop.runId)
  assert.deepEqual(updated.bodyIds, ['b'])
  assert.deepEqual(team.tasks.find(t => t.id === 'after').dependencies, [])
  assert.deepEqual(team.tasks.find(t => t.id === 'ship').dependencies, ['after','gate'])
  finish(team, ['a'])
  startLoop(team, loop.id)
  finish(team, ['b'])
  decideLoop(team, loop.id, decision(team, updated, 'revise', []), 'ai:reviewer')
  assert.equal(updated.round, 2)
  assert.equal(team.tasks.find(t => t.id === 'b').status, 'pending')
  pauseLoop(team, loop.id)
  saveGateSettings(team, {...config, mode:'human', reviewer:undefined}, ['ship'], loop.id)
  assert.equal(team.workflow.loops[0].round, 2)
  assert.equal(team.tasks.find(t => t.id === 'gate').assignee, undefined)
  startLoop(team, loop.id)
  validateWorkflowGraph(team)
})
