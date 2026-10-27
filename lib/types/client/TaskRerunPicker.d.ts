/** Shared, explicit selection and impact preview for an isolated member rerun. */
import type { TeamTask } from '../types.ts';
export declare function TaskRerunImpact({ tasks, taskId }: {
    tasks: readonly TeamTask[];
    taskId: string;
}): import("react").JSX.Element;
export declare function TaskRerunPicker({ tasks, member, taskId, instructions, onTask, onInstructions, disabled }: {
    tasks: readonly TeamTask[];
    member: string;
    taskId: string;
    instructions: string;
    onTask: (id: string) => void;
    onInstructions: (text: string) => void;
    disabled: boolean;
}): import("react").JSX.Element | null;
