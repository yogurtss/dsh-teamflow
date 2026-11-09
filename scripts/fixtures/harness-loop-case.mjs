import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'

/** Real packaged HTTP, scheduler, child lifecycle and tool calls; only LLM output is scripted. */
export async function exerciseLoops({ baseUrl, cookie, ctx, record }) {
  for (const mode of ['human', 'ai']) {
    const owner = await ctx.agents.create({ sessionId: `session-loop-${mode}`, meta: { cwd: process.cwd() }, agentOptions: { provider: 'runtime-lab', model: 'manual-fixture' } })
    ctx.effect(() => () => owner.dispose()); await owner.agent.whenIdle()
    let teamId = ''
    const post = async (action, fields = {}) => {
      const response = await fetch(baseUrl + '/plugins/dsh-agent-teams/workflow', { method: 'POST', headers: { 'content-type': 'application/json', origin: baseUrl, cookie }, body: JSON.stringify({ sessionId: owner.agent.id, teamId, action, ...fields }), signal: AbortSignal.timeout(25000) })
      const result = await response.json(); assert.equal(response.status, 200, JSON.stringify(result)); return result
    }
    let state = await post('create', { name: `loop-${mode}`, description: 'Improve the same task, then release downstream' }); teamId = state.team.id
    state = await post('edit', { base: state.base, title: 'Configure bounded loop', operations: [
      { action: 'add_member', name: 'worker', summary: 'LOOP_WORKER', role: 'LOOP_WORKER', executionPrompt: 'LOOP_WORKER' },
      { action: 'add_member', name: 'reviewer', summary: 'LOOP_REVIEWER', role: 'LOOP_REVIEWER', executionPrompt: 'LOOP_REVIEWER' },
      { action: 'add_task', id: 'work', subject: 'Loop work', description: 'Implement and validate edge cases', assignee: 'worker', dependencies: [] },
      { action: 'add_task', id: 'gate', subject: 'Loop gate', description: 'Check edge cases and evidence', checkpoint: true, dependencies: ['work'] },
      { action: 'add_task', id: 'after', subject: 'Deliver', description: 'Deliver only after review passes', assignee: 'worker', dependencies: ['gate'] },
      { action: 'configure_loop', gateId: 'gate', entryId: 'work', mode, reviewer: mode === 'ai' ? 'reviewer' : undefined, maxRounds: 2, timeoutMinutes: 1 },
    ] })
    const id = state.team.workflow.loops[0].id
    await post('start')
    const wait = async status => {
      const deadline = Date.now() + 25000
      do { state = await post('state'); if (state.team.workflow.loops[0].status === status && state.team.members.every(m => m.status !== 'working')) return; await new Promise(r => setTimeout(r, 30)) } while (Date.now() < deadline)
      assert.fail(`Loop ${mode} did not reach ${status}: ${JSON.stringify(state.team)}`)
    }
    const decide = async decision => {
      const materials = await post('loop_materials', { loopId: id })
      await post('loop_decide', { ...materials, loopId: id, decisionId: crypto.randomUUID(), decision, note: 'Check boundaries and rerun verification', taskIds: decision === 'revise' ? ['work'] : [] })
    }
    if (mode === 'human') { await wait('reviewing'); await decide('revise'); await wait('reviewing'); await decide('revise') }
    await wait('paused')
    assert.equal(state.team.workflow.loops[0].round, 2)
    assert.equal(state.team.tasks.find(t => t.id === 'after').status, 'pending')
    await post('loop_start', { base: state.base, loopId: id, additionalRounds: 1 })
    if (mode === 'human') { await wait('reviewing'); await decide('pass') }
    await wait('passed')
    const deadline = Date.now() + 25000
    while (state.team.tasks.find(t => t.id === 'after').status !== 'completed') { assert.ok(Date.now() < deadline, 'Downstream stalled'); await new Promise(r => setTimeout(r, 30)); state = await post('state') }
    assert.deepEqual(state.team.tasks.map(t => t.id), ['work', 'gate', 'after'])
    const history = []; let cursor
    do { const page = await post('loop_history', { loopId: id, cursor }); history.push(...page.records); cursor = page.next } while (cursor)
    assert.deepEqual(history.filter(r => r.kind === 'decision').map(r => r.decision), ['pass', 'revise', 'revise'])
    assert.equal(history.filter(r => r.kind === 'execution').length, 3)
    const snapshot = { rounds: 3, decisions: history.filter(r => r.kind === 'decision').map(r => r.decision), tasks: state.team.tasks.map(t => ({ id: t.id, status: t.status })), historicalResults: history.filter(r => r.kind === 'execution').map(r => r.tasks[0].output.replace(/LOOP_RESULT work .+/, 'LOOP_RESULT work <attempt>')) }
    assert.deepEqual(snapshot, JSON.parse(readFileSync(new URL('./gated-loops.snapshot.json', import.meta.url), 'utf8')))
    writeFileSync(`loop-${mode}-resume.json`, JSON.stringify({ teamId, loopId: id, runId: state.team.workflow.loops[0].runId, historyHead: state.team.workflow.loops[0].historyHead }))
    record({ event: 'gated-loop-passed', mode, snapshot })
  }
}
