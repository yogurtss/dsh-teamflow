import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useId, useLayoutEffect, useRef, useState } from 'react';
import { useWorkflowText } from "./workflow-i18n.js";
import css from './WorkflowWorkbench.module.css';
const steps = [
    ['gallery', '流程模板库', '预览已有流程，挑选一个模板，再调整成员和任务。', 'Template gallery', 'Preview a workflow template, then adapt its members and tasks.'],
    ['flow', '当前流程', '在这里从零创建团队，或返回正在编排的流程。', 'Current workflow', 'Start a team from scratch or return to your current workflow.'],
    ['roster', '左侧对象列表', '切换任务和 Agent 标签。选择任务可在画布定位节点，选择成员可查看职责和分工。窄屏时先点「对象列表」。', 'Object list', 'Switch between Tasks and Agents. Select a task to locate its node or a member to inspect their role. On narrow screens, open Object list first.'],
    ['agent', 'Agent 成员', '先添加成员，填写职责。创建任务时就可以选择负责人。', 'Team members', 'Add members and describe their roles. You can then assign them tasks.'],
    ['task', '任务节点', '把工作写成任务，指定负责人，并说明需要交付什么。', 'Task node', 'Describe the work, assign its owner and specify the expected deliverable.'],
    ['edit', '编辑与连线', '进入编辑模式，从上游节点的输出端拖到下游输入端，即可设置执行顺序。', 'Edit and connect', 'In edit mode, drag from an upstream output to a downstream input to set execution order.'],
    ['gate', '循环门控', '需要反复改进时使用。设置 PASS 的下游、REJECT 的入口、审核方式和最多几轮。', 'Loop gate', 'For iterative work, configure the pass and return routes, reviewer and round limit.'],
    ['check', '验收节点', '连接输入和输出，然后在卡片或右侧面板选择人工或 AI 验收。返工路径保留原来的交付记录。', 'Acceptance node', 'Connect an input and output, then choose human or AI review on the card or in the inspector. Rework preserves the original delivery.'],
    ['inspector', '右侧面板', '点卡片上的成员头像或姓名查看 Agent，点中间的任务查看要求。按住卡片上任一区域拖动可调整位置。选中循环门控可配置通过和退回路径、选择人工或 AI 审核。窄屏时打开「修改与验收」。', 'Inspector', 'Click the member portrait or name to inspect the agent, or the task title to inspect the task. Drag either area to move the card. For a loop gate, choose the pass and return routes and human or AI review. On narrow screens, open Edit and review.'],
    ['run', '运行流程', '配置完成后，从这里启动流程。运行时可以查看节点状态。', 'Run the workflow', 'Start the configured workflow here and follow progress on the canvas.'],
    ['archive', '成果归档', '把归档节点接在交付任务之后，汇总上游成果。', 'Archive outputs', 'Connect an archive node after a delivery task to collect upstream outputs.'],
    ['outcomes', '交付内容', '打开这里查看交付结果，再定位到对应的任务。', 'Deliverables', 'Inspect delivered results here and locate their tasks.'],
];
export function WorkbenchGuide() {
    const en = useWorkflowText().language === 'en';
    const trigger = useRef(null), popup = useRef(null);
    const [route, setRoute] = useState([]), [index, setIndex] = useState(0);
    const heading = useId(), description = useId();
    const step = steps[route[index] ?? -1];
    function target(id) {
        const anchors = trigger.current?.closest('[role="dialog"]')?.querySelectorAll(`[data-guide="${id}"]`);
        return Array.from(anchors ?? []).find(anchor => anchor.getClientRects().length);
    }
    function start() {
        setIndex(0);
        setRoute(steps.flatMap(([id], i) => target(id)?.getClientRects().length ? [i] : []));
    }
    function finish() {
        popup.current?.close();
        setRoute([]);
        trigger.current?.focus({ preventScroll: true });
    }
    useLayoutEffect(() => {
        if (!step || !popup.current)
            return;
        const dialog = popup.current, anchor = target(step[0]);
        const advance = () => index + 1 < route.length ? setIndex(index + 1) : finish();
        if (!anchor?.getClientRects().length) {
            advance();
            return;
        }
        anchor.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        anchor.dataset.guideActive = 'true';
        if (!dialog.open)
            dialog.showModal();
        function position() {
            if (!anchor?.isConnected || !anchor.getClientRects().length) {
                advance();
                return;
            }
            const bounds = anchor.getBoundingClientRect(), gap = 10;
            const left = Math.min(innerWidth - dialog.offsetWidth - gap, bounds.left);
            const below = bounds.bottom + gap;
            const top = below + dialog.offsetHeight <= innerHeight - gap ? below : bounds.top - dialog.offsetHeight - gap;
            dialog.style.left = Math.max(gap, left) + 'px';
            dialog.style.top = Math.max(gap, Math.min(innerHeight - dialog.offsetHeight - gap, top)) + 'px';
        }
        position();
        dialog.querySelector('button:last-child')?.focus({ preventScroll: true });
        const observer = new ResizeObserver(position);
        observer.observe(anchor);
        observer.observe(dialog);
        window.addEventListener('resize', position);
        window.addEventListener('scroll', position, true);
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', position);
            window.removeEventListener('scroll', position, true);
            delete anchor.dataset.guideActive;
        };
    }, [step, index, route.length]);
    return _jsxs(_Fragment, { children: [_jsx("button", { ref: trigger, type: "button", "aria-haspopup": "dialog", onClick: start, children: en ? 'User guide' : '使用指南' }), step && _jsxs("dialog", { ref: popup, className: css.guidePopup, "aria-labelledby": heading, "aria-describedby": description, onKeyDown: event => event.stopPropagation(), onCancel: event => { event.preventDefault(); finish(); }, children: [_jsxs("small", { children: [index + 1, " / ", route.length] }), _jsxs("div", { "aria-live": "polite", "aria-atomic": "true", children: [_jsx("strong", { id: heading, children: en ? step[3] : step[1] }), _jsx("p", { id: description, children: en ? step[4] : step[2] })] }), _jsxs("footer", { children: [_jsx("button", { type: "button", onClick: finish, children: en ? 'Exit guide' : '退出指南' }), _jsx("button", { type: "button", className: css.primary, onClick: () => index + 1 < route.length ? setIndex(index + 1) : finish(), children: "Got it" })] })] })] });
}
