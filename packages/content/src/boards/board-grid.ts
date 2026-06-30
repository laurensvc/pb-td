import type { BoardDefinition } from '../schemas/board.js'
import type { GridCoord, GridRect } from '../schemas/common.js'

export type CellKind =
  | 'buildable_grass'
  | 'blocked'
  | 'unbuildable'
  | 'checkpoint_pad'
  | 'spawn_pad'
  | 'goal_pad'
  | 'forced_walkable'

export interface BoardGrid {
  width: number
  height: number
  cells: CellKind[][]
}

function pointInRect(gx: number, gy: number, rect: GridRect): boolean {
  return gx >= rect.gx && gx < rect.gx + rect.w && gy >= rect.gy && gy < rect.gy + rect.h
}

function rectOverlaps(rect: GridRect, gx: number, gy: number): boolean {
  return pointInRect(gx, gy, rect)
}

function classifyCell(board: BoardDefinition, gx: number, gy: number): CellKind {
  for (const rect of board.zones.forcedWalkable) {
    if (rectOverlaps(rect, gx, gy)) return 'forced_walkable'
  }

  for (const rect of board.zones.goalApproachLane) {
    if (rectOverlaps(rect, gx, gy)) return 'forced_walkable'
  }

  for (const rect of board.zones.diagonalBypass) {
    if (rectOverlaps(rect, gx, gy)) return 'forced_walkable'
  }

  for (const lm of board.landmarks) {
    const pad: GridRect = {
      gx: lm.grid.gx,
      gy: lm.grid.gy,
      w: lm.padSize,
      h: lm.padSize,
    }
    if (rectOverlaps(pad, gx, gy)) {
      if (lm.id === 'spawn') return 'spawn_pad'
      if (lm.id === 'goal') return 'goal_pad'
      return 'checkpoint_pad'
    }
  }

  for (const rect of board.zones.unbuildable) {
    if (rectOverlaps(rect, gx, gy)) return 'unbuildable'
  }

  return 'buildable_grass'
}

export function buildInitialBoardGrid(board: BoardDefinition): BoardGrid {
  const cells: CellKind[][] = []
  for (let gy = 0; gy < board.height; gy++) {
    const row: CellKind[] = []
    for (let gx = 0; gx < board.width; gx++) {
      row.push(classifyCell(board, gx, gy))
    }
    cells.push(row)
  }
  return { width: board.width, height: board.height, cells }
}

export function isWalkableCell(kind: CellKind): boolean {
  return (
    kind === 'buildable_grass' ||
    kind === 'forced_walkable' ||
    kind === 'checkpoint_pad' ||
    kind === 'spawn_pad' ||
    kind === 'goal_pad'
  )
}

export function landmarkCenter(board: BoardDefinition, id: string): GridCoord {
  const lm = board.landmarks.find((node) => node.id === id)
  if (!lm) {
    throw new Error(`Unknown landmark: ${id}`)
  }
  return {
    gx: lm.grid.gx + Math.floor(lm.padSize / 2),
    gy: lm.grid.gy + Math.floor(lm.padSize / 2),
  }
}
