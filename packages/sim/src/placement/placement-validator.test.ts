import { loadGameContent } from '@facet/content'
import { describe, expect, it } from 'vitest'
import { addStructure, createSimBoard, isFootprintBuildable } from '../board/sim-board.js'
import { allLegsReachable } from '../pathfinding/astar.js'
import { findBuildableFootprint } from '../test-helpers.js'
import { validatePlacement } from './placement-validator.js'

describe('PlacementValidator', () => {
  const content = loadGameContent()
  const routeId = content.board.defaultRouteId

  it('accepts legal open placement', () => {
    const sim = createSimBoard(content.board)
    const { gx, gy } = findBuildableFootprint(sim)
    const result = validatePlacement(content.board, sim, gx, gy, {
      routeId,
      phase: 'placement',
      placementCharges: 5,
    })
    expect(result.ok).toBe(true)
  })

  it('rejects unbuildable checkpoint pad', () => {
    const sim = createSimBoard(content.board)
    const cp = content.board.landmarks.find((l) => l.id === 'checkpoint-1')!
    const result = validatePlacement(content.board, sim, cp.grid.gx, cp.grid.gy, {
      routeId,
      phase: 'placement',
      placementCharges: 5,
    })
    expect(result.ok).toBe(false)
  })

  it('returns blocks_path when the route is no longer reachable', () => {
    const sim = createSimBoard(content.board)
    const anchor = findBuildableFootprint(sim)

    for (let row = 60; row < 80; row += 2) {
      for (let col = 60; col < 80; col += 2) {
        if (!isFootprintBuildable(sim, col, row)) continue
        addStructure(sim, {
          id: `seal-${col}-${row}`,
          gx: col,
          gy: row,
          kind: 'rock',
          footprint: 2,
        })
      }
    }

    expect(allLegsReachable(content.board, sim, routeId)).toBe(false)

    const result = validatePlacement(content.board, sim, anchor.gx, anchor.gy, {
      routeId,
      phase: 'placement',
      placementCharges: 1,
    })
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('blocks_path')
  })
})
