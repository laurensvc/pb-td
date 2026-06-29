import { describe, expect, it } from 'vitest';
import { buildMazePathNav, canPlaceRock, createMazeLayout, hasValidPath } from './maze';

describe('maze hex', () => {
  const spawn = { x: 0, y: 5 };
  const goal = { x: 15, y: 8 };

  it('finds a valid hex path from spawn to goal', () => {
    const layout = createMazeLayout(16, 10, spawn, goal);
    const nav = buildMazePathNav(layout);
    expect(nav.pathCells.size).toBeGreaterThan(0);
    expect(nav.distanceToGoal.get('0,5')).toBeGreaterThan(0);
    expect(nav.distanceToGoal.get('15,8')).toBe(0);
  });

  it('blocks rocks that would seal the maze', () => {
    const layout = createMazeLayout(16, 10, spawn, goal);
    expect(canPlaceRock(layout, 5, 5)).toBe(true);

    const sealed = createMazeLayout(16, 10, spawn, goal, [{ x: 5, y: 5 }]);
    expect(hasValidPath(sealed)).toBe(true);
    expect(canPlaceRock(sealed, 6, 5)).toBeTypeOf('boolean');
  });
});
