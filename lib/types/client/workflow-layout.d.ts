import type { TeamTask } from '../types.ts';
export interface CanvasPoint {
    x: number;
    y: number;
}
type LayoutTask = Pick<TeamTask, 'id' | 'dependencies'>;
export interface LayoutLoop {
    gateId: string;
    entryId: string;
    bodyIds?: readonly string[];
}
/** Template configs carry entry/gate IDs; runtime loops also carry the derived body. */
export declare function loopBodyIds(tasks: readonly LayoutTask[], loop: LayoutLoop): string[];
/** Collapse each loop into a region before arranging the surrounding DAG. */
export declare function arrangeWorkflow(tasks: LayoutTask[], loops?: readonly LayoutLoop[]): Record<string, CanvasPoint>;
export declare function loopRegion(tasks: readonly LayoutTask[], loop: LayoutLoop, position: (id: string) => CanvasPoint): {
    x: number;
    y: number;
    width: number;
    height: number;
    bottom: number;
    returnPath: string;
    label: {
        x: number;
        y: number;
    };
};
/** Fixed-height cards and generous gutters keep branches and long titles apart. */
export declare function arrangeTasks(tasks: Pick<TeamTask, 'id' | 'dependencies'>[]): Record<string, CanvasPoint>;
export declare const clampZoom: (value: number) => number;
export declare function fitGraph(width: number, height: number, graphWidth: number, graphHeight: number): number;
export {};
