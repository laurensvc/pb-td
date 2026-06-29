import { describe, expect, it } from 'vitest';
import {
  boardToScreen,
  cellCenter,
  cellToScreen,
  computeLayout,
  screenToCell,
} from './boardCoords';

describe('boardCoords', () => {
  const layout = computeLayout(1280, 800);

  it('maps screen clicks to the cell under the cursor', () => {
    const cell = { x: 3, y: 6 };
    const center = cellToScreen(layout, cell);
    expect(screenToCell(layout, center.x, center.y)).toEqual(cell);
  });

  it('does not double-offset fractional gem positions', () => {
    const gem = { x: 2.5, y: 5.5 };
    const screen = boardToScreen(layout, gem);
    const cell = screenToCell(layout, screen.x, screen.y);
    expect(cell).toEqual({ x: 2, y: 5 });
  });

  it('round-trips integer rock cells through cellToScreen', () => {
    const rock = { x: 4, y: 2 };
    const screen = cellToScreen(layout, rock);
    expect(screenToCell(layout, screen.x, screen.y)).toEqual(rock);
  });

  it('cellCenter matches engine placement coords', () => {
    expect(cellCenter({ x: 2, y: 5 })).toEqual({ x: 2.5, y: 5.5 });
  });
});
