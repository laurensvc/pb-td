import type { BoardDefinition } from '@facet/content'
import { allLegsReachable } from '../pathfinding/astar.js'
import {
  isFootprintBuildable,
  overlapsStructure,
  trialFootprintBlocking,
  type SimBoard,
} from '../board/sim-board.js'
import { GEM_FOOTPRINT } from '../constants.js'
import { isEvenAlignedFootprint } from '../board/footprint.js'

export type PlacementRejectReason =
  | 'wrong_phase'
  | 'no_charges'
  | 'invalid_alignment'
  | 'out_of_bounds'
  | 'not_buildable'
  | 'overlap'
  | 'blocks_path'

export interface PlacementValidationResult {
  ok: boolean
  reason?: PlacementRejectReason
}

export interface PlacementValidatorOptions {
  routeId: string
  phase: 'placement'
  placementCharges: number
}

export function validatePlacement(
  board: BoardDefinition,
  sim: SimBoard,
  gx: number,
  gy: number,
  options: PlacementValidatorOptions,
  footprint = GEM_FOOTPRINT,
): PlacementValidationResult {
  if (options.phase !== 'placement') {
    return { ok: false, reason: 'wrong_phase' }
  }
  if (options.placementCharges <= 0) {
    return { ok: false, reason: 'no_charges' }
  }
  if (!isEvenAlignedFootprint(gx, gy)) {
    return { ok: false, reason: 'invalid_alignment' }
  }
  if (!isFootprintBuildable(sim, gx, gy, undefined, footprint)) {
    if (gx < 0 || gy < 0 || gx + footprint > sim.board.width || gy + footprint > sim.board.height) {
      return { ok: false, reason: 'out_of_bounds' }
    }
    if (overlapsStructure(sim, gx, gy, footprint)) {
      return { ok: false, reason: 'overlap' }
    }
    return { ok: false, reason: 'not_buildable' }
  }
  if (overlapsStructure(sim, gx, gy, footprint)) {
    return { ok: false, reason: 'overlap' }
  }

  const trial = trialFootprintBlocking(sim, gx, gy, footprint)
  if (!allLegsReachable(board, sim, options.routeId, trial)) {
    return { ok: false, reason: 'blocks_path' }
  }

  return { ok: true }
}

export function canPlaceFootprint(
  board: BoardDefinition,
  sim: SimBoard,
  gx: number,
  gy: number,
  routeId: string,
  footprint = GEM_FOOTPRINT,
): boolean {
  if (!isFootprintBuildable(sim, gx, gy, undefined, footprint)) return false
  if (overlapsStructure(sim, gx, gy, footprint)) return false
  const trial = trialFootprintBlocking(sim, gx, gy, footprint)
  return allLegsReachable(board, sim, routeId, trial)
}
