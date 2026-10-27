import type { ModelDirectory } from '@deepseek-ai/dsh-client-ui-model-selection/client';
import type { ActivityMember, ActivityTeam } from './activity-monitor.ts';
import type { AgentTeamsTranslate } from './locales.ts';
export declare function QuickMemberEditor({ team, member, directory, t, close }: {
    team: ActivityTeam;
    member: ActivityMember;
    directory: ModelDirectory;
    t: AgentTeamsTranslate;
    close: () => void;
}): import("react").JSX.Element;
