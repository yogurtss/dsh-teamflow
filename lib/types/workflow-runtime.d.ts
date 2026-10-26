/** Human-only workflow controls and native conversation navigation. */
import type { Context } from '@deepseek-ai/cordis';
import type { TeamState } from './types.ts';
import { type installWorkflowConversations } from './workflow-native.ts';
import type { AgentTeamsRuntime, ToolsConfig } from './tools.ts';
import { type WebRouteHost } from './web-routes.ts';
export declare function workflowMaterials(team: TeamState, taskId: string, workspace: string): {
    text: string;
    evidence: string;
};
/** Authenticated human controls are separate from model tools. */
export declare function installWorkflowWorkbench(ctx: Context, config: ToolsConfig, runtime: AgentTeamsRuntime, server: WebRouteHost, conversations?: ReturnType<typeof installWorkflowConversations>): void;
