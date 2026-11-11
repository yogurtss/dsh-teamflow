import type { TeamTask } from './types.ts';
export declare function excerpt(text: string | undefined, limit?: number): string | undefined;
export declare function resultDigest(tasks: TeamTask[]): string;
export declare function reviewResult(t: TeamTask, gate?: TeamTask): {
    id: string;
    subject: string | undefined;
    status: import("./types.ts").TaskStatus;
    attemptId: string | undefined;
    output: string;
    acceptanceResults: {
        status: "passed" | "failed";
        criterion: string | undefined;
        evidence: string | undefined;
    }[];
    commandsRun: {
        status: "passed" | "failed";
        exitCode: number | undefined;
        command: string | undefined;
        evidence: string | undefined;
    }[];
};
