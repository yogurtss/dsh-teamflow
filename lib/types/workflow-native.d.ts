/** Native Harness conversations, with proposal-only authority and durable scoping. */
import type { Context } from '@deepseek-ai/cordis';
import type { Agent } from '@deepseek-ai/dsh-agent';
import type { ToolsConfig } from './tools.ts';
import type { TeamState } from './types.ts';
import type { WorkflowDiscussion } from './workflow-types.ts';
export declare function workflowDiscussion(team: TeamState, key: string): WorkflowDiscussion;
/** The reserved ID namespace fails closed if plugin state is missing. Native
 * session logs contain only host-supported records; identity lives in team.json. */
export declare function discussionAddress(agent: Agent, stateDir: string): {
    teamId: string;
    captainSessionId: string;
    label: string;
} | undefined;
export declare function boundDiscussion(team: TeamState, agent: Agent): WorkflowDiscussion | undefined;
export declare function installWorkflowConversations(ctx: Context, config: ToolsConfig, materials: (team: TeamState, taskId: string, workspace: string) => {
    text: string;
    evidence: string;
}): {
    open(captain: Agent, team: TeamState, key: string, root: string, options?: {
        fresh?: boolean;
        message?: string;
    }): Promise<string>;
};
