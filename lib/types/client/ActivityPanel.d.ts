import type { ModelDirectory, ModelDirectoryResolver } from '@deepseek-ai/dsh-client-ui-model-selection/client';
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots';
import type { SessionId } from '@deepseek-ai/dsh-session/types';
import type { ObservableSnapshot } from '@deepseek-ai/dsh-client-store';
import type { SessionListState } from '@deepseek-ai/dsh-api-session-controller/client';
import { type ActivityTeam } from './activity-monitor.ts';
import type { AgentTeamsTranslate } from './locales.ts';
declare function LocalizedTeamSection({ team, modelDirectory, onContinuePlanning, onDiscarded, onNavigate, t, historic }: {
    readonly team: ActivityTeam;
    readonly modelDirectory?: ModelDirectory;
    readonly onContinuePlanning?: () => void;
    readonly onDiscarded?: () => void;
    /** Navigate to a member transcript. */
    readonly onNavigate: (parentId: SessionId, childId: SessionId) => void;
    readonly t: AgentTeamsTranslate;
    readonly historic?: boolean;
}): import("react").JSX.Element;
/** Shared session inputs for the canvas shortcut and blank-session entry. */
export type ActivityPanelProps = {
    readonly onMonitorStatus?: (sessionId: SessionId, status: 'loading' | 'ready' | 'error') => void;
    readonly conversationVisible?: boolean;
    readonly sessionsList: ObservableSnapshot<SessionListState>;
    readonly modelDirectories: ModelDirectoryResolver;
    readonly openMember: (parentId: SessionId, childId: SessionId) => void | Promise<void>;
} & PropsLocale<'agentTeams'>;
export declare function ActivityPanel({ sessionsList, modelDirectories, openMember, t, conversationVisible, onMonitorStatus }: ActivityPanelProps): import("react").JSX.Element | null;
export declare function TeamSection(props: Parameters<typeof LocalizedTeamSection>[0]): import("react").JSX.Element;
export {};
