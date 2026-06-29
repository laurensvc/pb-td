import { describe, expect, it } from 'vitest';
import { hexWorldCenter } from './hexGrid';
import { areAdjacentGems } from './recipes';

describe('recipes hex adjacency', () => {
  it('allows merge on adjacent hex cells', () => {
    const a = hexWorldCenter(2, 3);
    const b = hexWorldCenter(3, 3);
    expect(areAdjacentGems(a.x, a.y, b.x, b.y)).toBe(true);
  });

  it('rejects non-adjacent hex cells', () => {
    const a = hexWorldCenter(2, 3);
    const b = hexWorldCenter(4, 3);
    expect(areAdjacentGems(a.x, a.y, b.x, b.y)).toBe(false);
  });
});
