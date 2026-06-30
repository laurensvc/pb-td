import { cellsAlongPath, cellKey } from './pathBuild';
import { hexKey, hexNeighbors, hexWorldCenter } from './hexGrid';
export const LEAK_EPSILON = 0.15;
export function resolveCheckpoints(path, pathCells) {
    const deduped = [];
    for (const point of path) {
        let cp = { x: Math.round(point.x), y: Math.round(point.y) };
        if (!pathCells.has(cellKey(cp.x, cp.y))) {
            cp = nearestPathCell(point.x, point.y, pathCells);
        }
        const last = deduped[deduped.length - 1];
        if (last && cellKey(last.x, last.y) === cellKey(cp.x, cp.y))
            continue;
        deduped.push(cp);
    }
    return deduped;
}
export function buildPathNav(path) {
    const pathCells = cellsAlongPath(path);
    const checkpoints = resolveCheckpoints(path, pathCells);
    const goalCell = checkpoints[checkpoints.length - 1] ?? nearestPathCell(path[path.length - 1].x, path[path.length - 1].y, pathCells);
    const spawnCell = checkpoints[0] ?? nearestPathCell(path[0].x, path[0].y, pathCells);
    const distanceToGoal = bfsDistanceFromCell(pathCells, goalCell);
    const checkpointDistances = checkpoints.map((cp) => bfsDistanceFromCell(pathCells, cp));
    let maxDist = 0;
    for (const dist of distanceToGoal.values()) {
        maxDist = Math.max(maxDist, dist);
    }
    return {
        pathCells,
        distanceToGoal,
        checkpointDistances,
        maxProgress: maxDist,
        goalCell,
        spawnCell,
        checkpoints,
    };
}
export function nearestPathCell(x, y, pathCells) {
    let best;
    let bestDist = Infinity;
    for (const key of pathCells) {
        const [cx, cy] = key.split(',').map(Number);
        const center = hexWorldCenter(cx, cy);
        const dist = Math.hypot(center.x - x, center.y - y);
        if (dist < bestDist) {
            bestDist = dist;
            best = { x: cx, y: cy };
        }
    }
    return best ?? { x: 0, y: 0 };
}
export function pathProgressAt(nav, x, y) {
    const cell = nearestPathCell(x, y, nav.pathCells);
    const dist = nav.distanceToGoal.get(cellKey(cell.x, cell.y)) ?? nav.maxProgress;
    return nav.maxProgress - dist;
}
function cellsMatch(a, b) {
    return a.x === b.x && a.y === b.y;
}
export function stepEnemyOnPath(enemy, nav, dt) {
    let targetIdx = Math.min(enemy.checkpointIndex, nav.checkpoints.length - 1);
    const cell = nearestPathCell(enemy.x, enemy.y, nav.pathCells);
    const targetCell = nav.checkpoints[targetIdx];
    if (cellsMatch(cell, targetCell)) {
        if (targetIdx >= nav.checkpoints.length - 1) {
            return 'leaked';
        }
        enemy.checkpointIndex = targetIdx + 1;
        targetIdx = enemy.checkpointIndex;
    }
    const distMap = nav.checkpointDistances[targetIdx] ?? nav.distanceToGoal;
    const currentKey = cellKey(cell.x, cell.y);
    const distToTarget = distMap.get(currentKey) ?? Infinity;
    if (distToTarget === Infinity) {
        return 'moving';
    }
    let nextCell = cell;
    let bestDist = distToTarget;
    for (const neighbor of hexNeighbors(cell.x, cell.y)) {
        const neighborKey = hexKey(neighbor.x, neighbor.y);
        if (!nav.pathCells.has(neighborKey))
            continue;
        const neighborDist = distMap.get(neighborKey) ?? Infinity;
        if (neighborDist < bestDist) {
            bestDist = neighborDist;
            nextCell = neighbor;
        }
    }
    const nextCenter = hexWorldCenter(nextCell.x, nextCell.y);
    const dx = nextCenter.x - enemy.x;
    const dy = nextCenter.y - enemy.y;
    const segmentLength = Math.hypot(dx, dy) || 0.001;
    const travel = enemy.speed * dt;
    if (travel >= segmentLength) {
        enemy.x = nextCenter.x;
        enemy.y = nextCenter.y;
    }
    else {
        enemy.x += (dx / segmentLength) * travel;
        enemy.y += (dy / segmentLength) * travel;
    }
    const updatedCell = nearestPathCell(enemy.x, enemy.y, nav.pathCells);
    const updatedDist = distMap.get(cellKey(updatedCell.x, updatedCell.y)) ?? distToTarget;
    enemy.pathProgress = nav.maxProgress - updatedDist;
    const finalTarget = nav.checkpoints[nav.checkpoints.length - 1];
    if (enemy.checkpointIndex >= nav.checkpoints.length - 1 &&
        cellsMatch(updatedCell, finalTarget)) {
        const goalCenter = hexWorldCenter(finalTarget.x, finalTarget.y);
        if (Math.hypot(enemy.x - goalCenter.x, enemy.y - goalCenter.y) <= LEAK_EPSILON) {
            return 'leaked';
        }
    }
    return 'moving';
}
export function bfsDistanceFromCell(pathCells, origin) {
    const distances = new Map();
    const originKey = cellKey(origin.x, origin.y);
    if (!pathCells.has(originKey))
        return distances;
    const queue = [{ ...origin }];
    distances.set(originKey, 0);
    while (queue.length > 0) {
        const current = queue.shift();
        const currentKey = cellKey(current.x, current.y);
        const currentDist = distances.get(currentKey) ?? 0;
        for (const neighbor of hexNeighbors(current.x, current.y)) {
            const neighborKey = hexKey(neighbor.x, neighbor.y);
            if (!pathCells.has(neighborKey) || distances.has(neighborKey))
                continue;
            distances.set(neighborKey, currentDist + 1);
            queue.push(neighbor);
        }
    }
    return distances;
}
