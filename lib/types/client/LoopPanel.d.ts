import type { TeamState, TeamTask } from '../types.ts';
export declare function LoopPanel({ team, task, sessionId, base, archived, busy, perform }: {
    team: TeamState;
    task: TeamTask;
    sessionId: string;
    base: string;
    archived: boolean;
    busy: boolean;
    perform: (action: string, fields: Record<string, unknown>) => Promise<unknown>;
}): import("react").JSX.Element | null;
