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
import { createTeamDir, readTeam } from '../lib/state.js'
import { installWorkflowConversations } from '../lib/workflow-native.js'
import { connectionIssue, connectionTarget } from '../lib/client/workflow-connections.js'
import { openAgentTeamMember } from '../lib/client/session-navigation.js'
import { taskDraftOperations } from '../lib/client/workflow-draft.js'

const member = { id: '', name: 'worker', role: 'developer', provider: 'fixture', model: 'fixture', status: 'idle', joinedAt: 1 }
const task = (id, dependencies = []) => ({ id, subject: id, assignee: 'worker', dependencies, status: 'pending', attempt: 0, kind: 'work', createdAt: 1, updatedAt: 1 })
const team = () => ({ id: 'demo', name: 'Demo', captainSessionId: 'captain-id', members: [{ ...member }], tasks: [task('t1')], taskSeq: 1, createdAt: 1, phase: 'running' })
const withGate = () => applyWorkflowOperations(team(), [{ action: 'add_task', id: 'gate', subject: 'Human review', checkpoint: true, dependencies: ['t1'] }, { action: 'add_task', id: 'after', subject: 'After', dependencies: ['gate'], assignee: 'worker' }])

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
})

test('native discussion and return-to-captain navigation open ordinary sessions', async () => {
  const seen = []
  await openAgentTeamMember({}, 'discussion', 'discussion', { selectPanel: value => seen.push(value) }, { openSession: value => seen.push(value) })
  assert.deepEqual(seen, ['discussion', null])
})

test('restored native discussion is restricted and cannot propose outside its own scope', async t => {
  const root = mkdtempSync(join(tmpdir(), 'workflow-native-')); t.after(() => rmSync(root, { recursive: true, force: true }))
  const source = team(), label = 'native-label', nativeId = `session-at-discussion-${createHash('sha256').update('demo').digest('hex').slice(0, 16)}-00000000-0000-0000-0000-000000000001`
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
  const persisted = await readTeam(join(root, '.agent-teams'), 'demo')
  assert.equal(persisted.members[0].summary, undefined)
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
  let spec; const prompts = [], filters = []
  const ctx = { tools: { register() {} }, subagents: { registerContinuableSetup() {} }, llm: { resolveCallConfig: async value => value }, effect() {}, sessions: { flush: async () => {} }, agents: {
    get: () => ({ status: 'idle' }), create: async value => { spec = value; value.setup({ effect: fn => fn(), tools: { restrict: filter => { filters.push(filter); return () => {} } } }); return { agent: { id: value.sessionId, session: {}, whenIdle: async () => {}, followup: message => prompts.push(message) }, dispose() {} } },
  } }
  const runtime = installWorkflowConversations(ctx, { stateDir: '.agent-teams', maxMembers: 8 }, workflowMaterials)
  const captain = { id: 'captain-id', options: { provider: 'fake', model: 'fake' }, session: { header: { cwd: root }, requestHeader: () => ({ config: {} }) } }
  const id = await runtime.open(captain, source, 'member:worker', join(root, '.agent-teams'), { fresh: true, message: 'Focus on requirement risks' })
  assert.notEqual(id, captain.id); assert.notEqual(id, 'old-discussion')
  assert.equal(spec.resumeSessionId, undefined); assert.equal(spec.parentSessionId, undefined)
  assert.match(prompts[0].content[0].text, /Review requirements/)
  assert.match(prompts[0].content[0].text, /Check acceptance criteria/)
  assert.match(prompts[0].content[0].text, /Focus on requirement risks/)
  assert.doesNotMatch(prompts[0].content[0].text, /OLD HISTORY/)
  assert.deepEqual(filters, [{ allow: ['agent_teams_workflow_context', 'agent_teams_workflow_propose'] }])
  assert.ok(Object.entries(source.workflow.discussions).some(([key, value]) => key.startsWith('archive:') && value.native.sessionId === 'old-discussion'))
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
