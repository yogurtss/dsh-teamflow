import type { Checkpoint } from './workflow-types.ts';
/** Resolve old loop checkpoints without rewriting persisted execution history. */
export declare function isGateTask(task: {
    id: string;
    checkpoint?: Pick<Checkpoint, 'kind'>;
}, loops?: readonly {
    gateId: string;
}[]): boolean;
