import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { workflowRequest } from "./workflow-request.js";
import { useWorkflowText } from "./workflow-i18n.js";
export function ArchiveRecords({ sessionId, team, task, archived }) {
    const l = useWorkflowText(), [busy, setBusy] = useState(''), [error, setError] = useState(''), [record, setRecord] = useState();
    if (task.kind !== 'archive')
        return null;
    async function open(id) {
        setBusy(id);
        setError('');
        try {
            const result = await workflowRequest({ action: 'task_archive', sessionId, teamId: team.id, taskId: task.id, recordId: id, archived });
            setRecord({ id, text: JSON.stringify(result.manifest, null, 2), manifest: result.manifest });
        }
        catch (e) {
            setError(String(e));
        }
        finally {
            setBusy('');
        }
    }
    function download() { if (!record)
        return; const url = URL.createObjectURL(new Blob([record.text], { type: 'application/json' })); const a = document.createElement('a'); a.href = url; a.download = `archive-${record.id}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
    return _jsxs("section", { "data-archive-records": true, children: [_jsx("h4", { children: l('成果归档记录') }), _jsx("p", { children: l('每次归档单独保存，上游重跑不会覆盖已完成的归档。清单记录文件摘要；Git 版本引用不代表工作区没有未提交修改。') }), !task.archiveRecords?.length ? _jsx("p", { children: l('归档完成后可在这里查看清单。') }) : [...task.archiveRecords].reverse().map(r => _jsxs("div", { children: [_jsxs("button", { type: "button", "aria-pressed": record?.id === r.id, disabled: !!busy, onClick: () => void open(r.id), children: [new Date(r.createdAt).toLocaleString(), " \u00B7 ", r.fileCount, " ", l('文件引用'), " / ", r.copiedCount, " ", l('文件副本')] }), _jsx("small", { style: { display: 'block', overflowWrap: 'anywhere' }, children: r.manifestPath })] }, r.id)), error && _jsx("p", { role: "alert", children: error }), record && _jsxs(_Fragment, { children: [_jsx("button", { type: "button", onClick: download, children: l('下载归档清单') }), record.manifest.gitCommit && _jsxs("p", { style: { overflowWrap: 'anywhere' }, children: ["Git \u00B7 ", _jsx("code", { children: record.manifest.gitCommit })] }), _jsx("h4", { children: l('已保存的成果与证据') }), record.manifest.tasks.map(t => _jsxs("details", { children: [_jsxs("summary", { children: [t.subject, " \u00B7 ", t.checkpoint ? l('第 {0} 轮', t.checkpoint.round) : `#${t.attempt ?? 0}`] }), _jsx("p", { style: { whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }, children: t.output || l('尚未提交结果说明') }), t.checkpoint?.history.map((h, i) => _jsxs("p", { children: [l('第 {0} 轮', h.round), " \u00B7 ", h.decision === 'approve' ? l('通过') : h.decision === 'branch' ? l('创建返工分支') : l('退回'), " \u00B7 ", h.note] }, i))] }, t.id)), !!record.manifest.files.length && _jsxs(_Fragment, { children: [_jsx("h4", { children: l('文件引用') }), record.manifest.files.map(f => _jsxs("details", { children: [_jsxs("summary", { children: [f.path, " \u00B7 ", f.skipped ? l('按策略跳过内容审计，请在本机检查') : f.copied ? l('文件副本') : f.present ? l('文件引用') : l('文件不存在')] }), _jsx("code", { style: { overflowWrap: 'anywhere' }, children: f.sha256 }), f.size !== undefined && _jsxs("p", { children: [f.size.toLocaleString(), " bytes"] }), f.reason && _jsx("p", { children: f.reason })] }, f.path))] }), record.manifest.loops.map(loop => _jsxs("p", { children: [l('第 {0} 轮', loop.round), " \u00B7 ", l('循环历史记录'), " ", loop.historyCount] }, loop.id)), _jsxs("details", { children: [_jsx("summary", { children: l('完整归档清单') }), _jsx("pre", { style: { maxHeight: 360, overflow: 'auto', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }, children: record.text })] })] })] });
}
