import { hexDistance, hexKey, hexLine, hexWorldCenter, isOnBoard, worldToHex } from './hexGrid';
export const BUILD_ZONE_RADIUS = 2.0;
export const cellKey = hexKey;
/** Hex cells whose centers lie on a line between waypoints. */
export function cellsAlongPath(path) {
    const cells = new Set();
    for (let i = 0; i < path.length - 1; i++) {
        for (const cell of hexLine(path[i], path[i + 1])) {
            cells.add(cellKey(cell.x, cell.y));
        }
    }
    return cells;
}
export function isOnPath(x, y, pathCells) {
    const cell = worldToHex(x, y);
    return pathCells.has(cellKey(cell.x, cell.y));
}
export function isInBuildZone(x, y, pathCells, boardW, boardH, radius = BUILD_ZONE_RADIUS) {
    const cell = worldToHex(x, y);
    if (!isOnBoard(cell.x, cell.y, boardW, boardH))
        return false;
    if (isOnPath(x, y, pathCells))
        return false;
    return minDistanceToPath(cell.x, cell.y, pathCells) <= radius;
}
export function buildZoneCells(pathCells, boardW, boardH, radius = BUILD_ZONE_RADIUS) {
    const cells = [];
    for (let r = 0; r < boardH; r++) {
        for (let q = 0; q < boardW; q++) {
            const center = hexWorldCenter(q, r);
            if (isInBuildZone(center.x, center.y, pathCells, boardW, boardH, radius)) {
                cells.push({ x: q, y: r });
            }
        }
    }
    cells.sort((a, b) => a.y - b.y || a.x - b.x);
    return cells;
}
function minDistanceToPath(q, r, pathCells) {
    let min = Infinity;
    for (const key of pathCells) {
        const [pq, pr] = key.split(',').map(Number);
        const dist = hexDistance(q, r, pq, pr);
        if (dist < min)
            min = dist;
    }
    return min;
}
