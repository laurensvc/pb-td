import { describe, expect, it } from 'vitest';
import {
  buildMazePathNav,
  canPlaceRock,
  createMazeLayout,
  hasValidPath,
  rockRefundPercent,
} from './maze';

const spawn = { x: 0, y: 0 };
const goal = { x: 4, y: 0 };

describe('maze', () => {
  it('finds a path on an open 5x5 board', () => {
    const layout = createMazeLayout(5, 5, spawn, goal);
    expect(hasValidPath(layout)).toBe(true);
    const nav = buildMazePathNav(layout);
    expect(nav.pathCells.has('0,0')).toBe(true);
    expect(nav.pathCells.has('4,0')).toBe(true);
  });

  it('rejects rocks that fully block spawn from goal', () => {
    const layout = createMazeLayout(3, 3, spawn, goal, [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ]);
    expect(hasValidPath(layout)).toBe(false);
  });

  it('allows maze rocks that lengthen but preserve a route', () => {
    const layout = createMazeLayout(5, 5, spawn, goal, [{ x: 0, y: 1 }]);
    expect(hasValidPath(layout)).toBe(true);
    expect(canPlaceRock(layout, 2, 1)).toBeTypeOf('boolean');
  });

  it('blocks rock placement on spawn or goal', () => {
    const layout = createMazeLayout(5, 5, spawn, goal);
    expect(canPlaceRock(layout, 0, 0)).toBe(false);
    expect(canPlaceRock(layout, 4, 0)).toBe(false);
  });

  it('treats tower cells as blocked for pathing', () => {
    const layout = createMazeLayout(5, 5, spawn, goal, [], [{ x: 2, y: 0 }]);
    const nav = buildMazePathNav(layout);
    expect(nav.pathCells.has('2,0')).toBe(false);
    expect(hasValidPath(layout)).toBe(true);
  });

  it('escalates rock sell refund decay', () => {
    expect(rockRefundPercent(0)).toBe(1);
    expect(rockRefundPercent(1)).toBe(0.85);
    expect(rockRefundPercent(99)).toBe(0.25);
  });
});
