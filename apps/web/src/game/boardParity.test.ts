import { describe, expect, it } from 'vitest';
import {
  acceptsGem,
  acceptsRock,
  cellParity,
  checkerboardCells,
  parityMatchesPlacement,
} from './boardParity';

describe('boardParity', () => {
  it('alternates rock and gem cells', () => {
    expect(cellParity(0, 0)).toBe('rock');
    expect(cellParity(1, 0)).toBe('gem');
    expect(cellParity(0, 1)).toBe('gem');
    expect(cellParity(1, 1)).toBe('rock');
  });

  it('gates placement by parity', () => {
    expect(acceptsRock(0, 0)).toBe(true);
    expect(acceptsGem(0, 0)).toBe(false);
    expect(parityMatchesPlacement(1, 0, 'gem')).toBe(true);
    expect(parityMatchesPlacement(1, 0, 'rock')).toBe(false);
  });

  it('lists half the board per parity on even dimensions', () => {
    expect(checkerboardCells(4, 4, 'rock')).toHaveLength(8);
    expect(checkerboardCells(4, 4, 'gem')).toHaveLength(8);
  });
});
