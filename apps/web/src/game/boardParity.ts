import type { Vec2 } from './types';

/** GemTD-style checkerboard: rocks on dark cells, gems on light cells. */
export type CellParity = 'rock' | 'gem';

export function cellParity(x: number, y: number): CellParity {
  return (x + y) % 2 === 0 ? 'rock' : 'gem';
}

export function acceptsRock(x: number, y: number): boolean {
  return cellParity(x, y) === 'rock';
}

export function acceptsGem(x: number, y: number): boolean {
  return cellParity(x, y) === 'gem';
}

export function isOnBoard(x: number, y: number, boardW: number, boardH: number): boolean {
  return x >= 0 && y >= 0 && x < boardW && y < boardH;
}

export function parityMatchesPlacement(x: number, y: number, kind: 'rock' | 'gem'): boolean {
  return kind === 'rock' ? acceptsRock(x, y) : acceptsGem(x, y);
}

export function checkerboardCells(boardW: number, boardH: number, parity: CellParity): Vec2[] {
  const cells: Vec2[] = [];
  for (let y = 0; y < boardH; y++) {
    for (let x = 0; x < boardW; x++) {
      if (cellParity(x, y) === parity) cells.push({ x, y });
    }
  }
  return cells;
}
