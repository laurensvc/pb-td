import type { PathNavData, Vec2 } from './types';
export interface MazeLayout {
    boardW: number;
    boardH: number;
    spawnCell: Vec2;
    goalCell: Vec2;
    checkpoints: readonly Vec2[];
    rocks: ReadonlySet<string>;
    blockedTowerCells: ReadonlySet<string>;
}
export declare function createMazeLayout(boardW: number, boardH: number, spawnCell: Vec2, goalCell: Vec2, rocks?: Iterable<Vec2>, blockedTowerCells?: Iterable<Vec2>, checkpoints?: readonly Vec2[]): MazeLayout;
export declare function isBlockedCell(layout: MazeLayout, q: number, r: number): boolean;
/**
 * GemTD diagonal squeeze rule: two diagonally opposed blockers pinch the shared
 * orthogonal neighbor cells closed even though no rock sits on those cells.
 */
export declare function isSqueezeGapCell(layout: MazeLayout, q: number, r: number): boolean;
export declare function isWalkableCell(layout: MazeLayout, q: number, r: number): boolean;
export declare function hasValidPath(layout: MazeLayout): boolean;
export declare function hasValidCheckpointPath(layout: MazeLayout): boolean;
export declare function buildMazePathNav(layout: MazeLayout): PathNavData;
export declare function canPlaceRock(layout: MazeLayout, q: number, r: number): boolean;
export declare function rockRefundPercent(rocksPlaced: number): number;
