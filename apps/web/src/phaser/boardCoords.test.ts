import { describe, expect, it } from 'vitest';
import { BOARD_HEIGHT, BOARD_WIDTH } from '../game/content';
import { hexWorldCenter } from '../game/hexGrid';
import {
  boardToScreen,
  clampBoardScroll,
  computeLayout,
  DEFAULT_TILE_SIZE,
  screenToCell,
  rangeToPixels,
  withBoardScroll,
} from './boardCoords';

describe('boardCoords square layout', () => {
  const layout = computeLayout(800, 600);

  it('uses a fixed tile size and a map larger than the viewport', () => {
    expect(layout.tileSize).toBe(DEFAULT_TILE_SIZE);
    expect(layout.mapWidth).toBe(BOARD_WIDTH * DEFAULT_TILE_SIZE);
    expect(layout.mapHeight).toBe(BOARD_HEIGHT * DEFAULT_TILE_SIZE);
    expect(layout.height).toBeLessThan(layout.mapHeight);
  });

  it('maps cell center to screen inside canvas', () => {
    const center = hexWorldCenter(4, 4);
    const screen = boardToScreen(layout, center);
    expect(screen.x).toBeGreaterThan(0);
    expect(screen.x).toBeLessThan(800);
    expect(screen.y).toBeGreaterThan(0);
    expect(screen.y).toBeLessThan(600);
  });

  it('round-trips cell through pixel mapping', () => {
    const cell = { x: 3, y: 5 };
    const screen = boardToScreen(layout, hexWorldCenter(cell.x, cell.y));
    const back = screenToCell(layout, screen.x, screen.y);
    expect(back).toEqual(cell);
  });

  it('converts tile range to pixel radius', () => {
    expect(rangeToPixels(layout, 1)).toBe(layout.tileSize);
  });

  it('clamps scroll inside map bounds', () => {
    const scrolled = withBoardScroll(layout, 9999, -50);
    expect(scrolled.scrollX).toBe(layout.mapWidth - layout.width);
    expect(scrolled.scrollY).toBe(0);
    expect(clampBoardScroll(layout, 10, 10)).toEqual({ scrollX: 10, scrollY: 10 });
  });

  it('fits the viewport over the board grid', () => {
    expect(layout.width).toBeGreaterThan(0);
    expect(layout.height).toBeGreaterThan(0);
    const corner = screenToCell(
      layout,
      layout.left + layout.width / 2,
      layout.top + layout.height / 2,
    );
    expect(corner).not.toBeNull();
    expect(corner!.x).toBeGreaterThanOrEqual(0);
    expect(corner!.x).toBeLessThan(BOARD_WIDTH);
    expect(corner!.y).toBeGreaterThanOrEqual(0);
    expect(corner!.y).toBeLessThan(BOARD_HEIGHT);
  });
});
