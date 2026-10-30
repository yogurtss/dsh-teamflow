import { awaitsFirstStart } from "../task-start-state.js";
import { taskControlState } from "./task-control.js";
import { zh } from "./locales.js";
/** Explain saved execution state without claiming to know live host availability. */
export function taskReadiness(team, task) {
    const result = (label, detail = label, dependencies = []) => ({ label, detail, dependencies });
    const control = taskControlState(team, { ...task, workflowAwaitingStart: awaitsFirstStart(task) });
    if (task.checkpoint?.decision === 'reject')
        return result('已退回', task.checkpoint.note || '等待调整方案并返工。');
    if (task.status === 'completed')
        return result(task.checkpoint ? '验收通过' : '已完成');
    if (task.status === 'failed')
        return result('执行失败', '查看执行记录中的失败原因，再决定是否修改并重跑。');
    if (task.status === 'cancelled')
        return result('已取消');
    if (task.layers && task.specificContractVersion !== 1 && task.status === 'pending')
        return result('待确认完整要求', '旧版本次层可能只有补充说明。请使用 AI 重新整理完整本次要求，或核对后保存确认。');
    if (task.workflowConfigPending)
        return result('待配置', '节点已保存，可先连线；请填写要求并完成配置。');
    if (team.halted)
        return result('团队已停止', '团队停止期间不会派发此任务。');
    if (control.stopping)
        return result(zh[control.label], '已禁止再次调度，正在等待执行会话停止；失败时可重试停止。');
    if (task.status === 'in_progress' || task.status === 'claimed')
        return result(zh[control.label], task.status === 'claimed' ? zh['task.control.claimedHint'] : '执行 Agent 正在处理任务。');
    const blocked = task.dependencies.filter(id => !team.tasks.some(t => t.id === id && t.status === 'completed'));
    const upstream = blocked.map(id => {
        const item = team.tasks.find(t => t.id === id);
        return item ? `${item.subject}（${item.status === 'failed' ? '失败' : item.status === 'cancelled' ? '已取消' : item.workflowConfigPending ? '待配置' : item.checkpoint ? '未通过验收' : '未完成'}）` : `${id}（不存在）`;
    }).join('、');
    if (task.workflowRerunRequired)
        return result(zh[control.label], blocked.length ? `上游正在更新，本节点暂不执行。还需等待：${upstream}。全部完成后，可使用新结果${task.checkpoint ? '重新验收' : '执行'}。` : task.checkpoint ? '上游新结果已就绪，旧验收不能沿用。点击「使用新结果重新验收」，查看材料后重新作出决定。' : '上游新结果已就绪。点击「使用新结果执行」；已有的下游结果不能作为本轮结果。', blocked);
    if (awaitsFirstStart(task))
        return result('待启动', `节点已配置，点击开始后进入调度。${blocked.length ? `仍需等待：${upstream}` : ''}`, blocked);
    if (task.workflowPaused)
        return result(zh[control.label], `点击开始后重新进入调度，已停止的执行将重新开始。${blocked.length ? `仍需等待：${upstream}` : ''}`, blocked);
    if (team.phase === 'staged')
        return result(zh[control.label], '团队方案尚未确认启动。');
    if (blocked.length)
        return result(zh[control.label], `等待：${upstream}`, blocked);
    if (task.checkpoint)
        return result(zh[control.label], '上游已完成，打开材料并作出验收决定。');
    if (task.assignee === 'captain')
        return result('等待队长', '依赖已满足，等待队长领取。');
    const candidates = team.members.filter(m => m.status !== 'removed' && (!task.assignee || m.name === task.assignee));
    if (!candidates.length)
        return result('缺少执行 Agent', task.assignee ? `执行成员 ${task.assignee} 不可用，请调整负责人。` : '请创建或恢复至少一个执行 Agent。');
    const available = candidates.filter(m => !m.stopping && !team.tasks.some(t => t.assignee === m.name && ['claimed', 'in_progress'].includes(t.status)));
    if (!available.length)
        return result('等待 Agent 空闲', task.assignee ? `${task.assignee} 正在执行其他任务或停止中。` : '可用成员均在执行其他任务或停止中。');
    if (available.every(m => !!m.spawnError))
        return result('Agent 启动失败', available.map(m => `${m.name}：${m.spawnError}`).join('；'));
    return result('等待调度', '依赖已满足，等待调度器派发；实际成员会话状态由宿主确认。');
}
