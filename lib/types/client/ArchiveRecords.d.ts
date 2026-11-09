import type { TeamState, TeamTask } from '../types.ts';
export declare function ArchiveRecords({ sessionId, team, task, archived }: {
    sessionId: string;
    team: TeamState;
    task: TeamTask;
    archived: boolean;
}): import("react").JSX.Element | null;
