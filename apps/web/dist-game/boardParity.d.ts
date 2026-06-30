import type { Vec2 } from './types';
/** GemTD-style coloring: rocks on one hex parity, gems on the other. */
export type CellParity = 'rock' | 'gem';
export declare function cellParity(q: number, r: number): CellParity;
export declare function acceptsRock(q: number, r: number): boolean;
export declare function acceptsGem(q: number, r: number): boolean;
export declare function isOnBoard(q: number, r: number, boardW: number, boardH: number): boolean;
export declare function parityMatchesPlacement(q: number, r: number, kind: 'rock' | 'gem'): boolean;
export declare function parityCells(boardW: number, boardH: number, parity: CellParity): Vec2[];
/** @deprecated Use parityCells */
export declare const checkerboardCells: typeof parityCells;
