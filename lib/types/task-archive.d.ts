import type { TeamState } from './types.ts';
/** A worker owns file I/O; the host lock owns only claims and guarded state commits. */
export declare function runTaskArchives(root: string, workspace: string, teamId: string): Promise<void>;
export declare function cancelTaskArchive(root: string, teamId: string, taskId?: string): Promise<void>;
export declare function archiveRunning(root: string, teamId: string): boolean;
/** Only records linked from authorized team state can be loaded, never a caller-supplied path. */
export declare function readTaskArchive(root: string, team: TeamState, taskId: string, id: string): Promise<unknown>;
