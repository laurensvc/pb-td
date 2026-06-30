import { landmarkCenter } from '@facet/content';
import { gridToWorldCenter } from '../board/coordinates.js';
function segmentLength(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.hypot(dx, dy);
}
function concatFlyingNodes(board, nodeIds) {
    const points = [];
    for (const nodeId of nodeIds) {
        const center = landmarkCenter(board, nodeId);
        const world = gridToWorldCenter(center.gx, center.gy);
        const last = points[points.length - 1];
        if (last && last.x === world.x && last.y === world.y)
            continue;
        points.push(world);
    }
    return points;
}
export function buildFlyingPath(board, routeId) {
    const route = board.routes.find((r) => r.id === routeId);
    if (!route)
        throw new Error(`Unknown route: ${routeId}`);
    const worldPoints = concatFlyingNodes(board, route.flyingNodes);
    let totalLength = 0;
    for (let i = 1; i < worldPoints.length; i++) {
        totalLength += segmentLength(worldPoints[i - 1], worldPoints[i]);
    }
    return { worldPoints, totalLength };
}
