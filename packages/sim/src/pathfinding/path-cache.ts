import type { BoardDefinition } from '@facet/content'
import { gridToWorldCenter, type GridCoord, type WorldCoord } from '../board/coordinates.js'
import { findLegPath } from './astar.js'
import type { SimBoard } from '../board/sim-board.js'

export interface PathCache {
  version: number
  routeId: string
  legs: GridCoord[][]
  worldLegs: WorldCoord[][]
  concatenated: GridCoord[]
  worldConcatenated: WorldCoord[]
  legStartIndex: number[]
  totalLength: number
}

function concatLegs(legs: GridCoord[][]): {
  concatenated: GridCoord[]
  legStartIndex: number[]
  totalLength: number
} {
  const concatenated: GridCoord[] = []
  const legStartIndex: number[] = []
  let totalLength = 0

  for (let i = 0; i < legs.length; i++) {
    const leg = legs[i]!
    legStartIndex.push(concatenated.length)

    if (leg.length === 0) continue

    if (concatenated.length === 0) {
      concatenated.push(...leg)
    } else {
      const last = concatenated[concatenated.length - 1]!
      const first = leg[0]!
      if (last.gx === first.gx && last.gy === first.gy) {
        concatenated.push(...leg.slice(1))
      } else {
        concatenated.push(...leg)
      }
    }

    if (leg.length > 1) {
      totalLength += leg.length - 1
    }
  }

  return { concatenated, legStartIndex, totalLength }
}

function toWorldPath(path: GridCoord[]): WorldCoord[] {
  return path.map((c) => gridToWorldCenter(c.gx, c.gy))
}

export function buildPathCache(
  board: BoardDefinition,
  sim: SimBoard,
  routeId: string,
): PathCache | null {
  const route = board.routes.find((r) => r.id === routeId)
  if (!route) throw new Error(`Unknown route: ${routeId}`)

  const legs: GridCoord[][] = []
  for (const leg of route.groundLegs) {
    const path = findLegPath(board, sim, leg.from, leg.to)
    if (!path) return null
    legs.push(path)
  }

  const { concatenated, legStartIndex, totalLength } = concatLegs(legs)

  return {
    version: sim.mazeVersion,
    routeId,
    legs,
    worldLegs: legs.map(toWorldPath),
    concatenated,
    worldConcatenated: toWorldPath(concatenated),
    legStartIndex,
    totalLength,
  }
}

export function isPathCacheValid(cache: PathCache, sim: SimBoard): boolean {
  return cache.version === sim.mazeVersion
}

export function ensurePathCache(
  board: BoardDefinition,
  sim: SimBoard,
  routeId: string,
  current: PathCache | null,
): PathCache | null {
  if (current && isPathCacheValid(current, sim) && current.routeId === routeId) {
    return current
  }
  return buildPathCache(board, sim, routeId)
}
