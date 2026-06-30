import type { Vec2 } from './types';
/** Orthogonal square grid in integer cell coordinates (q, r) stored as Vec2.x / Vec2.y. */
export declare const HEX_SQRT3 = 1;
/** World-space distance between centers of adjacent cells (used for ranges). */
export declare const HEX_NEIGHBOR_DIST = 1;
export declare function hexKey(q: number, r: number): string;
export declare function parseHexKey(key: string): Vec2;
export declare function isOnBoard(q: number, r: number, boardW: number, boardH: number): boolean;
export declare function hexNeighbors(q: number, r: number): Vec2[];
export declare function hexAreAdjacent(a: Vec2, b: Vec2): boolean;
export declare function hexDistance(q0: number, r0: number, q1: number, r1: number): number;
/** Continuous world position of a cell center (adjacent centers are 1 unit apart). */
export declare function hexWorldCenter(q: number, r: number): Vec2;
export declare function worldToHex(x: number, y: number): Vec2;
export declare function hexRound(q: number, r: number): Vec2;
export declare function allBoardCells(boardW: number, boardH: number): Vec2[];
/** Grid cells along a straight line between endpoints (Bresenham). */
export declare function hexLine(a: Vec2, b: Vec2): Vec2[];
export declare function hexLineKeys(a: Vec2, b: Vec2): Set<string>;
/** Pixel center for a square tile. */
export declare function hexPixelCenter(q: number, r: number, tileSize: number): Vec2;
/** Pixel outline corners for a square tile (4 points, closed loop). */
export declare function hexPixelCorners(q: number, r: number, tileSize: number): Vec2[];
export declare function pixelToHex(px: number, py: number, tileSize: number): Vec2;
export declare function boardPixelBounds(boardW: number, boardH: number, tileSize: number): {
    width: number;
    height: number;
    padX: number;
    padY: number;
};
/** World units per pixel at a given tile size. */
export declare function worldPerPixel(tileSize: number): number;
