import type { SessionProviderComponent, PropsRenderFactories, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { ReactNode } from 'react';
import type { WorkflowLauncherProps } from './WorkflowLauncher.tsx';
import { type SupervisorVisit } from './super-agent-navigation.ts';
type Props = WorkflowLauncherProps;
type HostChat = {
    SessionProvider?: SessionProviderComponent;
    renderChat?: () => ReactNode;
};
export declare function NativeChatBody({ renderFactorySlot, useSession, useConversation }: PropsRenderFactories & PropsRuntime<'teamflow.super-agent.panel.chat'>): import("react").JSX.Element;
export declare function SuperAgentIcon(props: Props & {
    size: number;
}): import("react").JSX.Element;
export declare function SuperAgentOverlay(props: Props & HostChat): import("react").ReactPortal | null;
export declare function SuperAgentPanel(props: Props & HostChat & {
    visit?: SupervisorVisit;
    back?: () => void;
}): import("react").JSX.Element;
export {};
