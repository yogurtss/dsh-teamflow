import assert from 'node:assert/strict';
import { createUserMessage } from '@deepseek-ai/dsh-llm';
import { writeFileSync } from 'node:fs';

/** Runs against the packaged plugin, real authentication, scheduler and LLM service. */
export async function exerciseWorkflow({ baseUrl, cookie, captain, readTeam, record, ctx, events }) {
  let activeSession = captain.id, activeTeam = 'runtime-lab';
  const post = async (action, fields = {}, expected = 200) => {
    const response = await fetch(baseUrl + '/plugins/dsh-agent-teams/workflow', {
      method: 'POST', headers: { 'content-type': 'application/json', origin: baseUrl, cookie },
      body: JSON.stringify({ sessionId: activeSession, teamId: activeTeam, action, ...fields }), signal: AbortSignal.timeout(25000),
    });
    const result = await response.json();
    assert.equal(response.status, expected, JSON.stringify(result)); return result;
  };
  const nativeDiscussion = async (key) => {
    const before = events.filter(e => e.event === 'web-request' && !e.isMember).length;
    const opened = await post('open_discussion', { discussion: key });
    assert.ok(opened.openedSessionId); assert.notEqual(opened.openedSessionId, captain.id);
    const deadline = Date.now() + 20000;
    while (!events.some(e => e.event === 'workflow-native-finished' && e.sessionId === opened.openedSessionId)) {
      assert.ok(Date.now() < deadline, 'Native discussion did not finish: ' + key);
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    const live = ctx.agents.get(opened.openedSessionId); assert.ok(live); await live.whenIdle();
    assert.equal(live.session.header.parentSession, undefined, 'Discussion must have no execution parent');
    const scoped = await post('state', { sessionId: live.id }); assert.equal(scoped.currentDiscussion, key);
    await post('state', { sessionId: live.id, teamId: 'another-team' }, 409);
    live.followup(createUserMessage({ content: [{ type: 'text', text: '继续核对当前方案，不应用修改。' }], source: { kind: 'user' } }));
    await live.whenIdle();
    assert.equal(events.filter(e => e.event === 'workflow-native-finished' && e.sessionId === live.id).length, 2, 'Native follow-up must retain history and restrictions');
    await ctx.sessions.flush(live.session);
    assert.equal(events.filter(e => e.event === 'web-request' && !e.isMember).length, before, 'Discussion must not wake the execution captain');
    const same = await post('open_discussion', { discussion: key }); assert.equal(same.openedSessionId, opened.openedSessionId, 'Reopening must reuse native history');
    return post('state');
  };
  const unauthorized = await fetch(baseUrl + '/plugins/dsh-agent-teams/workflow', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sessionId: captain.id, teamId: 'runtime-lab', action: 'state' }) });
  assert.ok([401, 403].includes(unauthorized.status));
  await post('state', { teamId: 'missing-team' }, 409);
  const prior = readTeam().members[0].summary;
  let result = await nativeDiscussion('member:worker');
  assert.equal(readTeam().members[0].summary, prior, 'Discussion must not mutate the worker');
  const proposal = result.team.workflow.discussions['discussion:member:worker'].proposal;
  assert.equal(proposal.status, 'pending');
  result = await post('apply', { discussion: 'member:worker', proposalId: proposal.id });
  assert.equal(result.team.members[0].summary, '负责实现与自测，交付验证证据');
  assert.equal(result.team.members[0].id, '', 'Persona change retires the old execution session');
  await post('apply', { discussion: 'member:worker', proposalId: proposal.id }, 409);
  result = await post('preview', { title: '两个串联的人工检查', operations: [
    { action: 'add_task', id: 'g1', subject: '第一次验收', dependencies: ['t1'], checkpoint: true },
    { action: 'add_task', id: 'g2', subject: '第二次验收', dependencies: ['g1'], checkpoint: true },
  ] });
  assert.equal(readTeam().tasks.length, 1);
  result = await post('apply', { proposalId: result.team.workflow.discussions['discussion:graph'].proposal.id });
  assert.deepEqual(result.ready, ['g1']);
  await post('preview', { title: '模型不得批准', operations: [{ action: 'approve', id: 'g1' }] }, 409);
  await post('review', { taskId: 'g1', decision: 'approve', evidence: 'unseen' }, 409);
  result = await nativeDiscussion('check:g1');
  const discussion = result.team.workflow.discussions['discussion:check:g1'];
  assert.ok(discussion.materials.includes('WEB_MEMBER_TASK_DONE'));
  assert.ok(discussion.native.sessionId); assert.equal(discussion.calls.length, 0);
  assert.equal(result.team.tasks.find(t => t.id === 'g1').status, 'pending');
  result = await post('review', { taskId: 'g1', decision: 'approve', evidence: discussion.evidence, note: '已核对' });
  assert.deepEqual(result.ready, ['g2']);
  await post('review', { taskId: 'g1', decision: 'approve', evidence: discussion.evidence }, 409);
  result = await nativeDiscussion('check:g2');
  result = await post('review', { taskId: 'g2', decision: 'reject', evidence: result.team.workflow.discussions['discussion:check:g2'].evidence, note: '需要更多证据' });
  assert.equal(result.team.tasks.find(t => t.id === 'g2').status, 'pending');
  assert.equal(result.team.tasks.find(t => t.id === 'g2').checkpoint.decision, 'reject');
  assert.deepEqual(result.ready, []);
  const manual = await ctx.agents.create({ sessionId: 'session-workflow-' + Date.now(), meta: { cwd: process.cwd() }, agentOptions: { provider: 'runtime-lab', model: 'manual-fixture' } });
  ctx.effect(() => () => manual.dispose());
  await manual.agent.whenIdle(); activeSession = manual.agent.id; activeTeam = '';
  result = await post('create', { name: 'manual-workflow', description: '先人工验收，再执行任务' });
  activeTeam = result.team.id;
  assert.equal(result.team.workflow.mode, undefined); assert.equal(result.team.phase, 'staged');
  await post('create', { name: 'duplicate' }, 409);
  await post('state', { sessionId: captain.id }, 409);
  result = await post('preview', { title: '手动创建可运行流程', operations: [
    { action: 'add_member', name: 'worker', summary: '完成验证任务', role: 'WEB_APPROVAL_MEMBER', executionPrompt: 'WEB_APPROVAL_MEMBER: complete the assigned task and report.' },
    { action: 'add_task', id: 'gate', subject: '开始前人工确认', dependencies: [], checkpoint: true },
    { action: 'add_task', id: 't1', subject: '人工确认后执行', dependencies: ['gate'], assignee: 'worker' },
  ] });
  result = await post('apply', { proposalId: result.team.workflow.discussions['discussion:graph'].proposal.id });
  assert.ok(result.team.taskSeq >= Math.max(0, ...result.team.tasks.map(task => /^t\d+$/.test(task.id) ? Number(task.id.slice(1)) : 0)), 'Canvas IDs must advance the original task allocator');
  result = await post('start');
  assert.equal(result.team.phase, 'running'); assert.deepEqual(result.ready, ['gate']);
  assert.equal(result.team.members[0].id, '', 'Checkpoint must prevent lazy worker spawn');
  result = await post('stop_task', { taskId: 't1' });
  assert.equal(result.team.tasks[1].workflowPaused, true);
  result = await nativeDiscussion('check:gate');
  result = await post('review', { taskId: 'gate', decision: 'approve', evidence: result.team.workflow.discussions['discussion:check:gate'].evidence });
  assert.equal(result.team.members[0].id, '', 'Approval must not resume a task explicitly paused for editing');
  await post('resume_task', { taskId: 't1' });
  const deadline = Date.now() + 20000;
  do {
    result = await post('state');
    if (result.team.tasks[1].status === 'completed') break;
    await new Promise(resolve => setTimeout(resolve, 50));
  } while (Date.now() < deadline);
  assert.equal(result.team.tasks[1].output, 'WEB_MEMBER_TASK_DONE', 'Approving and resuming must dispatch a real member through the scheduler');
  for (const agent of ctx.agents.list()) await agent.whenIdle();
  const automatic = await ctx.agents.create({ sessionId: 'session-auto-' + Date.now(), meta: { cwd: process.cwd() }, agentOptions: { provider: 'runtime-lab', model: 'manual-fixture' } });
  ctx.effect(() => () => automatic.dispose()); await automatic.agent.whenIdle();
  activeSession = automatic.agent.id; activeTeam = '';
  result = await post('create', { name: 'auto-workflow', description: '自动规划验证' }); activeTeam = result.team.id;
  assert.equal(result.team.workflow.mode, undefined);
  result = await nativeDiscussion('graph');
  assert.equal(result.team.members.length, 0, 'Automatic planning remains a proposal until confirmed');
  result = await post('apply', { proposalId: result.team.workflow.discussions['discussion:graph'].proposal.id });
  assert.equal(result.team.members.length, 1); assert.equal(result.team.tasks.length, 1); assert.equal(result.team.phase, 'staged');
  const nativeId = result.team.workflow.discussions['discussion:graph'].native.sessionId;
  writeFileSync('workflow-resume.json', JSON.stringify({ teamId: activeTeam, captainId: activeSession, nativeId }));
  await ctx.sessions.flush(automatic.agent.session);
  record({ event: 'workflow-workbench-passed', proposalIsolation: true, nativeScopedDiscussion: true, humanApproval: true, rejectionBlocks: true });
  process.stdout.write('WORKFLOW_WORKBENCH_OK\n');
}
