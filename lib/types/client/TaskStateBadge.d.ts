import type { AgentTeamsTranslate } from './locales.ts';
import type { taskControlState } from './task-control.ts';
export declare const taskStateNodeClass: string;
export declare function TaskStateBadge({ control, t, className, detail, discarded, stale }: {
    control: ReturnType<typeof taskControlState>;
    t?: AgentTeamsTranslate;
    className?: string;
    detail?: string;
    discarded?: boolean;
    stale?: boolean;
}): import("react").JSX.Element;
