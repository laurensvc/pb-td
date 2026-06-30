import { buildInitialBoardGrid, isWalkableCell } from '@facet/content'
import type { BoardDefinition } from '@facet/content'
import { GEM_FOOTPRINT } from '../constants.js'
import { footprintCells, footprintInBounds, footprintsOverlap } from './footprint.js'

export type CellKind = ReturnType<typeof buildInitialBoardGrid>['cells'][number][number]
export type BoardGrid = ReturnType<typeof buildInitialBoardGrid>

export type StructureKind = 'candidate' | 'tower' | 'rock' | 'special'

export interface BoardStructure {
  id: string
  gx: number
  gy: number
  kind: StructureKind
  footprint: number
}

export interface SimBoard {
  board: BoardDefinition
  terrain: BoardGrid
  /** 1 = blocked by a structure, 0 = open */
  blocking: Uint8Array
  structures: BoardStructure[]
  mazeVersion: number
}

function blockingIndex(width: number, gx: number, gy: number): number {
  return gy * width + gx
}

export function createSimBoard(board: BoardDefinition): SimBoard {
  const terrain = buildInitialBoardGrid(board)
  const blocking = new Uint8Array(board.width * board.height)
  return {
    board,
    terrain,
    blocking,
    structures: [],
    mazeVersion: 0,
  }
}

export function cloneBlocking(sim: SimBoard): Uint8Array {
  return new Uint8Array(sim.blocking)
}

export function isCellBlocked(
  sim: SimBoard,
  gx: number,
  gy: number,
  extraBlocking?: Uint8Array,
): boolean {
  const blocked =
    sim.blocking[blockingIndex(sim.board.width, gx, gy)] === 1 ||
    extraBlocking?.[blockingIndex(sim.board.width, gx, gy)] === 1
  return blocked
}

export function terrainKind(sim: SimBoard, gx: number, gy: number): CellKind {
  return sim.terrain.cells[gy]![gx]!
}

export function isGroundWalkable(
  sim: SimBoard,
  gx: number,
  gy: number,
  extraBlocking?: Uint8Array,
): boolean {
  const kind = terrainKind(sim, gx, gy)
  if (kind === 'forced_walkable') return true
  if (isCellBlocked(sim, gx, gy, extraBlocking)) return false
  return isWalkableCell(kind)
}

export function isFootprintBuildable(
  sim: SimBoard,
  gx: number,
  gy: number,
  extraBlocking?: Uint8Array,
  footprint = GEM_FOOTPRINT,
): boolean {
  if (!footprintInBounds(gx, gy, sim.board.width, sim.board.height, footprint)) {
    return false
  }
  for (const cell of footprintCells(gx, gy, footprint)) {
    const kind = terrainKind(sim, cell.gx, cell.gy)
    if (kind !== 'buildable_grass') return false
    if (isCellBlocked(sim, cell.gx, cell.gy, extraBlocking)) return false
  }
  return true
}

export function overlapsStructure(
  sim: SimBoard,
  gx: number,
  gy: number,
  footprint = GEM_FOOTPRINT,
  ignoreId?: string,
): boolean {
  for (const structure of sim.structures) {
    if (ignoreId && structure.id === ignoreId) continue
    if (footprintsOverlap(gx, gy, structure.gx, structure.gy, footprint)) {
      return true
    }
  }
  return false
}

export function setFootprintBlocked(
  blocking: Uint8Array,
  width: number,
  gx: number,
  gy: number,
  footprint = GEM_FOOTPRINT,
  value: 0 | 1 = 1,
): void {
  for (const cell of footprintCells(gx, gy, footprint)) {
    blocking[blockingIndex(width, cell.gx, cell.gy)] = value
  }
}

export function rebuildBlocking(sim: SimBoard): void {
  sim.blocking.fill(0)
  for (const structure of sim.structures) {
    setFootprintBlocked(
      sim.blocking,
      sim.board.width,
      structure.gx,
      structure.gy,
      structure.footprint,
      1,
    )
  }
}

export function addStructure(sim: SimBoard, structure: BoardStructure): void {
  sim.structures.push(structure)
  rebuildBlocking(sim)
  sim.mazeVersion += 1
}

export function removeStructure(sim: SimBoard, id: string): void {
  const before = sim.structures.length
  sim.structures = sim.structures.filter((s) => s.id !== id)
  if (sim.structures.length !== before) {
    rebuildBlocking(sim)
    sim.mazeVersion += 1
  }
}

export function removeStructures(sim: SimBoard, ids: Set<string>): void {
  const before = sim.structures.length
  sim.structures = sim.structures.filter((s) => !ids.has(s.id))
  if (sim.structures.length !== before) {
    rebuildBlocking(sim)
    sim.mazeVersion += 1
  }
}

/** Trial-place footprint without mutating sim state. Returns a blocking overlay copy. */
export function trialFootprintBlocking(
  sim: SimBoard,
  gx: number,
  gy: number,
  footprint = GEM_FOOTPRINT,
): Uint8Array {
  const trial = cloneBlocking(sim)
  setFootprintBlocked(trial, sim.board.width, gx, gy, footprint, 1)
  return trial
}
