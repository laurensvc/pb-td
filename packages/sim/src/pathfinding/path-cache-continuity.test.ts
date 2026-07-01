import { loadGameContent } from '@facet/content'
import { describe, expect, it } from 'vitest'
import { createSimBoard } from '../board/sim-board.js'
import { buildPathCache } from '../pathfinding/path-cache.js'

describe('path cache continuity', () => {
  it('has no large gaps in worldConcatenated', async () => {
    const content = await loadGameContent()
    const board = content.board
    const sim = createSimBoard(board)
    const cache = buildPathCache(board, sim, board.defaultRouteId)
    expect(cache).not.toBeNull()

    const points = cache!.worldConcatenated
    let maxGap = 0
    let worst: { i: number; d: number; a: (typeof points)[0]; b: (typeof points)[0] } | null = null

    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i]!
      const b = points[i + 1]!
      const d = Math.hypot(b.x - a.x, b.y - a.y)
      if (d > maxGap) {
        maxGap = d
        worst = { i, d, a, b }
      }
    }

    if (worst) console.log('worst segment', worst, 'leg starts', cache!.legStartIndex)

    // Adjacent path nodes should be neighbors on the grid (cardinal/diagonal).
    expect(maxGap).toBeLessThanOrEqual(Math.SQRT2 * 32 + 0.01)
  })
})
