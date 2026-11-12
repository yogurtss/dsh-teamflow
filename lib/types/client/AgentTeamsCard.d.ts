import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { SessionId } from '@deepseek-ai/dsh-session/types';
import type { AgentTeamsCardData } from './agent-teams-card-definition.ts';
/** Navigation action injected from the plugin's own SessionsService access. */
export interface AgentTeamsCardInjected {
    readonly workspaceBridge?: {
        getSnapshot: () => unknown;
        subscribe: (listener: () => void) => () => void;
    };
    readonly openMember: (parentId: SessionId, childId: SessionId) => void;
}
/** Complete keyed Chat renderer props. */
export type AgentTeamsCardProps = PropsRuntime<'conversation.chat.node', 'agent-teams'> & PropsLocale<'agentTeams'> & AgentTeamsCardInjected;
export declare function AgentTeamsCard({ node, openMember, sessionId, t, workspaceBridge }: AgentTeamsCardProps): import("react").JSX.Element | null;
export declare function AgentTeamsSummary({ data, openMember, sessionId, t }: AgentTeamsCardInjected & PropsLocale<'agentTeams'> & {
    data: AgentTeamsCardData;
    sessionId: string;
}): import("react").JSX.Element;
