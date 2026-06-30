import { describe, expect, it } from 'vitest';
import { BOARD_HEIGHT, BOARD_WIDTH } from '../game/content';
import { hexWorldCenter } from '../game/hexGrid';
import { boardToScreen, computeLayout, screenToCell, rangeToPixels } from './boardCoords';

describe('boardCoords hex layout', () => {
  const layout = computeLayout(800, 600);

  it('maps hex cell center to screen inside canvas', () => {
    const center = hexWorldCenter(4, 4);
    const screen = boardToScreen(layout, center);
    expect(screen.x).toBeGreaterThan(0);
    expect(screen.x).toBeLessThan(800);
    expect(screen.y).toBeGreaterThan(0);
    expect(screen.y).toBeLessThan(600);
  });

  it('round-trips hex cell through pixel mapping', () => {
    const cell = { x: 3, y: 5 };
    const screen = boardToScreen(layout, hexWorldCenter(cell.x, cell.y));
    const back = screenToCell(layout, screen.x, screen.y);
    expect(back).toEqual(cell);
  });

  it('converts hex range to pixel radius', () => {
    expect(rangeToPixels(layout, 1)).toBeGreaterThan(0);
  });

  it('fits the full hex board in layout bounds', () => {
    expect(layout.width).toBeGreaterThan(0);
    expect(layout.height).toBeGreaterThan(0);
    expect(layout.hexRadius).toBeGreaterThan(8);
    const corner = screenToCell(layout, layout.left + layout.width / 2, layout.top + layout.height / 2);
    expect(corner).not.toBeNull();
    expect(corner!.x).toBeGreaterThanOrEqual(0);
    expect(corner!.x).toBeLessThan(BOARD_WIDTH);
    expect(corner!.y).toBeGreaterThanOrEqual(0);
    expect(corner!.y).toBeLessThan(BOARD_HEIGHT);
  });
});
