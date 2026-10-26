import type { TeamTask } from '../types.ts';
/** Mirrors graph invariants for immediate drag feedback; the server revalidates. */
export declare function connectionIssue(tasks: TeamTask[], from: string, to: string): string | undefined;
export declare function connectionTarget(tasks: TeamTask[], position: (id: string) => {
    x: number;
    y: number;
}, point: {
    x: number;
    y: number;
}, from: string): TeamTask | undefined;
