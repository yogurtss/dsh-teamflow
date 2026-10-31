/** Resolve only server-bound TeamFlow discussion sessions to their owning captain. */
import type { ActivityTeam } from './activity-monitor.ts';
export interface ActivitySessionOwner {
    sessionId: string;
    owner: string;
    activity?: ActivityTeam;
}
export declare function resolveActivitySession(sessionId: string, signal?: AbortSignal, fetchState?: typeof fetch): Promise<ActivitySessionOwner>;
