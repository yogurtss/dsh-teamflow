import type { TeamState } from './types.ts';
import { type LoopHistoryRecord } from './workflow-loops.ts';
export declare function writeLoopTeam(root: string, team: TeamState): Promise<void>;
export declare function readHistoryRecord(root: string, teamId: string, id: string): Promise<LoopHistoryRecord>;
export declare function readLoopHistory(root: string, team: TeamState, loopId: string, cursor?: string): Promise<{
    records: LoopHistoryRecord[];
    next?: string;
}>;
