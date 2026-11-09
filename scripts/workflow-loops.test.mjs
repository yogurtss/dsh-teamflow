import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtemp, rm, readFile, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { configureLoop, decideLoop, startLoop, reconcileLoops, loopInputFingerprint, loopCanExecute, pauseLoop, pendingLoopHistory } from '../lib/workflow-loops.js'
import { readLoopHistory } from '../lib/workflow-loop-history.js'
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

test('AI artifact drift pauses immediately and persists the reason without releasing downstream', async t => {
  const { team, loop } = fixture('ai'); startLoop(team, loop.id); finish(team)
  const gate = team.tasks.find(t => t.id === 'gate'); beginTaskAttempt(gate, 'reviewer')
  loop.reviewArtifactEvidence = 'old artifact digest'
  const f = await routeFixture(t, team)
  const input = decision(team, loop, 'pass', [])
  const result = await f.tool('agent_teams_decide_loop', { loop_id: loop.id, run_id: loop.runId, round: loop.round, fingerprint: input.fingerprint,
    attempt_id: gate.attemptId, decision_id: input.decisionId, decision: 'pass', note: input.note, task_ids: [] })
  assert.equal(result.status, 'paused')
  const saved = await f.read()
  assert.equal(saved.workflow.loops[0].status, 'paused'); assert.match(saved.workflow.loops[0].reason, /文件已变化/)
  assert.notEqual(saved.tasks.find(t => t.id === 'gate').status, 'completed')
  assert.equal(saved.tasks.find(t => t.id === 'after').status, 'pending')
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

test('artifact hashing stays off the host event loop and human decisions reject changed files', async t => {
  const { team, loop } = fixture(); startLoop(team, loop.id); finish(team)
  team.tasks[0].changedPaths = ['artifact.txt']
  const f = await routeFixture(t, team)
  await writeFile(join(f.root, 'artifact.txt'), 'a'.repeat(1024 * 1024))
  let ticks = 0; const timer = setInterval(() => ticks++, 1)
  let materials
  try { materials = await f.call('loop_materials', { loopId: loop.id }) } finally { clearInterval(timer) }
  assert.equal(materials.code, 200); assert.ok(ticks > 0, 'File hashing must yield to the host')
  await writeFile(join(f.root, 'artifact.txt'), 'changed during human review')
  const result = await f.call('loop_decide', { loopId: loop.id, ...decision(team, loop, 'pass', []), artifactEvidence: materials.artifactEvidence })
  assert.equal(result.code, 409); assert.match(result.error, /文件已变化/)
  assert.equal((await f.read()).workflow.loops[0].status, 'reviewing')
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

async function routeFixture(t, source) {
  const root = await mkdtemp(join(tmpdir(), 'teamflow-loop-route-')); t.after(() => rm(root, { recursive: true, force: true }))
  const stateRoot = join(root, '.agent-teams'); await createTeamDir(stateRoot, source)
  const captain = { id: 'captain', status: 'idle', session: { header: { id: 'captain', cwd: root }, ownEvents: () => [] } }
  const live = new Map([[captain.id, captain], ...source.members.map(m => [m.id, { id: m.id, status: 'running', session: { header: { id: m.id, cwd: root }, ownEvents: () => [] } }])])
  const definitions = new Map(), effects = [], noop = () => {}; let route
  const ctx = { on: () => noop, effect: fn => effects.push(fn()), logger: { warn: noop, debug: noop }, tools: { register: d => definitions.set(d.name, d) }, agents: { get: id => live.get(id) }, llm: { resolveCallConfig: async v => v }, subagents: { followup: async () => {}, registerContinuableSetup: () => noop, drainChildren: async () => {} } }
  t.after(() => effects.forEach(fn => typeof fn === 'function' && fn()))
  const config = { stateDir: '.agent-teams', maxMembers: 8, memberProvider: 'spawn', memberMaxDepth: 1, profiles: {}, toolPolicies: {} }
  const runtime = registerAgentTeamsTools(ctx, config)
  installWorkflowWorkbench(ctx, config, runtime, { register: value => { route = value; return noop } })
  return { root, stateRoot, read: () => readTeam(stateRoot, source.id),
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

test('unreadable AI review artifacts pause before claiming a review attempt', async t => {
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
  assert.equal(saved.workflow.loops[0].status, 'paused'); assert.match(saved.workflow.loops[0].reason, /无法读取审核文件/)
  assert.equal(sent.length, 0); assert.equal(saved.tasks[2].attemptId, undefined)
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

test('workflow and global control tokens include queued loop control changes',()=>{
 const {team,loop}=fixture();team.tasks.unshift(task('input'));team.tasks.find(t=>t.id==='a').dependencies=['input']
 const workflowBefore=workflowFingerprint(team),controlBefore=flowControlVersion(team)
 startLoop(team,loop.id)
 assert.notEqual(workflowFingerprint(team),workflowBefore)
 assert.notEqual(flowControlVersion(team),controlBefore)
})

test('one unreadable team cannot starve other teams loop watchdogs',async t=>{
 const root=await mkdtemp(join(tmpdir(),'teamflow-watchdog-isolation-'));t.after(()=>rm(root,{recursive:true,force:true}))
 const stateRoot=join(root,'.agent-teams'),effects=[],warnings=[]
 let watchdog
 const interval=globalThis.setInterval
 globalThis.setInterval=fn=>{watchdog=fn;return {unref(){}}}
 const captain={id:'captain',status:'idle',session:{header:{cwd:root}}}
 const ctx={agents:{get:id=>id==='captain'?captain:{id,status:'running'}},subagents:{drainChildren:async()=>{}},effect:fn=>effects.push(fn()),on(){},logger:{warn:message=>warnings.push(message)}}
 let scheduler
 try{scheduler=installTeamScheduler(ctx,{stateDir:'.agent-teams',dispatch:async()=>true})}finally{globalThis.setInterval=interval}
 t.after(()=>effects.forEach(fn=>fn?.()))
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
  for(let i=0;i<100;i++){await new Promise(r=>setTimeout(r,10));state=await readTeam(stateRoot,'healthy');if(state.workflow.loops[0].status==='paused')break}
  assert.equal(state.workflow.loops[0].status,'paused');assert.ok(warnings.length)
 }finally{Date.now=clock}
})
