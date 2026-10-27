import { createUserMessage } from '@deepseek-ai/dsh-llm';
import { agentTeamsSource, observedSessionFormatVersion } from "./harness-compat.js";
import { parseProfileInvocation, resolveProfileTaskPlanning } from "./profiles.js";
export const AGENT_TEAMS_COMMAND = 'agent-teams';
export const TEAMFLOW_COMMAND = 'teamflow';
const PROFILE_COMMAND_PREFIX = `${AGENT_TEAMS_COMMAND}-`;
const GESTURE = /^\/agent-teams(?=$|[\t\n\r ])/u;
/**
 * Convert a configured profile key into a stable, closed-namespace command
 * suffix. Only lowercase ASCII letters, digits and dashes are representable;
 * this deliberately prevents accidental command aliases for ambiguous profile
 * names such as `foo bar`, `foo_bar`, or non-ASCII keys.
 */
export function profileCommandName(profileName) {
    const normalized = profileName.trim().toLowerCase();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(normalized))
        return undefined;
    return `${PROFILE_COMMAND_PREFIX}${normalized}`;
}
/** Resolve a profile command only when it maps uniquely to a live profile. */
function profileForCommand(commandName, profiles) {
    const matches = Object.keys(profiles).filter((profileName) => profileCommandName(profileName) === commandName);
    return matches.length === 1 ? matches[0] : undefined;
}
/** Parse either the generic command or one generated profile alias. */
function parseCommandText(text, profiles) {
    const trimmed = text.trimStart().replace(/^\/teamflow(?=$|[-\t\n\r ])/u, '/agent-teams');
    if (GESTURE.test(trimmed))
        return parseProfileInvocation(trimmed.slice(AGENT_TEAMS_COMMAND.length + 1).trim());
    if (!trimmed.startsWith(`/${PROFILE_COMMAND_PREFIX}`))
        return undefined;
    const tokenEnd = trimmed.search(/[\t\n\r ]/u);
    const commandName = trimmed.slice(1, tokenEnd === -1 ? undefined : tokenEnd);
    const profile = profileForCommand(commandName, profiles);
    if (profile === undefined)
        return undefined;
    return { profile, goal: (tokenEnd === -1 ? '' : trimmed.slice(tokenEnd)).trim() };
}
export function invokedAgentTeamsInvocation(messages, getProfiles = () => ({})) {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
        const message = messages[index];
        if (message === undefined || message.source.kind !== 'user')
            continue;
        for (const block of message.content) {
            if (block.type !== 'text')
                continue;
            const invocation = parseCommandText(block.text, getProfiles());
            if (invocation !== undefined)
                return invocation;
        }
    }
    return undefined;
}
export function invokedAgentTeamsGoal(messages) {
    return invokedAgentTeamsInvocation(messages)?.goal;
}
export function buildActivationDirective(goal, profile, taskPlanning = 'seed') {
    const lines = [
        'The user invoked an TeamFlow slash command. Follow the TeamFlow protocol already in your system instructions. Inspect existing team state with agent_teams_status when needed.',
        'Respect the current team state. Continue an existing plan or team without recreating it. Only when no current team exists, call agent_teams_create with approval="required". Build the complete staged roster and DAG, then stop and ask the user to review the Web plan. Do not approve or start it in this same turn.',
    ];
    if (profile !== undefined) {
        lines.push(`Use profile="${profile}" when creating a new team.`);
        if (taskPlanning === 'captain') {
            lines.push('This profile supplies the roster and guardrails. After create, do not recreate members.', 'Derive the smallest useful task graph from the goal while the team is staged; do not ask the user whether to split, merge, serialize, or parallelize.', 'Independent supplemental work must become separate ready tasks so idle members can run in parallel. Add dependencies only for genuine prerequisites and later synthesis.');
        }
        else {
            lines.push('Do not recreate the same members or seed tasks manually.');
        }
    }
    lines.push(goal === '' ? 'The goal was not given — ask the user what the team should accomplish.' : `Goal: ${goal}`);
    return lines.join('\n');
}
export function registerAgentTeamsCommand(ctx, getProfiles = () => ({})) {
    ctx.effect(() => {
        const dispose = [];
        for (const name of [TEAMFLOW_COMMAND, AGENT_TEAMS_COMMAND])
            dispose.push(ctx.commands.register({
                name,
                description: 'TeamFlow: plan a team workflow with human review (you become the captain)',
                input: { hint: '[--profile <name>] <goal>' },
                handler(invocation) {
                    let parsed;
                    try {
                        parsed = parseProfileInvocation(invocation.rawInput.trim());
                    }
                    catch (error) {
                        return { kind: 'error', text: String(error) };
                    }
                    if (parsed.profile !== undefined && !Object.keys(getProfiles()).some(key => key.trim() === parsed.profile))
                        return { kind: 'error', text: `unknown TeamFlow profile "${parsed.profile}"` };
                    if (parsed.profile === undefined && parsed.goal === '')
                        return { kind: 'error', text: `Usage: /${name} [--profile <name>] <goal>` };
                    invocation.agent.followup(createUserMessage({ content: [{ type: 'text', text: `/${name}${invocation.rawInput}` }], source: { kind: 'user' } }));
                    return { kind: 'success', text: `TeamFlow activated${parsed.profile === undefined ? '' : ` with profile ${parsed.profile}`} — the captain will assemble the team.` };
                },
            }));
        for (const profileName of Object.keys(getProfiles())) {
            const commandName = profileCommandName(profileName);
            if (commandName === undefined)
                continue;
            for (const name of [commandName.replace(/^agent-teams/, TEAMFLOW_COMMAND), commandName])
                dispose.push(ctx.commands.register({
                    name,
                    description: `run a goal with the TeamFlow ${profileName} profile`,
                    input: { hint: '<goal>' },
                    handler(invocation) {
                        const profile = profileForCommand(commandName, getProfiles());
                        if (profile === undefined)
                            return { kind: 'error', text: `TeamFlow profile command "/${commandName}" is unavailable` };
                        invocation.agent.followup(createUserMessage({ content: [{ type: 'text', text: `/${name}${invocation.rawInput}` }], source: { kind: 'user' } }));
                        return { kind: 'success', text: `TeamFlow activated with profile ${profile} — the captain will assemble the team.` };
                    },
                }));
        }
        return () => {
            for (const unregister of dispose.reverse())
                unregister();
        };
    }, 'agent-teams: slash commands');
}
export function installAgentTeamsGestureBoundary(ctx, getProfiles = () => ({})) {
    ctx.on('agent/pre-step', async ({ agent, messages, signal }, next) => {
        const decision = await next();
        if (decision.kind === 'reject')
            return decision;
        // The live session header carries the format this host actually stores; the
        // resolved module constant can name another DSH line in the same profile (#236).
        const observed = observedSessionFormatVersion(agent);
        let invocation;
        try {
            invocation = invokedAgentTeamsInvocation(messages, getProfiles);
        }
        catch (error) {
            return { kind: 'enter', messages: [...decision.messages, createUserMessage({ content: [{ type: 'text', text: `TeamFlow profile parsing failed: ${String(error)}` }], source: agentTeamsSource({ kind: 'agent-teams-command' }, observed) })] };
        }
        if (invocation === undefined)
            return decision;
        signal.throwIfAborted();
        const profiles = getProfiles();
        const matched = invocation.profile === undefined
            ? undefined
            : Object.entries(profiles).find(([key]) => key.trim() === invocation.profile);
        const known = invocation.profile === undefined || matched !== undefined;
        const text = !known
            ? `TeamFlow profile "${invocation.profile}" does not exist. Available profiles: ${Object.keys(profiles).join(', ') || '(none)'}. Do not create a team.`
            : buildActivationDirective(invocation.goal, invocation.profile, resolveProfileTaskPlanning(matched?.[1]));
        return { kind: 'enter', messages: [...decision.messages, createUserMessage({ content: [{ type: 'text', text }], source: agentTeamsSource({ kind: 'agent-teams-command', ...invocation.goal === '' ? {} : { goal: invocation.goal }, ...invocation.profile === undefined ? {} : { profile: invocation.profile } }, observed) })] };
    });
}
