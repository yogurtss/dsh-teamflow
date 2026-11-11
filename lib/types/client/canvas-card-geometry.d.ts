import type { TeamTask } from '../types.ts';
export declare const CARD_WIDTH = 294, CARD_HEIGHT = 230, CARD_PORT_Y = 114;
type Point = {
    x: number;
    y: number;
};
export declare const displayPoint: (p: Point) => Point;
export declare const storedPoint: (p: Point) => Point;
export declare function connectionPort(p: Point, side: 'input' | 'output'): Point;
export declare function connectionTarget(tasks: TeamTask[], position: (id: string) => Point, point: Point, from: string): TeamTask | undefined;
export {};
