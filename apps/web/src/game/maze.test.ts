import { describe, expect, it } from 'vitest';
import { buildMazePathNav, canPlaceRock, createMazeLayout, hasValidCheckpointPath } from './maze';

describe('maze hex', () => {
  const checkpoints = [
    { x: 0, y: 5 },
    { x: 10, y: 5 },
    { x: 10, y: 8 },
    { x: 15, y: 8 },
  ];
  const spawn = checkpoints[0]!;
  const goal = checkpoints[3]!;

  it('finds a valid hex path through all checkpoints', () => {
    const layout = createMazeLayout(16, 10, spawn, goal, [], [], checkpoints);
    const nav = buildMazePathNav(layout);
    expect(nav.pathCells.size).toBeGreaterThan(0);
    expect(nav.checkpoints).toHaveLength(4);
    expect(nav.distanceToGoal.get('15,8')).toBe(0);
    expect(nav.distanceToGoal.get('0,5')).toBeGreaterThan(0);
    expect(hasValidCheckpointPath(layout)).toBe(true);
  });

  it('blocks rocks that would seal the maze or cover checkpoints', () => {
    const layout = createMazeLayout(16, 10, spawn, goal, [], [], checkpoints);
    expect(canPlaceRock(layout, 5, 5)).toBe(true);
    expect(canPlaceRock(layout, 10, 5)).toBe(false);

    const sealed = createMazeLayout(16, 10, spawn, goal, [{ x: 5, y: 5 }], [], checkpoints);
    expect(hasValidCheckpointPath(sealed)).toBe(true);
    expect(canPlaceRock(sealed, 6, 5)).toBeTypeOf('boolean');
  });
});
