import { cellKey } from './pathBuild';
import { hexKey, hexNeighbors, isOnBoard as hexIsOnBoard } from './hexGrid';
export function createMazeLayout(boardW, boardH, spawnCell, goalCell, rocks = [], blockedTowerCells = [], checkpoints = [spawnCell, goalCell]) {
    return {
        boardW,
        boardH,
        spawnCell: { ...spawnCell },
        goalCell: { ...goalCell },
        checkpoints: checkpoints.map((cp) => ({ ...cp })),
        rocks: new Set([...rocks].map((c) => cellKey(c.x, c.y))),
        blockedTowerCells: new Set([...blockedTowerCells].map((c) => cellKey(c.x, c.y))),
    };
}
export function isBlockedCell(layout, q, r) {
    const key = cellKey(q, r);
    return layout.rocks.has(key) || layout.blockedTowerCells.has(key);
}
/**
 * GemTD diagonal squeeze rule: two diagonally opposed blockers pinch the shared
 * orthogonal neighbor cells closed even though no rock sits on those cells.
 */
export function isSqueezeGapCell(layout, q, r) {
    if (!hexIsOnBoard(q, r, layout.boardW, layout.boardH))
        return false;
    const selfKey = cellKey(q, r);
    if (selfKey === cellKey(layout.spawnCell.x, layout.spawnCell.y))
        return false;
    if (selfKey === cellKey(layout.goalCell.x, layout.goalCell.y))
        return false;
    for (const cp of layout.checkpoints) {
        if (selfKey === cellKey(cp.x, cp.y))
            return false;
    }
    if (isBlockedCell(layout, q, r))
        return false;
    const blockedNeighbors = [];
    for (const neighbor of hexNeighbors(q, r)) {
        if (isBlockedCell(layout, neighbor.x, neighbor.y)) {
            blockedNeighbors.push(neighbor);
        }
    }
    for (let i = 0; i < blockedNeighbors.length; i++) {
        for (let j = i + 1; j < blockedNeighbors.length; j++) {
            const a = blockedNeighbors[i];
            const b = blockedNeighbors[j];
            if (Math.abs(a.x - b.x) === 1 && Math.abs(a.y - b.y) === 1)
                return true;
        }
    }
    return false;
}
export function isWalkableCell(layout, q, r) {
    if (!hexIsOnBoard(q, r, layout.boardW, layout.boardH))
        return false;
    const key = cellKey(q, r);
    if (key === cellKey(layout.spawnCell.x, layout.spawnCell.y))
        return true;
    if (key === cellKey(layout.goalCell.x, layout.goalCell.y))
        return true;
    if (isBlockedCell(layout, q, r))
        return false;
    if (isSqueezeGapCell(layout, q, r))
        return false;
    return true;
}
export function hasValidPath(layout) {
    return hasValidCheckpointPath(layout);
}
export function hasValidCheckpointPath(layout) {
    if (layout.checkpoints.length < 2)
        return false;
    for (let i = 0; i < layout.checkpoints.length - 1; i++) {
        const from = layout.checkpoints[i];
        const to = layout.checkpoints[i + 1];
        if (!canReachCheckpoint(layout, from, to))
            return false;
    }
    return true;
}
export function buildMazePathNav(layout) {
    const pathCells = new Set();
    const distanceToGoal = bfsDistanceToGoal(layout);
    for (const key of distanceToGoal.keys()) {
        pathCells.add(key);
    }
    const checkpointDistances = layout.checkpoints.map((cp) => {
        const distances = bfsDistanceFromWalkable(layout, cp);
        for (const key of distances.keys()) {
            pathCells.add(key);
        }
        return distances;
    });
    let maxProgress = 0;
    for (const dist of distanceToGoal.values()) {
        maxProgress = Math.max(maxProgress, dist);
    }
    return {
        pathCells,
        distanceToGoal,
        checkpointDistances,
        maxProgress,
        goalCell: { ...layout.goalCell },
        spawnCell: { ...layout.spawnCell },
        checkpoints: layout.checkpoints.map((cp) => ({ ...cp })),
    };
}
export function canPlaceRock(layout, q, r) {
    const key = cellKey(q, r);
    if (layout.rocks.has(key))
        return false;
    for (const cp of layout.checkpoints) {
        if (key === cellKey(cp.x, cp.y))
            return false;
    }
    const trial = createMazeLayout(layout.boardW, layout.boardH, layout.spawnCell, layout.goalCell, [...keysToVec2(layout.rocks), { x: q, y: r }], keysToVec2(layout.blockedTowerCells), layout.checkpoints);
    return hasValidCheckpointPath(trial);
}
export function rockRefundPercent(rocksPlaced) {
    const table = [1, 0.85, 0.7, 0.55, 0.4];
    if (rocksPlaced < table.length)
        return table[rocksPlaced];
    return 0.25;
}
function canReachCheckpoint(layout, from, to) {
    const distances = bfsDistanceFromWalkable(layout, from);
    return distances.has(cellKey(to.x, to.y));
}
function bfsDistanceFromWalkable(layout, origin) {
    const distances = new Map();
    const originKey = cellKey(origin.x, origin.y);
    if (!isWalkableCell(layout, origin.x, origin.y))
        return distances;
    const queue = [{ ...origin }];
    distances.set(originKey, 0);
    while (queue.length > 0) {
        const current = queue.shift();
        const currentKey = cellKey(current.x, current.y);
        const currentDist = distances.get(currentKey) ?? 0;
        for (const neighbor of hexNeighbors(current.x, current.y)) {
            const nq = neighbor.x;
            const nr = neighbor.y;
            if (!isWalkableCell(layout, nq, nr))
                continue;
            const neighborKey = hexKey(nq, nr);
            if (distances.has(neighborKey))
                continue;
            distances.set(neighborKey, currentDist + 1);
            queue.push({ x: nq, y: nr });
        }
    }
    return distances;
}
function bfsDistanceToGoal(layout) {
    return bfsDistanceFromWalkable(layout, layout.goalCell);
}
function keysToVec2(keys) {
    return [...keys].map((key) => {
        const [q, r] = key.split(',').map(Number);
        return { x: q, y: r };
    });
}
