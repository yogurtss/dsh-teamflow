import { type WorkflowText } from './workflow-text.ts';
import type { TeamTask } from '../types.ts';
export declare const WORKFLOW_NODE_WIDTH = 225;
export declare const WORKFLOW_PORT_Y = 55;
/** Anchors use the node's outer border box, shared by paths, snapping and CSS. */
export declare function connectionPort(point: {
    x: number;
    y: number;
}, side: 'input' | 'output'): {
    x: number;
    y: number;
};
export declare function connectionPath(start: {
    x: number;
    y: number;
}, end: {
    x: number;
    y: number;
}): string;
/** Mirrors graph invariants for immediate drag feedback; the server revalidates. */
export declare function connectionIssue(tasks: TeamTask[], from: string, to: string, l?: WorkflowText): string | undefined;
export declare function connectionTarget(tasks: TeamTask[], position: (id: string) => {
    x: number;
    y: number;
}, point: {
    x: number;
    y: number;
}, from: string): TeamTask | undefined;
