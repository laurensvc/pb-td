/** Orthogonal square grid in integer cell coordinates (q, r) stored as Vec2.x / Vec2.y. */
export const HEX_SQRT3 = 1;
/** World-space distance between centers of adjacent cells (used for ranges). */
export const HEX_NEIGHBOR_DIST = 1;
const ORTHO_NEIGHBORS = [
    { x: 0, y: -1 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
];
export function hexKey(q, r) {
    return `${q},${r}`;
}
export function parseHexKey(key) {
    const [q, r] = key.split(',').map(Number);
    return { x: q, y: r };
}
export function isOnBoard(q, r, boardW, boardH) {
    return q >= 0 && r >= 0 && q < boardW && r < boardH;
}
export function hexNeighbors(q, r) {
    return ORTHO_NEIGHBORS.map((d) => ({ x: q + d.x, y: r + d.y }));
}
export function hexAreAdjacent(a, b) {
    return hexDistance(a.x, a.y, b.x, b.y) === 1;
}
export function hexDistance(q0, r0, q1, r1) {
    return Math.abs(q0 - q1) + Math.abs(r0 - r1);
}
/** Continuous world position of a cell center (adjacent centers are 1 unit apart). */
export function hexWorldCenter(q, r) {
    return { x: q + 0.5, y: r + 0.5 };
}
export function worldToHex(x, y) {
    return { x: Math.floor(x), y: Math.floor(y) };
}
export function hexRound(q, r) {
    return { x: Math.round(q), y: Math.round(r) };
}
export function allBoardCells(boardW, boardH) {
    const cells = [];
    for (let r = 0; r < boardH; r++) {
        for (let q = 0; q < boardW; q++) {
            cells.push({ x: q, y: r });
        }
    }
    return cells;
}
/** Grid cells along a straight line between endpoints (Bresenham). */
export function hexLine(a, b) {
    let x0 = a.x;
    let y0 = a.y;
    const x1 = b.x;
    const y1 = b.y;
    const results = [];
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    while (true) {
        results.push({ x: x0, y: y0 });
        if (x0 === x1 && y0 === y1)
            break;
        const e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            x0 += sx;
        }
        if (e2 < dx) {
            err += dx;
            y0 += sy;
        }
    }
    return results;
}
export function hexLineKeys(a, b) {
    return new Set(hexLine(a, b).map((c) => hexKey(c.x, c.y)));
}
/** Pixel center for a square tile. */
export function hexPixelCenter(q, r, tileSize) {
    return {
        x: (q + 0.5) * tileSize,
        y: (r + 0.5) * tileSize,
    };
}
/** Pixel outline corners for a square tile (4 points, closed loop). */
export function hexPixelCorners(q, r, tileSize) {
    const x0 = q * tileSize;
    const y0 = r * tileSize;
    return [
        { x: x0, y: y0 },
        { x: x0 + tileSize, y: y0 },
        { x: x0 + tileSize, y: y0 + tileSize },
        { x: x0, y: y0 + tileSize },
    ];
}
export function pixelToHex(px, py, tileSize) {
    return {
        x: Math.floor(px / tileSize),
        y: Math.floor(py / tileSize),
    };
}
export function boardPixelBounds(boardW, boardH, tileSize) {
    return {
        width: boardW * tileSize,
        height: boardH * tileSize,
        padX: 0,
        padY: 0,
    };
}
/** World units per pixel at a given tile size. */
export function worldPerPixel(tileSize) {
    return 1 / tileSize;
}
