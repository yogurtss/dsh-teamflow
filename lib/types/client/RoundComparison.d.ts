import type { TeamTask } from '../types.ts';
type Result = Pick<TeamTask, 'id' | 'subject' | 'status' | 'output'> & Required<Pick<TeamTask, 'acceptanceResults' | 'commandsRun'>>;
export interface RoundResults {
    round: number;
    tasks: Result[];
    executionRounds?: Record<string, number>;
    previous?: {
        round: number;
        tasks: Result[];
    };
}
export declare function RoundComparison({ round, tasks, previous, executionRounds }: RoundResults): import("react").JSX.Element;
export {};
