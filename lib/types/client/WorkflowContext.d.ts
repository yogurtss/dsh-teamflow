/** The stored facts a person and the native discussion can inspect together. */
import type { TeamState, TeamTask } from '../types.ts';
export declare function TaskRecord({ task, team, expanded, showContract }: {
    task: TeamTask;
    team: TeamState;
    expanded?: boolean;
    showContract?: boolean;
}): import("react").JSX.Element;
export declare function WorkflowContext({ team, discussion, onSelect, openExecution }: {
    team: TeamState;
    discussion: string;
    onSelect?: (key: string) => void;
    openExecution?: (id: string, parentId?: string) => void | Promise<void>;
}): import("react").JSX.Element;
