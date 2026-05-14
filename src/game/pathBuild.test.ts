import { describe, expect, it } from 'vitest';
import { borderBuildSlots, cellsAlongPath } from './pathBuild';

describe('cellsAlongPath', () => {
  it('collects horizontal and vertical segment cells', () => {
    const path = [
      { x: 0, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 3 },
    ];
    const cells = cellsAlongPath(path);
    expect(cells.has('0,1')).toBe(true);
    expect(cells.has('1,1')).toBe(true);
    expect(cells.has('2,1')).toBe(true);
    expect(cells.has('2,2')).toBe(true);
    expect(cells.has('2,3')).toBe(true);
    expect(cells.size).toBe(5);
  });

  it('dedupes the shared corner between segments', () => {
    const path = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
    ];
    const cells = cellsAlongPath(path);
    expect(cells.size).toBe(3);
  });
});

describe('borderBuildSlots', () => {
  it('excludes path cells and includes only orthogonal neighbors inside the board', () => {
    const path = [
      { x: 1, y: 1 },
      { x: 3, y: 1 },
    ];
    const slots = borderBuildSlots(path, 5, 4);
    const set = new Set(slots.map((p) => `${p.x},${p.y}`));
    expect(set.has('1,1')).toBe(false);
    expect(set.has('2,1')).toBe(false);
    expect(set.has('0,1')).toBe(true);
    expect(set.has('4,1')).toBe(true);
    expect(set.has('1,0')).toBe(true);
    expect(set.has('1,2')).toBe(true);
    expect(set.has('2,0')).toBe(true);
    expect(set.has('2,2')).toBe(true);
    expect(set.has('3,0')).toBe(true);
    expect(set.has('3,2')).toBe(true);
  });

  it('sorts by y then x for stable slot indices', () => {
    const path = [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
    ];
    const slots = borderBuildSlots(path, 4, 3);
    for (let i = 1; i < slots.length; i++) {
      const a = slots[i - 1];
      const b = slots[i];
      expect(a.y < b.y || (a.y === b.y && a.x <= b.x)).toBe(true);
    }
  });

  it('does not add slots outside the board for edge path', () => {
    const path = [
      { x: 0, y: 0 },
      { x: 0, y: 2 },
    ];
    const slots = borderBuildSlots(path, 3, 3);
    for (const p of slots) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThan(3);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThan(3);
    }
    expect(slots.some((p) => p.x === 0 && p.y === 0)).toBe(false);
    expect(slots.some((p) => p.x === 0 && p.y === 1)).toBe(false);
    expect(slots.some((p) => p.x === 0 && p.y === 2)).toBe(false);
  });
});
