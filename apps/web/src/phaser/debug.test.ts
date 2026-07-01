import { describe, expect, it } from 'vitest'
import { isDebugPathsEnabled } from './debug.js'

describe('isDebugPathsEnabled', () => {
  it('is false without the query flag', () => {
    expect(isDebugPathsEnabled('')).toBe(false)
    expect(isDebugPathsEnabled('?foo=1')).toBe(false)
  })

  it('is true in dev when debugPaths=1', () => {
    expect(isDebugPathsEnabled('?debugPaths=1')).toBe(true)
  })
})
