import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { ISidebarRight } from '@deepseek-ai/dsh-client-ui-sidebar-right/client';
import { type ActivityPanelProps } from './ActivityPanel.tsx';
import type { WorkspaceActivityState } from './workspace-state.ts';
export declare const TEAM_TAB_KIND = "agent-teams";
export declare const TEAM_TAB_ID = "@yogurtss/dsh-teamflow/activity";
/** Optional host integration tracks whether the host renders durable turn-tail cards. */
export declare function createWorkspaceBridge(): {
    getSnapshot: () => ISidebarRight | undefined;
    subscribe: (listener: () => void) => () => void;
    set(value: ISidebarRight | undefined): void;
};
/** The activity dot is the primary monitor on every host; native tabs are supplementary. */
export declare function ActivitySurface({ state, ...props }: ActivityPanelProps & {
    state: WorkspaceActivityState;
}): import("react").JSX.Element;
export type WorkspaceActivityProps = PropsRuntime<'sidebar.right.pane.tab'> & PropsLocale<'agentTeams'> & {
    state: WorkspaceActivityState;
    modelDirectories: ActivityPanelProps['modelDirectories'];
    openMember: ActivityPanelProps['openMember'];
    openContext?: () => void;
};
export declare function WorkspaceActivity({ sessionId, useTabInfo, t, state, modelDirectories, openMember, openContext }: WorkspaceActivityProps): import("react").JSX.Element;
