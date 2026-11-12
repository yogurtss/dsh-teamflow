import type { Context } from '@deepseek-ai/cordis';
import type { Agent } from '@deepseek-ai/dsh-agent';
import type { TeamState } from './types.ts';
export declare function forceEndWorkflow(ctx: Context, root: string, teamId: string, captain: Agent, createdAt: number, requestId: string, english: boolean): Promise<TeamState>;
