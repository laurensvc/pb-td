import { describe, expect, it } from 'vitest';
import { gridToWorldCenter, snapFootprint, worldToGrid } from './coordinates.js';
describe('coordinates', () => {
    it('converts grid center to world', () => {
        expect(gridToWorldCenter(2, 4)).toEqual({ x: 80, y: 144 });
    });
    it('converts world to grid', () => {
        expect(worldToGrid(80, 144)).toEqual({ gx: 2, gy: 4 });
    });
    it('snaps footprint to even alignment', () => {
        expect(snapFootprint(5, 7)).toEqual({ gx: 4, gy: 6 });
        expect(snapFootprint(4, 6)).toEqual({ gx: 4, gy: 6 });
    });
});
