import { loadGameContent } from '@facet/content'
import { describe, expect, it } from 'vitest'
import { addStructure, createSimBoard } from '../board/sim-board.js'
import { buildPathCache, ensurePathCache } from './path-cache.js'
import { computePathProgress } from './path-progress.js'

describe('PathCache', () => {
  const content = loadGameContent()

  it('builds concatenated path for default route', () => {
    const sim = createSimBoard(content.board)
    const cache = buildPathCache(content.board, sim, content.board.defaultRouteId)
    expect(cache).not.toBeNull()
    expect(cache!.legs.length).toBe(4)
    expect(cache!.concatenated.length).toBeGreaterThan(10)
    expect(cache!.totalLength).toBeGreaterThan(0)
  })

  it('increments version when maze changes', () => {
    const sim = createSimBoard(content.board)
    let cache = buildPathCache(content.board, sim, content.board.defaultRouteId)
    const v1 = cache!.version
    addStructure(sim, {
      id: 'r1',
      gx: 24,
      gy: 24,
      kind: 'rock',
      footprint: 2,
    })
    cache = ensurePathCache(content.board, sim, content.board.defaultRouteId, cache)
    expect(cache!.version).toBeGreaterThan(v1)
  })

  it('computes monotonic path progress', () => {
    const sim = createSimBoard(content.board)
    const cache = buildPathCache(content.board, sim, content.board.defaultRouteId)!
    const p0 = computePathProgress(0, 0, 0, cache.legStartIndex)
    const p1 = computePathProgress(0, 1, 0, cache.legStartIndex)
    expect(p1).toBeGreaterThan(p0)
  })
})
