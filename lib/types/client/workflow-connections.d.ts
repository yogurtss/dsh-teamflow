import { type WorkflowText } from './workflow-text.ts';
import type { TeamTask } from '../types.ts';
export declare const WORKFLOW_GATE_PATH = "M112.5 2 C116.5 2 119 5 124 8 L215 67 C222 71 225 72 225 75 C225 78 222 79 215 83 L124 142 C119 145 116.5 148 112.5 148 C108.5 148 106 145 101 142 L10 83 C3 79 0 78 0 75 C0 72 3 71 10 67 L101 8 C106 5 108.5 2 112.5 2 Z";
export declare const WORKFLOW_NODE_WIDTH = 225;
export declare const WORKFLOW_PORT_Y = 55;
export declare const WORKFLOW_GATE_PORT_Y = 75;
/** Anchors use the node's outer border box, shared by paths, snapping and CSS. */
export declare function connectionPort(point: {
    x: number;
    y: number;
}, side: 'input' | 'output', checkpoint?: boolean): {
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
}, from: string, isGate?: (task: TeamTask) => boolean): TeamTask | undefined;
