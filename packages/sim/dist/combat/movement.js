import { computePathProgress } from '../pathfinding/path-progress.js';
import { effectiveSpeedMultiplier } from './status-effects.js';
function segmentLength(ax, ay, bx, by) {
    return Math.hypot(bx - ax, by - by);
}
function advanceAlongPolyline(points, pathIndex, distanceAlongSegment, distance) {
    let idx = pathIndex;
    let along = distanceAlongSegment;
    let remaining = distance;
    while (remaining > 0 && idx < points.length - 1) {
        const from = points[idx];
        const to = points[idx + 1];
        const segLen = segmentLength(from.x, from.y, to.x, to.y);
        if (segLen <= 0) {
            idx += 1;
            along = 0;
            continue;
        }
        const left = segLen - along;
        if (remaining < left) {
            along += remaining;
            const t = along / segLen;
            return {
                pathIndex: idx,
                distanceAlongSegment: along,
                worldPos: {
                    x: from.x + (to.x - from.x) * t,
                    y: from.y + (to.y - from.y) * t,
                },
            };
        }
        remaining -= left;
        idx += 1;
        along = 0;
    }
    const end = points[points.length - 1];
    return {
        pathIndex: Math.max(0, points.length - 2),
        distanceAlongSegment: segmentLength(points[points.length - 2]?.x ?? end.x, points[points.length - 2]?.y ?? end.y, end.x, end.y),
        worldPos: { x: end.x, y: end.y },
    };
}
export function advanceGroundCreep(creep, pathCache, dt) {
    const speed = creep.baseSpeed * effectiveSpeedMultiplier(creep);
    const points = pathCache.worldConcatenated;
    if (points.length < 2)
        return true;
    const result = advanceAlongPolyline(points, creep.pathIndex, creep.distanceAlongSegment, speed * dt);
    creep.pathIndex = result.pathIndex;
    creep.distanceAlongSegment = result.distanceAlongSegment;
    creep.worldPos = result.worldPos;
    const leg = findLegForPathIndex(pathCache, creep.pathIndex);
    creep.legIndex = leg.legIndex;
    creep.pathProgress = computePathProgress(leg.legIndex, leg.pathIndex, creep.distanceAlongSegment, pathCache.legStartIndex);
    const atEnd = creep.pathIndex >= points.length - 2 &&
        creep.distanceAlongSegment >=
            segmentLength(points[points.length - 2].x, points[points.length - 2].y, points[points.length - 1].x, points[points.length - 1].y) -
                0.01;
    return atEnd;
}
export function advanceFlyingCreep(creep, flyingPath, dt) {
    const speed = creep.baseSpeed * effectiveSpeedMultiplier(creep);
    const points = flyingPath.worldPoints;
    if (points.length < 2)
        return true;
    const result = advanceAlongPolyline(points, creep.pathIndex, creep.distanceAlongSegment, speed * dt);
    creep.pathIndex = result.pathIndex;
    creep.distanceAlongSegment = result.distanceAlongSegment;
    creep.worldPos = result.worldPos;
    creep.legIndex = 0;
    creep.pathProgress =
        creep.pathIndex +
            creep.distanceAlongSegment /
                Math.max(1, segmentLength(points[creep.pathIndex]?.x ?? 0, points[creep.pathIndex]?.y ?? 0, points[creep.pathIndex + 1]?.x ?? 0, points[creep.pathIndex + 1]?.y ?? 0));
    const lastSeg = segmentLength(points[points.length - 2].x, points[points.length - 2].y, points[points.length - 1].x, points[points.length - 1].y);
    return creep.pathIndex >= points.length - 2 && creep.distanceAlongSegment >= lastSeg - 0.01;
}
function findLegForPathIndex(cache, pathIndex) {
    for (let i = cache.legStartIndex.length - 1; i >= 0; i--) {
        const start = cache.legStartIndex[i];
        if (pathIndex >= start) {
            return { legIndex: i, pathIndex: pathIndex - start };
        }
    }
    return { legIndex: 0, pathIndex };
}
export function initCreepPosition(creep, pathCache, flyingPath) {
    if (creep.mobility === 'flying' && flyingPath) {
        const start = flyingPath.worldPoints[0];
        creep.worldPos = { x: start.x, y: start.y };
        creep.pathIndex = 0;
        creep.distanceAlongSegment = 0;
        creep.pathProgress = 0;
        return;
    }
    if (pathCache && pathCache.worldConcatenated.length > 0) {
        const start = pathCache.worldConcatenated[0];
        creep.worldPos = { x: start.x, y: start.y };
        creep.pathIndex = 0;
        creep.distanceAlongSegment = 0;
        creep.legIndex = 0;
        creep.pathProgress = 0;
    }
}
