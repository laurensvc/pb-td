import { hexKey } from './hexGrid';
import type { Vec2 } from './types';
export declare const BUILD_ZONE_RADIUS = 2;
export declare const cellKey: typeof hexKey;
/** Hex cells whose centers lie on a line between waypoints. */
export declare function cellsAlongPath(path: readonly Vec2[]): Set<string>;
export declare function isOnPath(x: number, y: number, pathCells: ReadonlySet<string>): boolean;
export declare function isInBuildZone(x: number, y: number, pathCells: ReadonlySet<string>, boardW: number, boardH: number, radius?: number): boolean;
export declare function buildZoneCells(pathCells: ReadonlySet<string>, boardW: number, boardH: number, radius?: number): Vec2[];
