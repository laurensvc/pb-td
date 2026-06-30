import { describe, expect, it } from 'vitest';
import { hexWorldCenter } from './hexGrid';
import { cellsAlongPath, isInBuildZone } from './pathBuild';

describe('pathBuild hex', () => {
  const path = [
    { x: 0, y: 5 },
    { x: 10, y: 5 },
    { x: 10, y: 8 },
    { x: 15, y: 8 },
  ];

  it('builds a path through hex cells', () => {
    const pathCells = cellsAlongPath(path);
    expect(pathCells.has('0,5')).toBe(true);
    expect(pathCells.has('15,8')).toBe(true);
    expect(pathCells.size).toBeGreaterThan(10);
  });

  it('marks nearby hexes as build zone', () => {
    const pathCells = cellsAlongPath(path);
    const nearPath = hexWorldCenter(2, 4);
    const onPath = hexWorldCenter(0, 5);
    expect(isInBuildZone(nearPath.x, nearPath.y, pathCells, 16, 10)).toBe(true);
    expect(isInBuildZone(onPath.x, onPath.y, pathCells, 16, 10)).toBe(false);
  });
});
