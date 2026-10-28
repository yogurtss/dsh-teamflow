import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { rerunImpact, rerunnableTasks } from "../task-rerun.js";
import css from './TaskRerunPicker.module.css';
export function TaskRerunImpact({ tasks, taskId }) {
    const impact = rerunImpact(tasks, taskId);
    return _jsxs("div", { className: css.impact, children: [_jsx("p", { children: "\u6240\u9009\u4EFB\u52A1\u5F00\u542F\u65B0\u4E00\u8F6E\u6267\u884C\uFF0C\u539F\u6709\u72B6\u6001\u548C\u63D0\u4EA4\u7ED3\u679C\u4FDD\u5B58\u5728\u5386\u53F2\u6267\u884C\u8BB0\u5F55\u4E2D\u3002\u65E7\u9A8C\u8BC1\u8BC1\u636E\u4E0D\u4F5C\u4E3A\u672C\u8F6E\u8BC1\u636E\uFF0C\u65E0\u5173\u5206\u652F\u4FDD\u6301\u4E0D\u53D8\u3002" }), !!impact.descendants.length && _jsxs("p", { children: ["\u4EE5\u4E0B\u4E0B\u6E38\u8282\u70B9\u4F1A\u91CD\u7F6E\u5E76\u6302\u8D77\uFF0C\u5F85\u4F60\u9010\u4E2A\u786E\u8BA4\u540E\u6267\u884C\u6216\u91CD\u65B0\u9A8C\u6536\uFF1A", impact.descendants.map(task => task.subject).join('、')] }), !!impact.active.length && _jsxs("p", { role: "alert", children: ["\u8BF7\u5148\u505C\u6B62\u53D7\u5F71\u54CD\u7684\u8FD0\u884C\u4EFB\u52A1\uFF1A", impact.active.map(task => task.subject).join('、')] })] });
}
export function TaskRerunPicker({ tasks, member, taskId, instructions, onTask, onInstructions, disabled }) {
    const candidates = rerunnableTasks(tasks, member);
    if (!candidates.length)
        return null;
    return _jsxs("fieldset", { className: css.picker, children: [_jsx("legend", { children: "\u5355\u72EC\u91CD\u8DD1" }), _jsxs("label", { className: css.field, children: ["\u91CD\u8DD1\u4EFB\u52A1", _jsx("select", { value: taskId, disabled: disabled, onChange: event => onTask(event.target.value), children: candidates.map(task => _jsxs("option", { value: task.id, children: [task.subject, "\uFF08", task.id, "\uFF09"] }, task.id)) })] }), _jsxs("label", { className: css.field, children: ["\u672C\u6B21\u8981\u6C42\uFF08\u53EF\u9009\uFF09", _jsx("textarea", { value: instructions, disabled: disabled, onChange: event => onInstructions(event.target.value), placeholder: "\u4F8B\u5982\uFF1A\u6309\u8C03\u6574\u540E\u7684\u804C\u8D23\u91CD\u65B0\u68C0\u67E5\uFF0C\u5E76\u8865\u5145\u8BC1\u636E\u3002" })] }), _jsx(TaskRerunImpact, { tasks: tasks, taskId: taskId })] });
}
