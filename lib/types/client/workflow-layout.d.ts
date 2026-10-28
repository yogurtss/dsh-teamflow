import type { TeamTask } from '../types.ts';
export interface CanvasPoint {
    x: number;
    y: number;
}
/** Fixed-height cards and generous gutters keep branches and long titles apart. */
export declare function arrangeTasks(tasks: Pick<TeamTask, 'id' | 'dependencies'>[]): Record<string, CanvasPoint>;
export declare const clampZoom: (value: number) => number;
export declare function fitGraph(width: number, height: number, graphWidth: number, graphHeight: number): number;
