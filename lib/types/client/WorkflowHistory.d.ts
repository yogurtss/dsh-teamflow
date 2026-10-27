import { type ReactNode } from 'react';
/** History comes from activity snapshots, never from the mutable workflow API. */
export declare function WorkflowHistory({ name, children }: {
    name: string;
    children: ReactNode;
}): import("react").JSX.Element;
