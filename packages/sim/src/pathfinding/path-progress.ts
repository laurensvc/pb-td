import type { PathCache } from './path-cache.js'

/** Monotonic progress along the cached ground route for targeting and leaks. */
export function computePathProgress(
  legIndex: number,
  pathIndex: number,
  distanceAlongSegment: number,
  legStartIndex: readonly number[],
): number {
  const legOffset = legStartIndex[legIndex] ?? 0
  return legOffset + pathIndex + distanceAlongSegment
}

export function progressAtNode(cache: PathCache, legIndex: number, pathIndex: number): number {
  return computePathProgress(legIndex, pathIndex, 0, cache.legStartIndex)
}

export function progressAtConcatIndex(cache: PathCache, concatIndex: number): number {
  return concatIndex
}

export function findLegForConcatIndex(
  cache: PathCache,
  concatIndex: number,
): { legIndex: number; pathIndex: number } {
  for (let i = cache.legStartIndex.length - 1; i >= 0; i--) {
    const start = cache.legStartIndex[i]!
    if (concatIndex >= start) {
      return { legIndex: i, pathIndex: concatIndex - start }
    }
  }
  return { legIndex: 0, pathIndex: concatIndex }
}
