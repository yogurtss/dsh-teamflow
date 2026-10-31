import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
export const name = 'feature-workflow-trial';
export const inject = ['llm', 'agents', 'sessions', 'webServer', 'connection', 'workspaceRegistry'];
export function apply(ctx) {
    ctx.effect(() => ctx.webServer.register({ kind: 'exact', path: '/', handler(req, res) { if (!ctx.connection.authorizeIndex(req, res))
            return; res.writeHead(200, { 'content-type': 'text/plain' }); res.end('Workflow trial'); } }));
    const report = process.env.WORKFLOW_TRIAL_REPORT, events = [];
    let requests = 0, stage = 'startup', state;
    const record = e => { events.push({ ...e, at: Date.now() }); appendFileSync(join(report, 'trace.jsonl'), JSON.stringify(events.at(-1)) + '\n'); };
    ctx.on('llm/stream', async function* (options, next) { if (++requests > 70)
        throw Error('Trial request budget exhausted'); record({ event: 'model-request', request: requests, provider: options.provider, model: options.model, sessionId: options.sessionId }); try {
        for await (const chunk of next()) {
            if (chunk.type === 'text-delta')
                record({ event: 'text', text: chunk.text });
            yield chunk;
        }
    }
    catch (error) {
        record({ event: 'model-error', message: String(error.message).slice(0, 600) });
        throw error;
    } });
    ctx.on('tools/result', (exec, result) => record({ event: 'tool-result', name: exec.name, arguments: exec.arguments, isError: result.isError, ...result.isError ? { result } : {} }));
    const bounded = async (promise) => { let timer; try {
        return await Promise.race([promise, new Promise((_, reject) => timer = setTimeout(() => reject(Error('Agent idle timeout at ' + stage)), 300000))]);
    }
    finally {
        clearTimeout(timer);
    } };
    void (async () => {
        await ctx.get('loader').await();
        await ctx.workspaceRegistry.create(process.cwd(), 'Feature workflow trial');
        const handle = await ctx.agents.create({ sessionId: 'session-feature-' + Date.now(), meta: { cwd: process.cwd() }, agentOptions: { provider: 'deepseek-account', model: 'deepseek-flash', reasoningEffort: 'high' } });
        ctx.effect(() => () => handle.dispose());
        await bounded(handle.agent.whenIdle());
        const origin = 'http://127.0.0.1:' + ctx.webServer.port;
        const auth = await fetch(ctx.connection.authenticatedUrl(origin), { redirect: 'manual' });
        assert.equal(auth.status, 303);
        const cookie = auth.headers.get('set-cookie').split(';', 1)[0];
        let teamId = '';
        const post = async (action, fields = {}, expected = 200) => { const response = await fetch(origin + '/plugins/dsh-agent-teams/workflow', { method: 'POST', headers: { 'content-type': 'application/json', origin, cookie }, body: JSON.stringify({ sessionId: handle.agent.id, teamId, action, ...fields }), signal: AbortSignal.timeout(25000) }); const body = await response.json(); assert.equal(response.status, expected, JSON.stringify(body)); if (body.team)
            state = body; record({ event: 'action', action, status: response.status, tasks: body.team?.tasks.map(t => ({ id: t.id, status: t.status, pending: t.workflowConfigPending, paused: t.workflowPaused })) }); return body; };
        const discussion = async (key) => { stage = 'discussion:' + key; const opened = await post('open_discussion', { discussion: key }); const live = ctx.agents.get(opened.openedSessionId); assert.ok(live); await bounded(live.whenIdle()); return post('state'); };
        const waitTask = async (id) => { stage = 'execute:' + id; const deadline = Date.now() + 300000; do {
            await post('state');
            const task = state.team.tasks.find(t => t.id === id);
            if (task.status === 'completed')
                return task;
            if (task.status === 'failed')
                throw Error('Task failed ' + id + ': ' + task.output);
            await new Promise(r => setTimeout(r, 1000));
        } while (Date.now() < deadline); throw Error('Task timeout ' + id); };
        stage = 'apply-template';
        await post('template_apply', { templateId: 'builtin-feature', version: 1, name: '端口输入校验', description: readFileSync('README.md', 'utf8') });
        teamId = state.team.id;
        const topology = state.team.tasks.map(t => ({ id: t.id, dependencies: t.dependencies, general: t.layers.general }));
        await post('start', {}, 409);
        await discussion('adapt');
        const proposal = state.team.workflow.discussions['discussion:adapt'].proposal;
        assert.equal(proposal?.status, 'pending', 'Adaptation must produce a pending proposal');
        assert.ok(state.team.tasks.every(t => !t.layers.specific.requirements), 'Generation must not overwrite without confirmation');
        await post('apply', { discussion: 'adapt', proposalId: proposal.id });
        assert.deepEqual(state.team.tasks.map(t => ({ id: t.id, dependencies: t.dependencies, general: t.layers.general })), topology);
        assert.ok(state.team.tasks.every(t => !t.workflowConfigPending));
        assert.ok(state.team.members.every(m => !m.id));
        writeFileSync(join(report, 'adapted.json'), JSON.stringify(state, null, 2));
        await post('start');
        await waitTask('requirements');
        assert.ok(existsSync('requirements.md'), 'Analyst must produce the requirements artifact');
        const requirements = readFileSync('requirements.md', 'utf8');
        for (const term of ['validatePort', '65535', 'validator.mjs', 'node:test'])
            assert.ok(requirements.includes(term), 'Missing requirement: ' + term);
        assert.ok(!existsSync('validator.mjs') && !existsSync('validator.test.mjs'), 'Implementation must wait for the scope review');
        await discussion('check:scope-review');
        await post('review', { taskId: 'scope-review', decision: 'approve', evidence: state.team.workflow.discussions['discussion:check:scope-review'].evidence, note: '测试驱动确认 README 中固定的端口语义与范围；允许实现。' });
        await waitTask('implementation');
        await waitTask('verification');
        stage = 'external-verification';
        assert.equal(readFileSync('requirements.md', 'utf8'), requirements, 'Builder/verifier must preserve the approved specification');
        const command = spawnSync(process.execPath, ['--test', 'validator.test.mjs'], { encoding: 'utf8', timeout: 30000 });
        assert.equal(command.status, 0, command.stdout + command.stderr);
        const { validatePort } = await import(pathToFileURL(join(process.cwd(), 'validator.mjs')));
        for (const value of [1, 80, 443, 65535])
            assert.equal(validatePort(value), true);
        for (const value of [0, -1, 65536, 1.5, NaN, Infinity, -Infinity, '80', '', null, undefined, true, {}, [], 1n, Symbol('port')])
            assert.equal(validatePort(value), false, 'Invalid input accepted: ' + String(value));
        writeFileSync(join(report, 'external-test.txt'), command.stdout + command.stderr);
        await discussion('check:acceptance');
        await post('review', { taskId: 'acceptance', decision: 'approve', evidence: state.team.workflow.discussions['discussion:check:acceptance'].evidence, note: '测试驱动已在 Agent 外复跑 node:test 并验证 20 个边界输入。' });
        assert.ok(state.team.tasks.every(t => t.status === 'completed'));
        stage = 'complete';
        record({ event: 'workflow-passed' });
        writeFileSync(join(report, 'result.json'), JSON.stringify({ passed: true, stage, requests, team: state.team, externalCases: 20 }, null, 2));
        ctx.get('appExit')(0);
    })().catch(error => { writeFileSync(join(report, 'result.json'), JSON.stringify({ passed: false, stage, requests, error: String(error.stack), team: state?.team, modelErrors: events.filter(e => e.event === 'model-error') }, null, 2)); ctx.get('appExit')(1); });
}
