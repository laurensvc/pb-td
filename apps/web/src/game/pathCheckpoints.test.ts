import { describe, expect, it } from 'vitest';
import { resolveCheckpoints } from './pathNav';
import { cellsAlongPath } from './pathBuild';

describe('path checkpoints', () => {
  it('resolves area waypoints to hex cells', () => {
    const path = [
      { x: 0, y: 5 },
      { x: 4, y: 2 },
      { x: 12, y: 2 },
      { x: 12, y: 5 },
      { x: 4, y: 5 },
      { x: 4, y: 8 },
      { x: 15, y: 8 },
    ];
    const cells = cellsAlongPath(path);
    const checkpoints = resolveCheckpoints(path, cells);
    expect(checkpoints).toHaveLength(7);
    expect(checkpoints[0]).toEqual({ x: 0, y: 5 });
    expect(checkpoints[5]).toEqual({ x: 4, y: 8 });
    expect(checkpoints[checkpoints.length - 1]).toEqual({ x: 15, y: 8 });
  });
});
