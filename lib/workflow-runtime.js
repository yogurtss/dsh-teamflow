import { createHash, randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { boundDiscussion, discussionAddress, workflowDiscussion as discussionOf } from "./workflow-native.js";
import { readJsonRequest, RequestBodyError } from "./web-routes.js";
import { createTeamDir, findTeamByCaptain, readArchivedTeam, readTeam, recordRetiredMemberIds, sanitizeKey, withTeamLock, writeTeam } from "./state.js";
import { prepareArchivedWorkflow } from "./workflow-lifecycle.js";
import { assembleTeamSnapshot } from "./snapshot.js";
import { leadIdentityOfAsync, sessionLeadsTeamAsync } from "./lineage.js";
import { resolveMemberLlmSelection, memberActivity } from "./members.js";
import { drainMemberChildren } from "./harness-compat.js";
import { readArtifactScope } from "./artifacts.js";
import { applyWorkflowProposal, checkpointInputs, checkpointReady, decideCheckpoint, parseWorkflowOperations, proposeWorkflow, workflowFingerprint, workflowState } from "./workflow.js";
function string(value, name) {
    if (typeof value !== 'string' || !value.trim() || value.length > 16000)
        throw new Error(`${name} 不能为空或过长`);
    return value.trim();
}
export function workflowMaterials(team, taskId, workspace) {
    const gate = team.tasks.find(t => t.id === taskId && t.checkpoint);
    if (!gate)
        throw new Error('检查点不存在');
    const inputs = checkpointInputs(team, gate);
    const paths = [...new Set(inputs.flatMap(t => [...t.changedPaths ?? [], ...t.deliverables ?? []]))];
    const files = paths.length ? readArtifactScope(workspace, paths) : { artifacts: [], gaps: [] };
    const material = { check: { id: gate.id, subject: gate.subject, description: gate.description, round: gate.checkpoint.round },
        results: inputs.map(t => ({ id: t.id, subject: t.subject, status: t.status, attemptId: t.attemptId,
            output: t.output, changedPaths: t.changedPaths, commandsRun: t.commandsRun, acceptanceResults: t.acceptanceResults })),
        files, limitation: '任务输出和命令结果由执行 Agent 提交；文件摘要由宿主读取。验收 Agent 未独立运行命令，也未读取全部文件内容。' };
    const text = JSON.stringify(material, null, 2);
    if (text.length > 180000)
        throw new Error('验收材料过大，请将检查点拆分为更小范围');
    return { text, evidence: createHash('sha256').update(text).digest('hex') };
}
/** Authenticated human controls are separate from model tools. */
export function installWorkflowWorkbench(ctx, config, runtime, server, conversations) {
    const stopping = new Set();
    ctx.effect(() => server.register({ kind: 'exact', path: '/plugins/dsh-agent-teams/workflow', handler: async (req, res) => {
            const reply = (status, value) => {
                res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
                res.end(JSON.stringify(value));
            };
            if (req.method !== 'POST') {
                reply(405, { error: 'POST required' });
                return;
            }
            try {
                const body = await readJsonRequest(req);
                const caller = ctx.agents.get(string(body['sessionId'], 'sessionId'));
                if (!caller)
                    throw new Error('请先打开当前原生对话');
                const address = discussionAddress(caller, config.stateDir);
                let captain = address ? ctx.agents.get(address.captainSessionId) : caller;
                if (!captain && address) {
                    // Navigating to an independent conversation can release the captain's
                    // view. Reattach its exact persisted session after checking ownership.
                    const discussionRoot = join(caller.session.header.cwd ?? process.cwd(), config.stateDir);
                    const owner = await readTeam(discussionRoot, address.teamId);
                    if (!owner || !boundDiscussion(owner, caller))
                        throw new Error('讨论会话已失效');
                    captain = await withTeamLock(`workflow-captain:${discussionRoot}:${owner.captainSessionId}`, async () => {
                        const live = ctx.agents.get(owner.captainSessionId);
                        if (live)
                            return live;
                        const handle = await ctx.agents.resume({ resumeSessionId: owner.captainSessionId });
                        ctx.effect(() => () => handle.dispose(), 'agent-teams: discussion captain view');
                        return handle.agent;
                    });
                }
                if (!captain)
                    throw new Error('请先打开队长对话，使当前会话连接到宿主');
                const workspace = captain.session.header.cwd ?? process.cwd(), root = join(workspace, config.stateDir);
                const action = string(body['action'], 'action');
                let teamId = typeof body['teamId'] === 'string' ? body['teamId'] : address?.teamId ?? '';
                if (address && teamId !== address.teamId)
                    throw new Error('讨论不属于此团队');
                if (!teamId && body['action'] === 'state')
                    teamId = (await findTeamByCaptain(root, captain.id, await leadIdentityOfAsync(ctx, captain.session)))?.id ?? '';
                if (!teamId && action === 'state') {
                    reply(200, { team: null, ready: [], busy: [] });
                    return;
                }
                if (action === 'create') {
                    if (address)
                        throw new Error('请返回队长对话创建团队');
                    await withTeamLock(`captain:${root}:${captain.id}`, async () => {
                        if (await findTeamByCaptain(root, captain.id, await leadIdentityOfAsync(ctx, captain.session)))
                            throw new Error('当前会话已有团队，请在已有团队中编辑');
                        const name = string(body['name'], '团队名称');
                        teamId = `${sanitizeKey(name).slice(0, 60)}-${randomUUID().slice(0, 8)}`;
                        await createTeamDir(root, { name, id: teamId, captainSessionId: captain.id, description: typeof body['description'] === 'string' ? body['description'] : '',
                            phase: 'staged', members: [], tasks: [], taskSeq: 0, createdAt: Date.now(),
                            workflow: { positions: {}, discussions: {}, history: [] } });
                    });
                }
                if (!teamId || sanitizeKey(teamId) !== teamId)
                    throw new Error('无效团队 ID');
                const lock = `team:${root}:${teamId}`;
                if (action === 'archive_state') {
                    const archived = await readArchivedTeam(root, teamId);
                    if (address || !archived || !(await sessionLeadsTeamAsync(ctx, archived, captain.id)))
                        throw new Error('当前会话不能查看此归档');
                    reply(200, { team: archived, base: workflowFingerprint(archived), ready: [], busy: [] });
                    return;
                }
                if (action === 'restore_archive') {
                    if (address)
                        throw new Error('请返回原队长对话恢复流程');
                    const restored = await withTeamLock(`captain:${root}:${captain.id}`, () => withTeamLock(lock, async () => {
                        const archived = await readArchivedTeam(root, teamId);
                        if (!archived || !(await sessionLeadsTeamAsync(ctx, archived, captain.id)))
                            throw new Error('当前会话不能恢复此归档');
                        if (await readTeam(root, teamId) || await findTeamByCaptain(root, captain.id, await leadIdentityOfAsync(ctx, captain.session)))
                            throw new Error('当前对话已有可编辑团队，请先查看当前团队');
                        const copy = prepareArchivedWorkflow(archived);
                        await createTeamDir(root, copy);
                        return copy;
                    }));
                    reply(200, { team: restored, base: workflowFingerprint(restored), ready: [], busy: [], activity: await assembleTeamSnapshot(ctx, root, '', restored) });
                    return;
                }
                const load = async () => {
                    const team = await readTeam(root, teamId);
                    if (!team || (address && !boundDiscussion(team, caller)) || !(await sessionLeadsTeamAsync(ctx, team, captain.id)))
                        throw new Error('当前会话不能管理此团队');
                    return team;
                };
                const currentDiscussion = address ? boundDiscussion(await load(), caller)?.key : undefined;
                const key = typeof body['discussion'] === 'string' ? body['discussion'] : currentDiscussion ?? 'graph';
                const toggling = action === 'set_task_enabled';
                if (toggling && (typeof body['enabled'] !== 'boolean' || typeof body['updatedAt'] !== 'number'))
                    throw new Error('节点开关需要目标状态和当前版本，请刷新后重试');
                const checkToggle = (team, task) => {
                    if (!toggling)
                        return;
                    if (team.halted || !task || task.updatedAt !== body['updatedAt'])
                        throw new Error('节点或团队状态已变化，请刷新后重试');
                    if (['completed', 'failed', 'cancelled'].includes(task.status) || task.checkpoint?.decision || task.workflowConfigPending || task.workflowRerunRequired)
                        throw new Error('请在节点属性中完成配置、处理退回或确认重跑');
                };
                let openedSessionId;
                if (action === 'conversation_state' || action === 'conversation_send') {
                    if (!conversations)
                        throw new Error('宿主未加载原生讨论服务');
                    const payload = await withTeamLock(lock, async () => {
                        const team = await load();
                        if (action === 'conversation_send')
                            await conversations.sendEmbedded(team, key, string(body['message'], '讨论内容'));
                        return conversations.readEmbedded(team, key);
                    });
                    reply(200, payload);
                    return;
                }
                else if (action === 'open_discussion') {
                    if (!conversations)
                        throw new Error('宿主未加载原生讨论服务');
                    openedSessionId = await withTeamLock(lock, async () => conversations.open(await parentOf(ctx, captain, await load()), await load(), key, root, { fresh: body['fresh'] === true, message: typeof body['message'] === 'string' ? body['message'] : undefined }));
                }
                else if (action === 'materials') {
                    await withTeamLock(lock, async () => {
                        const team = await load(), discussion = discussionOf(team, key);
                        const task = team.tasks.find(t => `check:${t.id}` === key && t.checkpoint);
                        if (!task || !checkpointReady(team, task))
                            throw new Error('检查点尚不能验收');
                        const material = workflowMaterials(team, task.id, workspace);
                        discussion.materials = material.text;
                        discussion.evidence = material.evidence;
                        discussion.materialsRound = task.checkpoint.round;
                        await writeTeam(root, team);
                    });
                }
                else if (action === 'stop_task' || (toggling && body['enabled'] === false)) {
                    const stopKey = `${root}:${teamId}:${String(body['taskId'])}`;
                    if (stopping.has(stopKey))
                        throw new Error('任务正在停止，请稍候');
                    stopping.add(stopKey);
                    try {
                        let child = '', stopId = '';
                        await withTeamLock(lock, async () => {
                            const team = await load(), task = team.tasks.find(t => t.id === body['taskId']);
                            checkToggle(team, task);
                            if (toggling && task?.checkpoint) {
                                if (task.status !== 'pending')
                                    throw new Error('该人工审核不能暂停');
                                task.workflowPaused = true;
                                task.updatedAt = Date.now();
                                await writeTeam(root, team);
                                return;
                            }
                            if (!task || task.checkpoint || ['completed', 'failed', 'cancelled'].includes(task.status))
                                throw new Error('该任务不能暂停编辑');
                            if (task.workflowPaused && !task.reassigning && !team.members.some(m => m.name === task.assignee && m.stopping))
                                return;
                            if (task.assignee === 'captain' && captain.status !== 'idle')
                                throw new Error('请先在宿主中停止队长当前执行，再暂停此任务以编辑');
                            const member = team.members.find(m => m.name === task.assignee);
                            task.workflowPaused = true;
                            stopId = randomUUID();
                            task.handoffId = stopId;
                            task.stoppedAttempts ??= [];
                            task.stoppedAttempts.push({ attemptId: task.attemptId, output: task.output, at: Date.now() });
                            task.attemptId = undefined;
                            if (member?.id && ['claimed', 'in_progress'].includes(task.status)) {
                                member.stopping = true;
                                child = member.id;
                            }
                            if (!child) {
                                task.status = 'pending';
                                task.attempt = 0;
                                task.reassigning = false;
                                task.updatedAt = Date.now();
                            }
                            await writeTeam(root, team);
                        });
                        // Keep a failed drain paused; a retry can finish the same stop boundary.
                        if (child) {
                            await drainMemberChildren(ctx.subagents, await parentOf(ctx, captain, await load()), [child]);
                            await withTeamLock(lock, async () => {
                                const team = await load(), task = team.tasks.find(t => t.id === body['taskId']);
                                if (!task || task.handoffId !== stopId || !task.workflowPaused)
                                    throw new Error('停止期间任务已变化，请刷新状态');
                                const member = team.members.find(m => m.name === task.assignee);
                                await recordRetiredMemberIds(root, [child]);
                                if (member) {
                                    member.previousSessionIds = [...new Set([...member.previousSessionIds ?? [], child])];
                                    member.stopping = false;
                                    member.status = 'idle';
                                    member.id = '';
                                    delete member.runtimeSetup;
                                }
                                task.status = 'pending';
                                task.attempt = 0;
                                task.reassigning = false;
                                task.updatedAt = Date.now();
                                await writeTeam(root, team);
                            });
                        }
                    }
                    finally {
                        stopping.delete(stopKey);
                    }
                }
                else if (action === 'start') {
                    await runtime.approveStagedTeam(captain, teamId);
                }
                else if (!['state', 'create'].includes(action)) {
                    const retired = [];
                    await withTeamLock(lock, async () => {
                        let team = await load();
                        const state = workflowState(team);
                        if (action === 'layout') {
                            const positions = body['positions'] ?? { [String(body['taskId'])]: { x: body['x'], y: body['y'] } };
                            if (!positions || typeof positions !== 'object' || Array.isArray(positions))
                                throw new Error('无效节点布局');
                            const validated = {};
                            for (const [id, point] of Object.entries(positions)) {
                                if (!team.tasks.some(t => t.id === id))
                                    throw new Error('任务不存在');
                                const { x, y } = (point ?? {});
                                if (typeof x !== 'number' || typeof y !== 'number' || !Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0 || x > 10000 || y > 10000)
                                    throw new Error('节点位置超出范围');
                                validated[`task:${id}`] = { x, y };
                            }
                            Object.assign(state.positions, validated);
                        }
                        else if (action === 'preview') {
                            discussionOf(team, key).proposal = proposeWorkflow(team, string(body['title'], '标题'), body['operations'], config.maxMembers);
                        }
                        else if (action === 'apply' || action === 'edit') {
                            if (action === 'edit' && body['base'] !== workflowFingerprint(team))
                                throw new Error('团队已变化，请刷新画布后重试');
                            let proposal = action === 'edit' ? proposeWorkflow(team, string(body['title'], '标题'), body['operations'], config.maxMembers) : discussionOf(team, key).proposal;
                            if (!proposal || (action === 'apply' && proposal.id !== body['proposalId']))
                                throw new Error('提案不存在或已替换');
                            if (action === 'apply' && body['operations'] !== undefined) {
                                // Keep the original base and identity: edited approval must never
                                // silently rebase onto concurrent execution or a newer AI proposal.
                                proposal = { ...proposal, suggestedOperations: proposal.suggestedOperations ?? proposal.operations, operations: parseWorkflowOperations(body['operations']) };
                            }
                            const updated = applyWorkflowProposal(team, proposal, config.maxMembers);
                            if (action === 'edit' && body['positions'] !== undefined) {
                                const positions = body['positions'];
                                if (!positions || typeof positions !== 'object' || Array.isArray(positions))
                                    throw new Error('无效节点布局');
                                const layout = workflowState(updated).positions;
                                for (const [id, point] of Object.entries(positions)) {
                                    if (!team.tasks.some(task => task.id === id))
                                        throw new Error('布局节点不存在');
                                    const { x, y } = (point ?? {});
                                    if (typeof x !== 'number' || typeof y !== 'number' || !Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0 || x > 10000 || y > 10000)
                                        throw new Error('节点位置超出范围');
                                    if (updated.tasks.some(task => task.id === id))
                                        layout[`task:${id}`] = { x, y };
                                }
                                let row = Math.min(9800, Math.max(0, ...Object.values(layout).map(point => point.y)) + 160);
                                for (const task of updated.tasks)
                                    if (!team.tasks.some(existing => existing.id === task.id)) {
                                        layout[`task:${task.id}`] = { x: 32, y: row };
                                        row = Math.min(10000, row + 160);
                                    }
                            }
                            if (action === 'edit' && team.phase !== 'staged') {
                                for (const task of updated.tasks)
                                    if (!task.checkpoint && !team.tasks.some(existing => existing.id === task.id))
                                        task.workflowPaused = true;
                            }
                            for (const op of proposal.operations) {
                                if (op.action === 'add_member' || (op.action === 'update_member' && (op.provider !== undefined || op.model !== undefined || op.reasoningEffort !== undefined))) {
                                    const member = updated.members.find(m => m.name === op.name);
                                    const route = await resolveMemberLlmSelection(ctx, captain, { provider: member.provider, model: member.model, reasoningEffort: member.reasoningEffort });
                                    member.provider = route.provider;
                                    member.model = route.model;
                                    member.reasoningEffort = route.reasoningEffort;
                                    // A deliberate route selection supersedes an earlier runtime fallback.
                                    delete member.activeProvider;
                                    delete member.activeModel;
                                    delete member.fallbackActive;
                                }
                                if (op.action === 'update_member' || op.action === 'remove_member') {
                                    const member = updated.members.find(m => m.name === op.name);
                                    if (member.id) {
                                        if (memberActivity(ctx, [member.id]).get(member.id) === 'running')
                                            throw new Error('成员仍在运行，请先暂停任务');
                                        retired.push(member.id);
                                        member.previousSessionIds = [...new Set([...member.previousSessionIds ?? [], member.id])];
                                        member.id = '';
                                        delete member.runtimeSetup;
                                    }
                                }
                            }
                            team = updated;
                        }
                        else if (action === 'dismiss') {
                            const proposal = discussionOf(team, key).proposal;
                            if (body['proposalId'] !== undefined && proposal?.id !== body['proposalId'])
                                throw new Error('提案已替换，请检查新提案');
                            if (proposal?.status === 'pending')
                                proposal.status = 'dismissed';
                        }
                        else if (action === 'new_discussion') {
                            if (address && key === currentDiscussion)
                                throw new Error('请返回队长会话后新建讨论；当前原生历史会保留');
                            const discussion = discussionOf(team, key);
                            // Retain full prior transcript for audit; archive under a unique key.
                            state.discussions[`archive:${randomUUID()}`] = structuredClone(discussion);
                            state.discussions[`discussion:${key}`] = { key, messages: [], calls: [] };
                        }
                        else if (action === 'review') {
                            const id = string(body['taskId'], 'taskId'), decision = body['decision'];
                            if (decision !== 'approve' && decision !== 'reject')
                                throw new Error('无效验收决定');
                            const discussion = discussionOf(team, `check:${id}`);
                            if (typeof body['evidence'] !== 'string' || body['evidence'] !== discussion.evidence)
                                throw new Error('请先打开并阅读当前验收材料');
                            decideCheckpoint(team, id, decision, body['evidence'], workflowMaterials(team, id, workspace).evidence, typeof body['note'] === 'string' ? body['note'].slice(0, 16000) : '');
                        }
                        else if (action === 'resume_task' || (toggling && body['enabled'] === true)) {
                            const task = team.tasks.find(t => t.id === body['taskId']);
                            checkToggle(team, task);
                            if (task?.workflowConfigPending)
                                throw new Error('请先填写任务／验收要求并完成节点配置');
                            if (toggling && task && !task.workflowPaused)
                                return;
                            if (!task || !task.workflowPaused || task.status !== 'pending' || team.members.some(m => m.name === task.assignee && m.stopping))
                                throw new Error('任务尚未停止完成');
                            if (task.workflowRerunRequired && body['base'] !== workflowFingerprint(team))
                                throw new Error('团队已变化，请刷新节点后重新确认');
                            if (task.workflowRerunRequired && task.dependencies.some(id => !team.tasks.some(upstream => upstream.id === id && upstream.status === 'completed')))
                                throw new Error('请先等待所有上游任务完成，再确认此节点重跑');
                            task.workflowPaused = false;
                            task.workflowRerunRequired = false;
                            task.updatedAt = Date.now();
                        }
                        else
                            throw new Error('未知操作');
                        if (retired.length)
                            await recordRetiredMemberIds(root, retired);
                        await writeTeam(root, team);
                    });
                    // Lifecycle observers also acquire the team lock. Retire the old idle
                    // sessions before commit, then drain outside that lock to avoid deadlock.
                    if (retired.length)
                        await drainMemberChildren(ctx.subagents, await parentOf(ctx, captain, await load()), retired);
                    if (['apply', 'edit', 'review', 'resume_task'].includes(action) || (toggling && body['enabled'] === true)) {
                        try {
                            await runtime.kickTeam(workspace, teamId, await parentOf(ctx, captain, await load()));
                        }
                        catch (error) {
                            ctx.logger.warn(`agent-teams: saved workflow change; scheduling retry required for ${teamId}: ${String(error)}`);
                        }
                    }
                }
                // A fresh discussion may archive the caller's old discussion after ownership was checked.
                const team = openedSessionId ? await readTeam(root, teamId) : await load();
                if (!team)
                    throw new Error('团队不存在');
                reply(200, { team, base: workflowFingerprint(team), ...(action === 'review' || toggling ? { activity: await assembleTeamSnapshot(ctx, root, '', team) } : {}), ready: team.tasks.filter(t => checkpointReady(team, t) && !t.checkpoint?.decision).map(t => t.id),
                    openedSessionId, currentDiscussion, busy: Object.values(team.workflow?.discussions ?? {}).filter(d => d.native?.sessionId && ctx.agents.get(d.native.sessionId)?.status === 'running').map(d => d.key) });
            }
            catch (error) {
                reply(error instanceof RequestBodyError ? error.status : 409, { error: error instanceof Error ? error.message : '操作失败' });
            }
        } }), 'agent-teams: workflow workbench');
}
async function parentOf(ctx, caller, team) {
    const parent = team.captainSessionId === caller.id ? caller : ctx.agents.get(team.captainSessionId);
    if (!parent)
        throw new Error('请打开原队长会话后继续');
    return parent;
}
