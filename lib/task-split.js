import { parseLayers } from "./task-layers.js";
export function taskSplitBlock(task) {
    if (task.checkpoint)
        return '人工验收节点请在流程讨论中调整要求';
    if (task.status !== 'pending' || ((task.attempt ?? 0) !== 0 && !task.workflowPaused) || task.reassigning)
        return '请先停止运行中的任务；已结束任务的执行要求保留，不能直接改写';
    if (!(task.layers ? [task.layers.general, task.layers.specific].some(brief => [brief.requirements, brief.deliverables, brief.acceptance].some(text => text.trim())) : task.description?.trim()))
        return '请先填写并保存任务说明';
    return undefined;
}
export const TASK_SPLIT_REQUEST = '请将当前任务已有描述整理为通用层和本次层。保留所有原始要求，不增加范围，不臆造缺失信息。通用层写可复用的方法、交付约定和质量要求；本次层必须完整保留原有执行要求，并把通用层的方法、交付约定和质量约束具体化，连同具体目标、路径、参数和验收条件形成独立任务书。执行 Agent 只读本次层，不读通用层，不要只写差异或引用通用层。若已有 layers，结合两层重新整理。只提交一个 update_task，字段只能是 action、id 和 layers；layers.general 与 layers.specific 各含 requirements、deliverables、acceptance 三个字符串，两层 requirements 均不能为空。不要新增节点，不要重跑，不要把分层文字追加到 description。先读取上下文，再调用 agent_teams_workflow_propose，等待用户确认后覆盖原字段。';
export function validateTaskSplit(taskId, operations) {
    const op = operations[0];
    if (operations.length !== 1 || !op || op.action !== 'update_task' || op.id !== taskId || !op.layers || Object.keys(op).some(key => !['action', 'id', 'layers'].includes(key)))
        throw new Error('AI 拆分只能更新当前任务的 layers，不得新增任务、重跑或修改其他字段');
    const layers = parseLayers(op.layers);
    if (!layers.general.requirements || !layers.specific.requirements)
        throw new Error('请同时填写通用层和本次层的任务要求');
}
