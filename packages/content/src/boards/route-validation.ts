import type { BoardDefinition } from '../schemas/board.js'
import type { GridCoord } from '../schemas/common.js'
import {
  buildInitialBoardGrid,
  isWalkableCell,
  landmarkCenter,
  type BoardGrid,
} from './board-grid.js'

interface AStarNode {
  gx: number
  gy: number
  g: number
  f: number
  parent?: AStarNode
}

function manhattan(a: GridCoord, b: GridCoord): number {
  return Math.abs(a.gx - b.gx) + Math.abs(a.gy - b.gy)
}

function coordKey(gx: number, gy: number): string {
  return `${gx},${gy}`
}

const DIRECTIONS = [
  { dx: 0, dy: -1 },
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
] as const

function findPathOnGrid(grid: BoardGrid, start: GridCoord, goal: GridCoord): GridCoord[] | null {
  const open = new Map<string, AStarNode>()
  const closed = new Set<string>()

  const startNode: AStarNode = {
    gx: start.gx,
    gy: start.gy,
    g: 0,
    f: manhattan(start, goal),
  }
  open.set(coordKey(start.gx, start.gy), startNode)

  while (open.size > 0) {
    let current: AStarNode | undefined
    let bestF = Infinity
    for (const node of open.values()) {
      if (node.f < bestF) {
        bestF = node.f
        current = node
      }
    }
    if (!current) break

    const currentKey = coordKey(current.gx, current.gy)
    if (current.gx === goal.gx && current.gy === goal.gy) {
      const path: GridCoord[] = []
      let node: AStarNode | undefined = current
      while (node) {
        path.push({ gx: node.gx, gy: node.gy })
        node = node.parent
      }
      return path.reverse()
    }

    open.delete(currentKey)
    closed.add(currentKey)

    for (const { dx, dy } of DIRECTIONS) {
      const ngx = current.gx + dx
      const ngy = current.gy + dy
      if (ngx < 0 || ngy < 0 || ngx >= grid.width || ngy >= grid.height) {
        continue
      }
      const key = coordKey(ngx, ngy)
      if (closed.has(key)) continue

      const kind = grid.cells[ngy]![ngx]!
      if (!isWalkableCell(kind)) continue

      const g = current.g + 1
      const existing = open.get(key)
      if (existing && g >= existing.g) continue

      open.set(key, {
        gx: ngx,
        gy: ngy,
        g,
        f: g + manhattan({ gx: ngx, gy: ngy }, goal),
        parent: current,
      })
    }
  }

  return null
}

export function findLegPath(
  board: BoardDefinition,
  grid: BoardGrid,
  fromId: string,
  toId: string,
): GridCoord[] | null {
  return findPathOnGrid(grid, landmarkCenter(board, fromId), landmarkCenter(board, toId))
}

export function validateRouteLegsConnected(
  board: BoardDefinition,
  routeId: string,
): { ok: true } | { ok: false; leg: { from: string; to: string } } {
  const route = board.routes.find((r) => r.id === routeId)
  if (!route) {
    throw new Error(`Unknown route: ${routeId}`)
  }

  const grid = buildInitialBoardGrid(board)
  for (const leg of route.groundLegs) {
    const path = findLegPath(board, grid, leg.from, leg.to)
    if (!path) {
      return { ok: false, leg }
    }
  }
  return { ok: true }
}

export function validateAllRoutesConnected(
  board: BoardDefinition,
): { ok: true } | { ok: false; routeId: string; leg: { from: string; to: string } } {
  for (const route of board.routes) {
    const result = validateRouteLegsConnected(board, route.id)
    if (!result.ok) {
      return { ok: false, routeId: route.id, leg: result.leg }
    }
  }
  return { ok: true }
}
