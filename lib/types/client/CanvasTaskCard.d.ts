import type { TeamState, TeamTask } from '../types.ts';
import { type ExecutionState } from './task-readiness.ts';
import type { taskControlState } from './task-control.ts';
export declare function CanvasTaskCard({ team, task, control, execution, archived, reviewing, adapting, draft, systemOwned, onMember, selectedMember }: {
    team: TeamState;
    task: TeamTask;
    control: ReturnType<typeof taskControlState>;
    execution?: ExecutionState;
    archived: boolean;
    reviewing: boolean;
    adapting: boolean;
    draft: boolean;
    systemOwned?: boolean;
    onMember: (name: string) => void;
    selectedMember?: string;
}): import("react").JSX.Element;
