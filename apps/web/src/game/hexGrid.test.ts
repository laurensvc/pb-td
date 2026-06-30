import { describe, expect, it } from 'vitest';
import {
  hexAreAdjacent,
  hexDistance,
  hexKey,
  hexLine,
  hexNeighbors,
  hexWorldCenter,
  pixelToHex,
  worldToHex,
} from './hexGrid';

describe('hexGrid', () => {
  it('has six neighbors per cell', () => {
    expect(hexNeighbors(3, 4)).toHaveLength(6);
  });

  it('measures hex distance correctly', () => {
    expect(hexDistance(0, 0, 1, 0)).toBe(1);
    expect(hexDistance(0, 0, 0, 1)).toBe(1);
    expect(hexDistance(0, 0, 2, 0)).toBe(2);
  });

  it('detects adjacent hexes', () => {
    expect(hexAreAdjacent({ x: 2, y: 5 }, { x: 3, y: 5 })).toBe(true);
    expect(hexAreAdjacent({ x: 2, y: 5 }, { x: 4, y: 5 })).toBe(false);
  });

  it('round-trips world and axial coords', () => {
    const cell = { x: 4, y: 3 };
    const world = hexWorldCenter(cell.x, cell.y);
    expect(worldToHex(world.x, world.y)).toEqual(cell);
  });

  it('draws a hex line between endpoints', () => {
    const line = hexLine({ x: 0, y: 5 }, { x: 10, y: 5 });
    expect(line.length).toBeGreaterThan(5);
    expect(hexKey(line[0]!.x, line[0]!.y)).toBe('0,5');
    expect(hexKey(line[line.length - 1]!.x, line[line.length - 1]!.y)).toBe('10,5');
  });

  it('maps pixel clicks back to hex cells', () => {
    const radius = 24;
    const cell = { x: 3, y: 2 };
    const center = { x: radius * Math.sqrt(3) * (cell.x + cell.y / 2), y: radius * 1.5 * cell.y };
    expect(pixelToHex(center.x, center.y, radius)).toEqual(cell);
  });
});
