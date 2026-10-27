import type { ModelDirectory } from '@deepseek-ai/dsh-client-ui-model-selection/client';
import type { AgentTeamsTranslate } from './locales.ts';
export declare function WorkflowWorkbench({ sessionId, teamId, archived, waitingCount, openExecution, openConversation, nativeOnly, reviewEntryOnly, embeddedContext, onNativeContext, openContext, modelDirectory, t }: {
    archived?: boolean;
    modelDirectory?: ModelDirectory;
    t?: AgentTeamsTranslate;
    reviewEntryOnly?: boolean;
    embeddedContext?: boolean;
    onNativeContext?: (value: boolean) => void;
    openContext?: () => void;
    nativeOnly?: boolean;
    openConversation?: (id: string) => void | Promise<void>;
    sessionId: string;
    teamId?: string;
    waitingCount?: number;
    openExecution?: (memberId: string, parentId?: string) => void | Promise<void>;
}): import("react").JSX.Element | null;
