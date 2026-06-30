import { allBoardCells } from './hexGrid';
import type { Vec2 } from './types';

/** GemTD-style coloring: rocks on one hex parity, gems on the other. */
export type CellParity = 'rock' | 'gem';

export function cellParity(q: number, r: number): CellParity {
  return (q + r) % 2 === 0 ? 'rock' : 'gem';
}

export function acceptsRock(q: number, r: number): boolean {
  return cellParity(q, r) === 'rock';
}

export function acceptsGem(q: number, r: number): boolean {
  return cellParity(q, r) === 'gem';
}

export function isOnBoard(q: number, r: number, boardW: number, boardH: number): boolean {
  return q >= 0 && r >= 0 && q < boardW && r < boardH;
}

export function parityMatchesPlacement(q: number, r: number, kind: 'rock' | 'gem'): boolean {
  return kind === 'rock' ? acceptsRock(q, r) : acceptsGem(q, r);
}

export function parityCells(boardW: number, boardH: number, parity: CellParity): Vec2[] {
  return allBoardCells(boardW, boardH).filter((cell) => cellParity(cell.x, cell.y) === parity);
}

/** @deprecated Use parityCells */
export const checkerboardCells = parityCells;
