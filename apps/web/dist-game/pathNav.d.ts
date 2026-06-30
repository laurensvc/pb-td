import type { PathNavData, Vec2 } from './types';
export declare const LEAK_EPSILON = 0.15;
export declare function resolveCheckpoints(path: readonly Vec2[], pathCells: ReadonlySet<string>): Vec2[];
export declare function buildPathNav(path: readonly Vec2[]): PathNavData;
export declare function nearestPathCell(x: number, y: number, pathCells: ReadonlySet<string>): Vec2;
export declare function pathProgressAt(nav: PathNavData, x: number, y: number): number;
export declare function stepEnemyOnPath(enemy: {
    x: number;
    y: number;
    pathProgress: number;
    speed: number;
    checkpointIndex: number;
}, nav: PathNavData, dt: number): 'moving' | 'leaked';
export declare function bfsDistanceFromCell(pathCells: ReadonlySet<string>, origin: Vec2): Map<string, number>;
