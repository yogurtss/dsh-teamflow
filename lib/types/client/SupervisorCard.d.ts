import type { PropsRuntime, PropsLocale } from '@deepseek-ai/dsh-client-ui-slots';
import type { WorkflowLauncherProps } from './WorkflowLauncher.tsx';
export declare function SupervisorMessage({ node, sessionId, t, sessions, modelDirectories, openMember }: PropsRuntime<'conversation.chat.node', 'teamflow-supervisor'> & PropsLocale<'agentTeams'> & WorkflowLauncherProps): import("react").JSX.Element;
export declare function ConversationCard({ card, archived, sessionId, t, sessions, modelDirectories, openMember }: Pick<WorkflowLauncherProps, 't' | 'sessions' | 'modelDirectories' | 'openMember'> & {
    archived?: boolean;
    card: import('../super-agent-card.ts').SupervisorCard;
    sessionId: string;
}): import("react").JSX.Element;
