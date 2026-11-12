import { MAX_WORKFLOW_TEXT_LENGTH } from "./workflow-types.js";
import { excerpt, reviewResult } from "./review-results.js";
import { deriveLoop, gateRouteTasks, parseLoopConfig, validateLoopGraph as validateLoopStructure } from "./workflow-loop-config.js";
export { parseLoopConfig } from "./workflow-loop-config.js";
/** Structured loops: backward edges are control flow, never task dependencies. */
import { createHash, randomUUID } from 'node:crypto';
import { resetTaskForRerun } from "./task-rerun.js";
import { canChangeGateReview } from "./workflow-loop-types.js";
const pending = new WeakMap();
export const loopRetryInstructions = '按原任务要求重试本轮，保留先前的执行记录。';
export const pendingLoopHistory = (team) => pending.get(team) ?? [];
export const clearPendingLoopHistory = (team) => { pending.delete(team); };
export const loopsOf = (team) => team.workflow?.loops ?? [];
export const loopForTask = (team, id) => loopsOf(team).find(loop => loop.gateId === id || loop.bodyIds.includes(id));
const active = (task) => ['claimed', 'in_progress'].includes(task.status) || !!task.reassigning;
const terminal = (task) => ['completed', 'failed', 'cancelled'].includes(task.status);
const hash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const loopTaskContract = (task) => hash([task.id, task.subject, task.description, task.dependencies, task.assignee, task.kind, task.objective, task.acceptance, task.verify, task.inScope, task.outOfScope]);
const inputVersion = (task) => hash([task.id, task.attemptId, task.status, task.updatedAt, task.supplementalEvidence?.length]);
function taskOf(team, id) {
    const task = team.tasks.find(item => item.id === id);
    if (!task)
        throw new Error(`循环节点不存在：${id}`);
    return task;
}
export function loopInputFingerprint(team, loop) {
    return hash([loop.runId, loop.round, [loop.gateId, ...loop.bodyIds].map(id => {
            const task = taskOf(team, id);
            return [task.id, task.description, task.id === loop.gateId ? undefined : task.status, task.id === loop.gateId ? undefined : task.attemptId,
                task.output, task.acceptanceResults, task.commandsRun, task.findings, task.supplementalEvidence];
        }), loop.externalInputs]);
}
function snapshot(team, loop, kind, summary, tasks, extra = {}, now = Date.now()) {
    const record = { id: randomUUID(), previous: loop.historyHead, loopId: loop.id, runId: loop.runId,
        round: loop.round, at: now, kind, summary, artifactEvidence: loop.reviewArtifactEvidence, tasks: structuredClone(tasks), inputFingerprint: loopInputFingerprint(team, loop),
        executionRounds: { ...loop.executionRounds }, members: team.members.filter(m => tasks.some(t => t.assignee === m.name)).map(({ id, name, provider, model, reasoningEffort, activeProvider, activeModel }) => ({ id, name, provider, model, reasoningEffort, activeProvider, activeModel })), ...extra };
    pending.set(team, [...pendingLoopHistory(team), record]);
    loop.historyHead = record.id;
    loop.historyCount++;
}
/** The ordinary DAG is validated independently, including external paths. */
export function validateLoopGraph(team) {
    validateLoopStructure(team);
    for (const loop of loopsOf(team))
        if (loop.contracts && [loop.gateId, ...loop.bodyIds].some(id => loop.contracts[id] !== loopTaskContract(taskOf(team, id))))
            throw new Error('循环启动后任务契约不可更改，请结束循环后建立新流程');
}
export function configureLoop(team, config) {
    if (team.halted)
        throw new Error('请先恢复团队');
    if (loopForTask(team, config.gateId))
        throw new Error('门控已经属于一个循环');
    const gate = taskOf(team, config.gateId);
    if (gate.checkpoint?.kind === 'acceptance')
        throw new Error('验收节点通过新建路径返工；请添加门控节点配置返回环路');
    const loop = deriveLoop(team, parseLoopConfig(config), randomUUID(), randomUUID());
    const body = loop.bodyIds;
    for (const id of [...body, gate.id]) {
        const task = taskOf(team, id);
        if (task.status !== 'pending' || (task.attempt ?? 0) > 0 || task.checkpoint?.decision)
            throw new Error('请在首次执行前配置循环');
    }
    const assignee = loop.mode === 'ai' ? loop.reviewer : undefined;
    const candidate = { ...team, tasks: team.tasks.map(task => task.id === gate.id ? { ...task, assignee } : task), workflow: { ...team.workflow ?? { positions: {}, discussions: {}, history: [] }, loops: [...loopsOf(team), loop] } };
    validateLoopGraph(candidate);
    team.workflow = candidate.workflow;
    gate.assignee = assignee;
    gate.checkpoint.kind = 'gate';
    gate.checkpoint.mode = loop.mode;
    if (gate.description?.trim() && !gate.adaptationIssue?.trim())
        gate.workflowConfigPending = false;
    for (const id of [...body, gate.id]) {
        const task = taskOf(team, id);
        task.workflowPaused = true;
        task.workflowAwaitingStart = true;
    }
    return loop;
}
function assignGateReviewer(gate, loop) {
    gate.assignee = loop.mode === 'ai' ? loop.reviewer : undefined;
    gate.checkpoint.mode = loop.mode;
    if (loop.contracts)
        loop.contracts[gate.id] = loopTaskContract(gate);
}
export function updateGateReview(team, gateId, mode, reviewer) {
    const draft = structuredClone(team);
    const loop = loopsOf(draft).find(item => item.gateId === gateId);
    const gate = taskOf(draft, gateId);
    if (draft.halted || !loop || !canChangeGateReview(loop, gate))
        throw new Error('当前门控不能修改审核方式');
    if (mode === 'ai' && !draft.members.some(member => member.name === reviewer && member.status !== 'removed'))
        throw new Error('请选择有效的 AI 审核成员');
    validateLoopGraph(draft);
    loop.mode = mode;
    loop.reviewer = mode === 'ai' ? reviewer : undefined;
    assignGateReviewer(gate, loop);
    validateLoopGraph(draft);
    team.tasks = draft.tasks;
    team.workflow = draft.workflow;
}
/** Validate edits to both branches before applying either one. */
export function saveGateSettings(team, config, passTargets, loopId) {
    const draft = structuredClone(team);
    const previous = loopsOf(draft).find(loop => loop.gateId === config.gateId);
    if (previous?.id !== loopId)
        throw new Error('门控配置已变化，请刷新');
    if (draft.halted || previous && (previous.queued || !['ready', 'paused'].includes(previous.status)))
        throw new Error('请在启动前或暂停后配置门控');
    const started = !!previous && (!!previous.contracts || !!previous.historyCount);
    draft.tasks = gateRouteTasks(draft, config.gateId, passTargets, started);
    if (previous && started) {
        if (config.entryId !== previous.entryId || config.maxRounds < previous.round)
            throw new Error('已执行的循环须保留入口，轮次上限不能低于当前轮');
        validateLoopGraph(draft);
        const gate = taskOf(draft, config.gateId);
        Object.assign(previous, config, { rejectToEntry: config.rejectToEntry, reviewer: config.mode === 'ai' ? config.reviewer : undefined });
        assignGateReviewer(gate, previous);
    }
    else {
        if (previous)
            draft.workflow.loops = loopsOf(draft).filter(loop => loop !== previous);
        const updated = configureLoop(draft, config);
        if (previous) {
            updated.id = previous.id;
            updated.runId = previous.runId;
        }
    }
    validateLoopGraph(draft);
    team.tasks = draft.tasks;
    team.workflow = draft.workflow;
}
export function loopCanExecute(team, task) {
    const loop = loopForTask(team, task.id);
    if (!loop)
        return !task.checkpoint;
    if (team.halted || team.phase === 'staged')
        return false;
    if (task.id === loop.gateId)
        return loop.mode === 'ai' && loop.status === 'reviewing';
    return loop.status === 'running';
}
export function loopDependenciesSatisfied(team, task) {
    const loop = loopForTask(team, task.id);
    if (loop?.gateId === task.id)
        return loop.status === 'reviewing';
    return task.dependencies.every(id => team.tasks.some(t => t.id === id && t.status === 'completed'));
}
function captureExecutions(team, loop, now) {
    for (const id of loop.bodyIds) {
        const task = taskOf(team, id);
        if (!terminal(task))
            continue;
        const signature = inputVersion(task);
        if (loop.captured[id] === signature)
            continue;
        loop.executionRounds ??= {};
        loop.executionRounds[id] = loop.round;
        snapshot(team, loop, 'execution', `${task.subject} · ${task.status}`, [task], {}, now);
        // The immutable execution retains feedback and the prior result. Polling only
        // needs the new result once execution has finished.
        delete task.workflowRerunContext;
        loop.captured[id] = signature;
    }
}
function pause(team, loop, reason, now) {
    if (loop.status === 'paused' && loop.reason === reason)
        return;
    snapshot(team, loop, 'control', reason, [loop.gateId, ...loop.bodyIds].map(id => taskOf(team, id)), {}, now);
    loop.status = 'paused';
    loop.reason = reason;
    delete loop.failedExecutionTaskId;
    for (const id of [loop.gateId, ...loop.bodyIds]) {
        const task = taskOf(team, id);
        if (!terminal(task))
            task.workflowPaused = true;
    }
}
/** Called before every durable write and from the scheduler watchdog. Never creates tasks. */
export function reconcileLoops(team, now = Date.now(), failedTurnId) {
    let changed = false;
    for (const loop of loopsOf(team)) {
        if (loop.status === 'ready' && loop.queued && !team.halted && team.phase !== 'staged') {
            const ids = [loop.gateId, ...loop.bodyIds];
            if (ids.flatMap(id => taskOf(team, id).dependencies).filter(id => !ids.includes(id)).every(id => taskOf(team, id).status === 'completed')) {
                startLoop(team, loop.id, 0, now, new Set(loop.bodyIds.filter(id => !taskOf(team, id).workflowLoopTaskHold)));
                changed = true;
            }
        }
        if (!['running', 'reviewing'].includes(loop.status))
            continue;
        const before = JSON.stringify(loop);
        captureExecutions(team, loop, now);
        const body = loop.bodyIds.map(id => taskOf(team, id)), gate = taskOf(team, loop.gateId);
        // failMemberOpenAttempt persists the adapter's final turn error with a
        // "(code ...)" suffix. Recognize it on reload as well as on the first write.
        const failedExecution = gate.status === 'failed' ? gate : body.find(task => task.status === 'failed'
            && (task.id === failedTurnId || /\(code [\w.-]+\)\s*$/u.test(task.output ?? '')
                || /^(?:HTTP(?:\/\d(?:\.\d)?)?\s+5\d\d\b|500\s+Internal Server Error\b)/iu.test(task.output ?? '')));
        const external = [...new Set(body.flatMap(t => t.dependencies).concat(gate.dependencies).filter(id => !loop.bodyIds.includes(id) && id !== gate.id))];
        if (external.some(id => loop.externalInputs[id] !== inputVersion(taskOf(team, id))))
            pause(team, loop, '外部输入已变化，请检查后重新启动循环', now);
        else if (failedExecution) {
            pause(team, loop, `节点 ${failedExecution.id} 执行中断，请继续循环以重试本轮`, now);
            loop.failedExecutionTaskId = failedExecution.id;
        }
        else if (team.halted || body.some(t => t.workflowPaused && !t.workflowLoopTaskHold) || gate.workflowPaused)
            pause(team, loop, '循环已暂停；请使用循环控制继续', now);
        else if (body.some(t => t.status === 'cancelled'))
            pause(team, loop, '循环任务已取消，请检查后继续', now);
        else if (loop.startedAt && now - (loop.status === 'reviewing' ? loop.reviewStartedAt ?? loop.startedAt : loop.startedAt) > loop.timeoutMinutes * 60_000 && !(loop.status === 'reviewing' && loop.mode === 'human'))
            pause(team, loop, '本轮执行超时，已暂停自动推进', now);
        else if (loop.status === 'running' && !body.some(active)) {
            // Failed business work blocks its descendants but must not deadlock the gate.
            const blocked = new Set(body.filter(t => t.status === 'failed').map(t => t.id));
            let progress = true;
            while (progress) {
                progress = false;
                for (const t of body)
                    if (!blocked.has(t.id) && t.status === 'pending' && t.dependencies.some(id => blocked.has(id))) {
                        blocked.add(t.id);
                        progress = true;
                    }
            }
            if (body.every(t => t.status === 'completed' || blocked.has(t.id))) {
                loop.status = 'reviewing';
                loop.reviewStartedAt = now;
                gate.workflowPaused = false;
                gate.workflowAwaitingStart = false;
            }
        }
        changed ||= before !== JSON.stringify(loop);
    }
    return changed;
}
export class LoopStartUnavailable extends Error {
}
export function startLoop(team, id, additionalRounds = 0, now = Date.now(), enabledBodyIds) {
    const loop = loopsOf(team).find(l => l.id === id);
    if (!loop || !['ready', 'paused'].includes(loop.status) || team.halted || team.phase === 'staged')
        throw new LoopStartUnavailable('循环当前不能启动');
    if (enabledBodyIds && loop.lastDecision === 'revise')
        throw new LoopStartUnavailable('请先确认本轮返工范围');
    validateLoopGraph(team);
    if (!Number.isSafeInteger(additionalRounds) || additionalRounds < 0 || additionalRounds > 20 || loop.maxRounds + additionalRounds > 20)
        throw new LoopStartUnavailable('追加轮数必须有限，累计最多 20 轮');
    const tasks = [loop.gateId, ...loop.bodyIds].map(id => taskOf(team, id));
    if (tasks.some(t => t.assignee && !team.members.some(m => m.name === t.assignee && m.status !== 'removed')))
        throw new LoopStartUnavailable('请先恢复有效的循环执行与审核成员');
    if (tasks.some(t => active(t)))
        throw new LoopStartUnavailable('请先停止仍在运行的循环任务，再继续');
    if (tasks.some(t => t.workflowConfigPending || !t.description?.trim()))
        throw new LoopStartUnavailable('请先完成所有循环节点的任务要求');
    if (loop.lastDecision === 'revise' && loop.round >= loop.maxRounds && !additionalRounds)
        throw new LoopStartUnavailable('已达轮次上限，请明确追加轮数后继续');
    const external = [...new Set(tasks.flatMap(t => t.dependencies).filter(id => !tasks.some(t => t.id === id)))];
    if (external.some(id => taskOf(team, id).status !== 'completed')) {
        if (loop.startedAt !== undefined || loop.contracts)
            throw new LoopStartUnavailable('请先完成循环的外部输入');
        for (const task of tasks) {
            if (task.id === loop.gateId)
                continue;
            task.workflowPaused = !!enabledBodyIds && !enabledBodyIds.has(task.id);
            if (task.workflowPaused)
                task.workflowLoopTaskHold = true;
            else
                delete task.workflowLoopTaskHold;
            task.workflowAwaitingStart = false;
            task.updatedAt = now;
        }
        loop.status = 'ready';
        loop.queued = true;
        loop.reason = '已排队，等待外部输入完成';
        return;
    }
    const inputs = Object.fromEntries(external.map(id => [id, inputVersion(taskOf(team, id))]));
    if (loop.startedAt && hash(inputs) !== hash(loop.externalInputs))
        throw new LoopStartUnavailable('外部输入已变化；请重新建立流程以避免混用结果');
    loop.maxRounds += additionalRounds;
    loop.contracts ??= Object.fromEntries(tasks.map(task => [task.id, loopTaskContract(task)]));
    snapshot(team, loop, 'control', additionalRounds ? `人工追加 ${additionalRounds} 轮并继续` : '启动或恢复循环', tasks, { actor: 'human' }, now);
    if (loop.lastDecision === 'revise')
        nextRound(team, loop, loop.requestedTaskIds ?? loop.bodyIds, loop.feedback ?? '', now);
    else {
        // A failed delivery or stopped execution can retry in the same business round.
        for (const task of tasks)
            if (task.status !== 'completed') {
                if (task.status !== 'pending' || task.attemptId) {
                    const context = task.workflowRerunContext ?? { instructions: loop.feedback?.trim() || loopRetryInstructions, previousOutput: task.output, previousAttemptId: task.attemptId, previousStatus: task.status === 'failed' || task.status === 'cancelled' ? task.status : 'pending', requestedAt: now };
                    resetTaskForRerun(task, false, now);
                    delete task.stoppedAttempts;
                    if (task.id !== loop.gateId)
                        task.workflowRerunContext = context;
                    else if (task.checkpoint)
                        task.checkpoint.round = loop.round;
                }
                task.workflowPaused = !!enabledBodyIds && task.id !== loop.gateId && !enabledBodyIds.has(task.id);
                if (task.workflowPaused)
                    task.workflowLoopTaskHold = true;
                else
                    delete task.workflowLoopTaskHold;
                task.workflowRerunRequired = false;
                task.workflowAwaitingStart = false;
                task.updatedAt = now;
            }
        loop.status = 'running';
        loop.startedAt = now;
        delete loop.reviewStartedAt;
    }
    loop.externalInputs = inputs;
    delete loop.reason;
    delete loop.queued;
    delete loop.failedExecutionTaskId;
}
function nextRound(team, loop, requested, feedback, now) {
    loop.previousOutputs = Object.fromEntries(loop.bodyIds.map(id => [id, excerpt(taskOf(team, id).output, 1000) ?? '']));
    const affected = new Set(requested);
    let changed = true;
    while (changed) {
        changed = false;
        for (const id of loop.bodyIds)
            if (!affected.has(id) && taskOf(team, id).dependencies.some(dep => affected.has(dep))) {
                affected.add(id);
                changed = true;
            }
    }
    for (const id of [...affected, loop.gateId]) {
        const task = taskOf(team, id), previousOutput = task.output, previousAttemptId = task.attemptId, previousStatus = task.status;
        resetTaskForRerun(task, false, now);
        // History is persisted independently; do not grow the hot team record.
        delete task.stoppedAttempts;
        if (id !== loop.gateId)
            task.workflowRerunContext = { instructions: feedback, previousOutput, previousAttemptId,
                previousStatus: ['completed', 'failed', 'cancelled'].includes(previousStatus) ? previousStatus : 'pending', requestedAt: now };
        delete loop.captured[id];
    }
    loop.round++;
    loop.status = 'running';
    loop.startedAt = now;
    delete loop.reviewStartedAt;
    delete loop.reason;
    delete loop.reviewArtifactEvidence;
    loop.lastDecision = undefined;
}
export function decideLoop(team, id, input, actor, now = Date.now()) {
    const loop = loopsOf(team).find(l => l.id === id);
    if (!loop)
        throw new Error('循环不存在');
    if (loop.lastDecisionId === input.decisionId)
        return;
    reconcileLoops(team, now);
    if (loop.status !== 'reviewing' || team.halted || team.phase === 'staged' || input.runId !== loop.runId || input.round !== loop.round || input.fingerprint !== loopInputFingerprint(team, loop))
        throw new Error('评审轮次或材料已变化，请刷新后重试');
    if (!input.decisionId || !['pass', 'revise', 'blocked'].includes(input.decision) || !input.note.trim() || input.note.length > MAX_WORKFLOW_TEXT_LENGTH)
        throw new Error('请提交有效决定和具体审核意见');
    const gate = taskOf(team, loop.gateId), tasks = loop.bodyIds.map(t => taskOf(team, t));
    if (tasks.some(active))
        throw new Error('仍有任务执行，不能切换轮次');
    if (input.decision === 'pass' && tasks.some(t => t.status !== 'completed' || t.commandsRun?.some(c => c.status === 'failed') || t.acceptanceResults?.some(c => c.status === 'failed')))
        throw new Error('必需任务或验证未通过，不能放行');
    const targets = input.decision === 'revise' && loop.rejectToEntry ? [loop.entryId] : input.taskIds;
    if (input.decision === 'revise' && (!targets.length || targets.some(t => !loop.bodyIds.includes(t))))
        throw new Error('请选择循环内的返工任务');
    captureExecutions(team, loop, now);
    snapshot(team, loop, 'decision', input.note.trim(), [...tasks, gate], { actor, decision: input.decision }, now);
    loop.lastDecisionId = input.decisionId;
    loop.lastDecision = input.decision;
    loop.feedback = input.note.trim();
    loop.requestedTaskIds = [...new Set(targets)];
    gate.output = input.note.trim();
    gate.updatedAt = now;
    if (input.decision === 'pass') {
        loop.status = 'passed';
        gate.status = 'completed';
        gate.checkpoint = { kind: 'gate', round: loop.round, decision: 'approve', note: input.note, history: [] };
    }
    else if (input.decision === 'revise' && loop.round < loop.maxRounds)
        nextRound(team, loop, targets, input.note.trim(), now);
    else {
        // Revoke the review attempt without making its output satisfy dependencies.
        gate.status = 'pending';
        delete gate.attemptId;
        pause(team, loop, input.decision === 'revise' ? '已达轮次上限，等待人工追加轮数或结束' : '审核无法继续，等待人工处理', now);
    }
}
export function pauseLoop(team, id, cancel = false, reason) {
    const loop = loopsOf(team).find(l => l.id === id);
    if (!loop || loop.status === 'passed' || loop.status === 'cancelled')
        throw new Error('循环已结束');
    pause(team, loop, reason ?? (cancel ? '用户结束循环' : '用户暂停循环'), Date.now());
    delete loop.queued;
    if (cancel)
        loop.status = 'cancelled';
}
export function loopPrompt(team, task) {
    const loop = loopForTask(team, task.id);
    if (!loop || loop.gateId !== task.id)
        return undefined;
    return `You are the designated loop reviewer. Assess each gate criterion against the reported results. Compare metrics or functional changes when requested. Request specific missing evidence when needed. Gate requirements: ${excerpt(task.description, 4000)} ${JSON.stringify(task.acceptance ?? []).slice(0, 2000)}. Do not implement changes or create repair/review nodes. Submit agent_teams_decide_loop with loop_id=${loop.id}, run_id=${loop.runId}, round=${loop.round}, fingerprint=${loopInputFingerprint(team, loop)}, your attempt_id, a unique decision_id, decision=pass|revise|blocked, a specific note with findings, required fixes and revalidation criteria, and task_ids (existing body task IDs to revise). Do NOT complete this gate via update_task. Pass only if every required task and check passed. Use revise for actionable changes; blocked for missing evidence or out-of-scope changes. Round ${loop.round}/${loop.maxRounds}. Previous feedback: ${JSON.stringify(loop.feedback ?? '')}\nCurrent result summaries (bounded; compare delivered functionality, baseline and current metrics, and changes since the previous round; use agent_teams_status for complete reports, and choose blocked when evidence is insufficient):\n${JSON.stringify(loop.bodyIds.map(id => { const t = taskOf(team, id); return { id, subject: t.subject, status: t.status, requirements: JSON.stringify({ description: t.description, objective: t.objective, acceptance: t.acceptance, verify: t.verify, inScope: t.inScope, outOfScope: t.outOfScope }).slice(0, 2000), summary: excerpt(JSON.stringify(reviewResult(t, task)), Math.max(1000, Math.floor(32000 / loop.bodyIds.length))), previousOutput: excerpt(loop.previousOutputs?.[id], 1000), summaryMayBeTruncated: true }; }))}`;
}
export function isWorkflowLoops(value) {
    if (!Array.isArray(value) || value.length > 100)
        return false;
    return value.every(raw => {
        try {
            const l = raw;
            parseLoopConfig(l);
            const map = (v) => !!v && typeof v === 'object' && !Array.isArray(v) && Object.values(v).every(x => typeof x === 'string');
            const optionalText = (v) => v === undefined || typeof v === 'string';
            return typeof l.id === 'string' && typeof l.runId === 'string' && Array.isArray(l.bodyIds) && l.bodyIds.every(id => typeof id === 'string')
                && Number.isSafeInteger(l.round) && l.round >= 1 && l.round <= l.maxRounds && l.maxRounds <= 20
                && ['ready', 'running', 'reviewing', 'paused', 'passed', 'cancelled'].includes(l.status)
                && Number.isSafeInteger(l.historyCount) && l.historyCount >= 0 && map(l.captured) && map(l.externalInputs)
                && (l.previousOutputs === undefined || map(l.previousOutputs)) && (l.contracts === undefined || map(l.contracts)) && [l.failedExecutionTaskId, l.reason, l.feedback, l.reviewer, l.lastDecisionId, l.reviewArtifactEvidence].every(optionalText)
                && (l.executionRounds === undefined || typeof l.executionRounds === 'object' && l.executionRounds !== null && !Array.isArray(l.executionRounds) && Object.values(l.executionRounds).every(round => Number.isSafeInteger(round) && round > 0 && round <= l.round))
                && [undefined, 'pass', 'revise', 'blocked'].includes(l.lastDecision)
                && (l.queued === undefined || typeof l.queued === 'boolean')
                && (l.requestedTaskIds === undefined || Array.isArray(l.requestedTaskIds) && l.requestedTaskIds.every(id => typeof id === 'string'))
                && [l.startedAt, l.reviewStartedAt].every(at => at === undefined || typeof at === 'number' && Number.isFinite(at))
                && (l.historyHead === undefined || /^[a-f0-9-]{36}$/u.test(l.historyHead));
        }
        catch {
            return false;
        }
    });
}
