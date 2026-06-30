import { gridToWorldCenter } from '../board/coordinates.js';
import { findLegPath } from './astar.js';
function concatLegs(legs) {
    const concatenated = [];
    const legStartIndex = [];
    let totalLength = 0;
    for (let i = 0; i < legs.length; i++) {
        const leg = legs[i];
        legStartIndex.push(concatenated.length);
        if (leg.length === 0)
            continue;
        if (concatenated.length === 0) {
            concatenated.push(...leg);
        }
        else {
            const last = concatenated[concatenated.length - 1];
            const first = leg[0];
            if (last.gx === first.gx && last.gy === first.gy) {
                concatenated.push(...leg.slice(1));
            }
            else {
                concatenated.push(...leg);
            }
        }
        if (leg.length > 1) {
            totalLength += leg.length - 1;
        }
    }
    return { concatenated, legStartIndex, totalLength };
}
function toWorldPath(path) {
    return path.map((c) => gridToWorldCenter(c.gx, c.gy));
}
export function buildPathCache(board, sim, routeId) {
    const route = board.routes.find((r) => r.id === routeId);
    if (!route)
        throw new Error(`Unknown route: ${routeId}`);
    const legs = [];
    for (const leg of route.groundLegs) {
        const path = findLegPath(board, sim, leg.from, leg.to);
        if (!path)
            return null;
        legs.push(path);
    }
    const { concatenated, legStartIndex, totalLength } = concatLegs(legs);
    return {
        version: sim.mazeVersion,
        routeId,
        legs,
        worldLegs: legs.map(toWorldPath),
        concatenated,
        worldConcatenated: toWorldPath(concatenated),
        legStartIndex,
        totalLength,
    };
}
export function isPathCacheValid(cache, sim) {
    return cache.version === sim.mazeVersion;
}
export function ensurePathCache(board, sim, routeId, current) {
    if (current && isPathCacheValid(current, sim) && current.routeId === routeId) {
        return current;
    }
    return buildPathCache(board, sim, routeId);
}
