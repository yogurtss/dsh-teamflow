import { rerunnableTasks } from "../task-rerun.js";
export const initialWorkbenchView = () => ({ target: { type: 'discussion', key: 'graph' }, revision: 0, drafts: {} });
export const editorKey = (teamId, target) => JSON.stringify([teamId, target.type, target.id ?? null]);
export function editorTarget(team, target, allowRerun = false) {
    if (target.type === 'edge' || target.type === 'discussion')
        return;
    if (target.type === 'member' || !target.id)
        return target;
    const task = team?.tasks.find(item => item.id === target.id);
    if (allowRerun && task && !task.checkpoint && ['completed', 'failed', 'cancelled'].includes(task.status))
        return target;
    if (task?.status === 'pending' && ((task.attempt ?? 0) === 0 || task.workflowPaused) && !task.checkpoint?.decision && !task.reassigning)
        return target;
}
export function targetDiscussion(target) {
    return target.type === 'discussion' ? target.key : target.type === 'member' && target.id ? `member:${target.id}` : target.type === 'check' && target.id ? `check:${target.id}` : 'graph';
}
export function draftSource(team, target) {
    if (!target.id)
        return '';
    const member = team?.members.find(item => item.name === target.id);
    const task = team?.tasks.find(item => item.id === target.id);
    return JSON.stringify(target.type === 'member' ? member && [member.name, member.summary, member.role, member.executionPrompt, member.provider, member.model, member.reasoningEffort, member.status === 'removed'] : task && [task.id, task.subject, task.description, task.assignee, task.kind]) ?? '';
}
export function initialEditorDraft(team, target) {
    const m = team?.members.find(item => item.name === target.id), t = team?.tasks.find(item => item.id === target.id);
    return { source: draftSource(team, target), values: target.type === 'member'
            ? { name: m?.name ?? '', summary: m?.summary ?? m?.role ?? '', role: m?.role ?? '', executionPrompt: m?.executionPrompt ?? '', provider: m?.provider ?? '', model: m?.model ?? '', reasoningEffort: m?.reasoningEffort ?? '', routeChanged: '', rerunTaskId: m ? rerunnableTasks(team?.tasks ?? [], m.name).at(-1)?.id ?? '' : '', rerunInstructions: '' }
            : { subject: t?.subject ?? '', description: t?.description ?? '', assignee: t?.assignee ?? '' } };
}
export function selectWorkbench(view, target, team, overrides) {
    const editor = editorTarget(team, target), drafts = { ...view.drafts };
    if (editor) {
        const key = editorKey(team?.id ?? '', editor), draft = drafts[key] ?? initialEditorDraft(team, editor);
        drafts[key] = overrides ? { ...draft, values: { ...draft.values, ...overrides } } : draft;
    }
    return { target, revision: view.revision + 1, drafts };
}
/** A late save may clear only the exact draft it submitted, never newer typing. */
export function finishWorkbenchSave(view, key, submitted, revision, team, nextTarget, submittedTarget) {
    const drafts = { ...view.drafts };
    if (key && submitted && drafts[key] === submitted)
        delete drafts[key];
    else if (key && submitted && submittedTarget && drafts[key]?.source === submitted.source) {
        const latest = drafts[key], fresh = initialEditorDraft(team, submittedTarget);
        drafts[key] = { source: fresh.source, values: { ...fresh.values, ...Object.fromEntries(Object.entries(latest.values).filter(([field, value]) => value !== submitted.values[field])) } };
        if (submittedTarget.type === 'member' && ['provider', 'model', 'reasoningEffort'].some(field => latest.values[field] !== submitted.values[field]))
            drafts[key].values['routeChanged'] = 'yes';
    }
    const updated = { ...view, drafts };
    return view.revision === revision && nextTarget ? selectWorkbench(updated, nextTarget, team) : updated;
}
