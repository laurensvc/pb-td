import { TILE_SIZE } from '../constants.js';
export function gridToWorldCenter(gx, gy) {
    return {
        x: gx * TILE_SIZE + TILE_SIZE / 2,
        y: gy * TILE_SIZE + TILE_SIZE / 2,
    };
}
export function gridToWorldTopLeft(gx, gy) {
    return { x: gx * TILE_SIZE, y: gy * TILE_SIZE };
}
export function worldToGrid(x, y) {
    return {
        gx: Math.floor(x / TILE_SIZE),
        gy: Math.floor(y / TILE_SIZE),
    };
}
/** Snap hover to 2×2 footprint top-left (even coordinates). */
export function snapFootprint(gx, gy) {
    return {
        gx: Math.floor(gx / 2) * 2,
        gy: Math.floor(gy / 2) * 2,
    };
}
