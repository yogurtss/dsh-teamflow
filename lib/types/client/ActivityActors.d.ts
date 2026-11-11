import type { ActivityTeam } from './activity-monitor.ts';
import type { AgentTeamsTranslate } from './locales.ts';
export declare function ActivityActors({ team, archived, t }: {
    team: ActivityTeam;
    archived?: boolean;
    t: AgentTeamsTranslate;
}): import("react").JSX.Element;
