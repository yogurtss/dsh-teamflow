import { type ReactNode } from 'react';
/** History comes from activity snapshots, never from the mutable workflow API. */
export declare function WorkflowHistory({ name, children, restore }: {
    name: string;
    children: ReactNode;
    restore?: {
        sessionId: string;
        teamId: string;
    };
}): import("react").JSX.Element;
