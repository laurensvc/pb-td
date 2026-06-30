import { describe, expect, it } from 'vitest';
import {
  hexAreAdjacent,
  hexDistance,
  hexKey,
  hexLine,
  hexNeighbors,
  hexPixelCenter,
  hexWorldCenter,
  pixelToHex,
  worldToHex,
} from './hexGrid';

describe('square grid', () => {
  it('has four orthogonal neighbors per cell', () => {
    expect(hexNeighbors(3, 4)).toHaveLength(4);
  });

  it('measures Manhattan distance correctly', () => {
    expect(hexDistance(0, 0, 1, 0)).toBe(1);
    expect(hexDistance(0, 0, 0, 1)).toBe(1);
    expect(hexDistance(0, 0, 2, 0)).toBe(2);
    expect(hexDistance(0, 0, 1, 1)).toBe(2);
  });

  it('detects adjacent cells', () => {
    expect(hexAreAdjacent({ x: 2, y: 5 }, { x: 3, y: 5 })).toBe(true);
    expect(hexAreAdjacent({ x: 2, y: 5 }, { x: 4, y: 5 })).toBe(false);
    expect(hexAreAdjacent({ x: 2, y: 5 }, { x: 3, y: 6 })).toBe(false);
  });

  it('round-trips world and cell coords', () => {
    const cell = { x: 4, y: 3 };
    const world = hexWorldCenter(cell.x, cell.y);
    expect(worldToHex(world.x, world.y)).toEqual(cell);
  });

  it('draws a grid line between endpoints', () => {
    const line = hexLine({ x: 0, y: 5 }, { x: 10, y: 5 });
    expect(line.length).toBe(11);
    expect(hexKey(line[0]!.x, line[0]!.y)).toBe('0,5');
    expect(hexKey(line[line.length - 1]!.x, line[line.length - 1]!.y)).toBe('10,5');
  });

  it('maps pixel clicks back to grid cells', () => {
    const tileSize = 32;
    const cell = { x: 3, y: 2 };
    const center = hexPixelCenter(cell.x, cell.y, tileSize);
    expect(pixelToHex(center.x, center.y, tileSize)).toEqual(cell);
  });
});
