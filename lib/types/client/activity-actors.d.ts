import type { ActivityTeam } from './activity-monitor.ts';
import type { AgentTeamsLocaleKey } from './locales.ts';
type Tone = 'ready' | 'active' | 'adapting' | 'complete' | 'blocked' | 'decision';
type Actor = {
    name?: string;
    from?: string;
    task?: string;
    label: AgentTeamsLocaleKey;
    tone: Tone;
};
export declare function activityActors(team: ActivityTeam, archived?: boolean): Actor[];
export {};
