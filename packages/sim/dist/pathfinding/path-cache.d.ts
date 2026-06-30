import type { BoardDefinition } from '@facet/content';
import { type GridCoord, type WorldCoord } from '../board/coordinates.js';
import type { SimBoard } from '../board/sim-board.js';
export interface PathCache {
    version: number;
    routeId: string;
    legs: GridCoord[][];
    worldLegs: WorldCoord[][];
    concatenated: GridCoord[];
    worldConcatenated: WorldCoord[];
    legStartIndex: number[];
    totalLength: number;
}
export declare function buildPathCache(board: BoardDefinition, sim: SimBoard, routeId: string): PathCache | null;
export declare function isPathCacheValid(cache: PathCache, sim: SimBoard): boolean;
export declare function ensurePathCache(board: BoardDefinition, sim: SimBoard, routeId: string, current: PathCache | null): PathCache | null;
//# sourceMappingURL=path-cache.d.ts.map