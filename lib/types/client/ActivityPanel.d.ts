import type { ModelDirectory, ModelDirectoryResolver } from '@deepseek-ai/dsh-client-ui-model-selection/client';
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots';
import type { SessionId } from '@deepseek-ai/dsh-session/types';
import type { ObservableSnapshot } from '@deepseek-ai/dsh-client-store';
import type { SessionListState } from '@deepseek-ai/dsh-api-session-controller/client';
import { type ActivityTeam } from './activity-monitor.ts';
import type { AgentTeamsCardData } from './agent-teams-card-definition.ts';
import type { AgentTeamsTranslate } from './locales.ts';
declare function LocalizedTeamSection({ team, modelDirectory, onContinuePlanning, onDiscarded, onNavigate, t, historic, workspace }: {
    readonly team: ActivityTeam;
    readonly modelDirectory?: ModelDirectory;
    readonly onContinuePlanning?: () => void;
    readonly onDiscarded?: () => void;
    /** Navigate to a member transcript (floater hides immediately). */
    readonly onNavigate: (parentId: SessionId, childId: SessionId) => void;
    readonly t: AgentTeamsTranslate;
    readonly historic?: boolean;
    readonly workspace?: boolean;
}): import("react").JSX.Element;
/** Legacy conversation cards may outlive their host archive. Project their
 * durable roster through the same rebuilt panel instead of a second UI. */
export declare function historicCardTeam(data: AgentTeamsCardData, owner: string): ActivityTeam;
/** The top-right activity floater. Teams follow the current session: live
 * snapshots and historic card summaries are only shown while their captain
 * session is the one currently open. */
export type ActivityPanelProps = {
    readonly onMonitorStatus?: (sessionId: SessionId, status: 'loading' | 'ready' | 'error') => void;
    readonly onRememberTeam?: (sessionId: SessionId, data: AgentTeamsCardData) => void;
    readonly conversationVisible?: boolean;
    readonly sessionsList: ObservableSnapshot<SessionListState>;
    readonly modelDirectories: ModelDirectoryResolver;
    readonly openMember: (parentId: SessionId, childId: SessionId) => void | Promise<void>;
} & PropsLocale<'agentTeams'>;
export declare function ActivityPanel({ sessionsList, modelDirectories, openMember, t, conversationVisible, onMonitorStatus, onRememberTeam }: ActivityPanelProps): import("react").JSX.Element | null;
export declare function TeamSection(props: Parameters<typeof LocalizedTeamSection>[0]): import("react").JSX.Element;
export {};
