export declare function WorkflowWorkbench({ sessionId, teamId, waitingCount, openExecution, openConversation, nativeOnly, embeddedContext, onNativeContext, openContext }: {
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
