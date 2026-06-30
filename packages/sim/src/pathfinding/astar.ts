import { landmarkCenter, type BoardDefinition } from '@facet/content'
import type { GridCoord } from '../board/coordinates.js'
import { isGroundWalkable, type SimBoard } from '../board/sim-board.js'

interface AStarNode {
  gx: number
  gy: number
  g: number
  f: number
  parent?: AStarNode
}

const DIRECTIONS = [
  { dx: 0, dy: -1 },
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
] as const

function manhattan(a: GridCoord, b: GridCoord): number {
  return Math.abs(a.gx - b.gx) + Math.abs(a.gy - b.gy)
}

function coordKey(gx: number, gy: number): string {
  return `${gx},${gy}`
}

export function findPath(
  sim: SimBoard,
  start: GridCoord,
  goal: GridCoord,
  extraBlocking?: Uint8Array,
): GridCoord[] | null {
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
      if (ngx < 0 || ngy < 0 || ngx >= sim.board.width || ngy >= sim.board.height) {
        continue
      }
      const key = coordKey(ngx, ngy)
      if (closed.has(key)) continue
      if (!isGroundWalkable(sim, ngx, ngy, extraBlocking)) continue

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
  sim: SimBoard,
  fromId: string,
  toId: string,
  extraBlocking?: Uint8Array,
): GridCoord[] | null {
  return findPath(sim, landmarkCenter(board, fromId), landmarkCenter(board, toId), extraBlocking)
}

export function allLegsReachable(
  board: BoardDefinition,
  sim: SimBoard,
  routeId: string,
  extraBlocking?: Uint8Array,
): boolean {
  const route = board.routes.find((r) => r.id === routeId)
  if (!route) throw new Error(`Unknown route: ${routeId}`)

  for (const leg of route.groundLegs) {
    const path = findLegPath(board, sim, leg.from, leg.to, extraBlocking)
    if (!path) return false
  }
  return true
}
