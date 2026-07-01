import { GEM_FOOTPRINT } from '../constants.js';
export function footprintCells(gx, gy, size = GEM_FOOTPRINT) {
    const cells = [];
    for (let dy = 0; dy < size; dy++) {
        for (let dx = 0; dx < size; dx++) {
            cells.push({ gx: gx + dx, gy: gy + dy });
        }
    }
    return cells;
}
export function isEvenAlignedFootprint(gx, gy) {
    return gx % 2 === 0 && gy % 2 === 0;
}
export function footprintInBounds(gx, gy, width, height, size = GEM_FOOTPRINT) {
    return gx >= 0 && gy >= 0 && gx + size <= width && gy + size <= height;
}
export function footprintsOverlap(aGx, aGy, bGx, bGy, size = GEM_FOOTPRINT) {
    return !(aGx + size <= bGx || bGx + size <= aGx || aGy + size <= bGy || bGy + size <= aGy);
}
