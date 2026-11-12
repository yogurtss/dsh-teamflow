import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useWorkflowText } from "./workflow-i18n.js";
import css from './LoopPanel.module.css';
function Evidence({ result }) {
    const { language } = useWorkflowText();
    return _jsxs("div", { children: [_jsx("pre", { children: result.output || '—' }), [...result.acceptanceResults, ...result.commandsRun].map((item, index) => _jsxs("p", { children: [_jsx("strong", { children: item.status === 'passed' ? (language === 'en' ? 'Passed' : '通过') : (language === 'en' ? 'Failed' : '失败') }), ' · ', 'command' in item ? _jsx("code", { children: item.command }) : item.criterion, 'exitCode' in item && item.exitCode != null && ' (' + item.exitCode + ')', item.evidence && _jsxs("span", { children: [" \u00B7 ", item.evidence] })] }, index))] });
}
export function RoundComparison({ round, tasks, previous, executionRounds }) {
    const { language } = useWorkflowText();
    const tr = (zh, en) => language === 'en' ? en : zh;
    const rows = tasks.map(task => {
        const prior = previous?.tasks.find(item => item.id === task.id);
        const executed = executionRounds?.[task.id];
        const reused = executed !== undefined && executed < round && ['completed', 'failed'].includes(task.status);
        const changed = !!prior && JSON.stringify(prior.acceptanceResults) !== JSON.stringify(task.acceptanceResults);
        const failed = [...task.commandsRun, ...task.acceptanceResults].some(item => item.status === 'failed') || task.status === 'failed';
        const rerun = round > 1 && executed === round;
        return { task, prior, executed, reused, changed, failed, rerun, priority: Number(failed) * 4 + Number(changed) * 2 + Number(rerun) };
    }).sort((a, b) => b.priority - a.priority);
    return _jsx(_Fragment, { children: rows.map(({ task, prior, executed, reused, changed, failed, rerun, priority }) => _jsxs("details", { open: priority > 0 || undefined, children: [_jsxs("summary", { children: [task.subject, " \u00B7 ", task.status, reused && ' · ' + tr('沿用第 ' + executed + ' 轮', 'Reused from round ' + executed), rerun && ' · ' + tr('本轮执行', 'Executed this round'), changed && ' · ' + tr('验收结果有变化', 'Acceptance changed'), failed && ' · ' + tr('有失败记录', 'Failure reported')] }), _jsxs("div", { className: css.comparison, children: [prior && previous && _jsxs("section", { children: [_jsxs("strong", { children: [tr('上轮', 'Previous round'), " ", previous.round, " \u00B7 ", prior.status] }), _jsx(Evidence, { result: prior })] }), _jsxs("section", { children: [_jsxs("strong", { children: [tr('本轮', 'Current round'), " ", round] }), _jsx(Evidence, { result: task })] })] })] }, task.id)) });
}
