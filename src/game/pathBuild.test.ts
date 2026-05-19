import { describe, expect, it } from 'vitest';
import { cellsAlongPath, isInBuildZone, isOnPath } from './pathBuild';

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

describe('build zone', () => {
  const path = [
    { x: 1, y: 1 },
    { x: 3, y: 1 },
  ];
  const pathCells = cellsAlongPath(path);

  it('marks path cells as on-path', () => {
    expect(isOnPath(2, 1, pathCells)).toBe(true);
    expect(isOnPath(1.2, 1.1, pathCells)).toBe(true);
  });

  it('allows placement beside the path inside the radius', () => {
    expect(isInBuildZone(1, 0, pathCells, 5, 4)).toBe(true);
    expect(isInBuildZone(2, 2, pathCells, 5, 4)).toBe(true);
  });

  it('rejects on-path and far-away points', () => {
    expect(isInBuildZone(2, 1, pathCells, 5, 4)).toBe(false);
    expect(isInBuildZone(0, 3.5, pathCells, 5, 4)).toBe(false);
  });
});
