import type { WorkflowLauncherProps } from './WorkflowLauncher.tsx';
import { type SupervisorVisit } from './super-agent-navigation.ts';
type Props = WorkflowLauncherProps;
export declare function SuperAgentIcon(props: Props & {
    size: number;
}): import("react").JSX.Element;
export declare function SuperAgentOverlay(props: Props): import("react").ReactPortal | null;
export declare function SuperAgentPanel(props: Props & {
    visit?: SupervisorVisit;
    back?: () => void;
}): import("react").JSX.Element;
export {};
