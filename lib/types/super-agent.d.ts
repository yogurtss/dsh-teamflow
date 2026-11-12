/** Opt-in supervision. Only the explicit settings picker enumerates workflows. */
import type { Context } from '@deepseek-ai/cordis';
import type { WorkspaceRegistry } from '@deepseek-ai/dsh-workspace';
import type { TeamState } from './types.ts';
import { type WatchRow, type WorkflowWatch } from './super-agent-watch.ts';
import { type WebRouteHost } from './web-routes.ts';
export declare function watchRow(team: TeamState): WatchRow;
export declare function listWatchRows(root: string, catalog?: boolean): Promise<WatchRow[]>;
export declare function setWatch(root: string, id: string, watch: WorkflowWatch | null, previous: unknown): Promise<void>;
export declare function installSuperAgent(ctx: Context, stateDir: string, server: WebRouteHost, registry: WorkspaceRegistry): void;
