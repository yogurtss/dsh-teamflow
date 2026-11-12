import { replacedTaskIds } from "./replaced-tasks.js";
export const watchKinds = ['review', 'proposal', 'block'];
/** Match the workbench completion rule, including replacement paths and loop gates. */
export function workflowComplete(team) {
    if (!team.workflow || team.phase === 'staged')
        return false;
    const replaced = replacedTaskIds(team.tasks, team.workflow);
    const tasks = team.tasks.filter(task => !replaced.has(task.id));
    const upstream = new Set(tasks.flatMap(task => task.dependencies));
    const ends = tasks.filter(task => !upstream.has(task.id));
    return ends.length > 0 && ends.every(task => task.status === 'completed' && (!task.checkpoint || task.checkpoint.decision === 'approve'))
        && !team.workflow.loops?.some(loop => loop.status !== 'passed' && tasks.some(task => task.id === loop.gateId));
}
export function validWatch(value) {
    if (!value || typeof value !== 'object')
        return false;
    const watch = value;
    return typeof watch.keep === 'boolean' && Array.isArray(watch.kinds) && watch.kinds.length <= watchKinds.length
        && watch.kinds.every(kind => watchKinds.includes(kind)) && new Set(watch.kinds).size === watch.kinds.length;
}
