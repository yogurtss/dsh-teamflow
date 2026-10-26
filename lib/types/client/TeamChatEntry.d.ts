import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import { type AgentTeamsCardInjected } from './AgentTeamsCard.tsx';
export declare function TeamChatEntry({ sessionId, t, openMember, openContext }: PropsRuntime<'conversation.session.header.actions'> & PropsLocale<'agentTeams'> & Pick<AgentTeamsCardInjected, 'openMember'> & {
    openContext?: () => void;
}): import("react").JSX.Element;
export declare function TeamTurnCard({ sessionId, turn, useChat, t, openMember }: PropsRuntime<'conversation.chat.turnTail'> & PropsLocale<'agentTeams'> & AgentTeamsCardInjected): import("react").JSX.Element | null;
