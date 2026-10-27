import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
/** Inline member configuration in the activity list, saved via the same workflow API as the canvas. */
import { useEffect, useState } from 'react';
import { StagedModelPicker } from "./StagingPlanEditor.js";
import css from './ActivityPanel.module.css';
async function request(payload) {
    const response = await fetch('/plugins/dsh-agent-teams/workflow', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    const value = await response.json();
    if (!response.ok)
        throw new Error(value.error ?? `HTTP ${response.status}`);
    return value;
}
export function QuickMemberEditor({ team, member, directory, t, close }) {
    const [base, setBase] = useState('');
    const [role, setRole] = useState(member.role);
    const [route, setRoute] = useState({ provider: '', model: '', reasoningEffort: '' });
    const [routeChanged, setRouteChanged] = useState(false);
    const [busy, setBusy] = useState(true);
    const [error, setError] = useState('');
    useEffect(() => {
        let live = true;
        setBusy(true);
        setError('');
        void request({ action: 'state', sessionId: team.captainSessionId, teamId: team.teamId }).then(result => {
            const current = result.team.members.find(item => item.name === member.name);
            if (!current)
                throw new Error('成员不存在');
            if (live) {
                setBase(result.base);
                setRole(current.role ?? '');
                setRoute({ provider: current.provider ?? '', model: current.model ?? '', reasoningEffort: current.reasoningEffort ?? '' });
                setRouteChanged(false);
            }
        }).catch(err => { if (live)
            setError(err instanceof Error ? err.message : String(err)); }).finally(() => { if (live)
            setBusy(false); });
        return () => { live = false; };
    }, [team.captainSessionId, team.teamId, member.name]);
    async function save() {
        setBusy(true);
        setError('');
        try {
            await request({ action: 'edit', sessionId: team.captainSessionId, teamId: team.teamId, title: `调整 ${member.name} 的配置`, base,
                operations: [{ action: 'update_member', name: member.name, role, ...(routeChanged ? { ...route, reasoningEffort: route.reasoningEffort || 'default' } : {}) }] });
            close();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
        finally {
            setBusy(false);
        }
    }
    return _jsxs("form", { className: css.quickMember, "aria-label": `配置 ${member.name}`, onSubmit: event => { event.preventDefault(); void save(); }, children: [_jsxs("strong", { children: ["\u914D\u7F6E \u00B7 ", member.name] }), _jsx(StagedModelPicker, { directory: directory, t: t, ...route, busy: busy || !base, onChange: value => { setRoute(value); setRouteChanged(true); } }), _jsxs("label", { children: ["\u804C\u8D23", _jsx("textarea", { value: role, disabled: busy || !base, onChange: event => setRole(event.target.value) })] }), error && _jsx("p", { role: "alert", children: error }), _jsxs("div", { children: [_jsx("button", { type: "submit", disabled: busy || !base, children: "\u4FDD\u5B58" }), _jsx("button", { type: "button", disabled: busy, onClick: close, children: "\u53D6\u6D88" })] })] });
}
