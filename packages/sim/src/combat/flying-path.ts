import type { BoardDefinition } from '@facet/content'
import { landmarkCenter } from '@facet/content'
import { gridToWorldCenter, type WorldCoord } from '../board/coordinates.js'

export interface FlyingPath {
  worldPoints: WorldCoord[]
  totalLength: number
}

function segmentLength(a: WorldCoord, b: WorldCoord): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  return Math.hypot(dx, dy)
}

function concatFlyingNodes(board: BoardDefinition, nodeIds: string[]): WorldCoord[] {
  const points: WorldCoord[] = []
  for (const nodeId of nodeIds) {
    const center = landmarkCenter(board, nodeId)
    const world = gridToWorldCenter(center.gx, center.gy)
    const last = points[points.length - 1]
    if (last && last.x === world.x && last.y === world.y) continue
    points.push(world)
  }
  return points
}

export function buildFlyingPath(board: BoardDefinition, routeId: string): FlyingPath {
  const route = board.routes.find((r) => r.id === routeId)
  if (!route) throw new Error(`Unknown route: ${routeId}`)

  const worldPoints = concatFlyingNodes(board, route.flyingNodes)
  let totalLength = 0
  for (let i = 1; i < worldPoints.length; i++) {
    totalLength += segmentLength(worldPoints[i - 1]!, worldPoints[i]!)
  }

  return { worldPoints, totalLength }
}
