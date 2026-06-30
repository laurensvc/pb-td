import { describe, expect, it } from 'vitest';
import { BOARD_HEIGHT, BOARD_WIDTH } from './content';
import { cellParity, parityCells } from './boardParity';

describe('boardParity hex', () => {
  it('splits hex cells into rock and gem parity', () => {
    const rock = parityCells(BOARD_WIDTH, BOARD_HEIGHT, 'rock');
    const gem = parityCells(BOARD_WIDTH, BOARD_HEIGHT, 'gem');
    expect(rock).toHaveLength(80);
    expect(gem).toHaveLength(80);
    expect(rock.length + gem.length).toBe(BOARD_WIDTH * BOARD_HEIGHT);
  });

  it('uses (q+r) mod 2 for parity', () => {
    expect(cellParity(0, 0)).toBe('rock');
    expect(cellParity(1, 0)).toBe('gem');
    expect(parityCells(BOARD_WIDTH, BOARD_HEIGHT, 'rock').some((c) => c.x === 0 && c.y === 0)).toBe(
      true,
    );
    expect(parityCells(BOARD_WIDTH, BOARD_HEIGHT, 'gem').some((c) => c.x === 1 && c.y === 0)).toBe(
      true,
    );
  });
});
