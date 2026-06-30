/** Monotonic progress along the cached ground route for targeting and leaks. */
export function computePathProgress(legIndex, pathIndex, distanceAlongSegment, legStartIndex) {
    const legOffset = legStartIndex[legIndex] ?? 0;
    return legOffset + pathIndex + distanceAlongSegment;
}
export function progressAtNode(cache, legIndex, pathIndex) {
    return computePathProgress(legIndex, pathIndex, 0, cache.legStartIndex);
}
export function progressAtConcatIndex(cache, concatIndex) {
    return concatIndex;
}
export function findLegForConcatIndex(cache, concatIndex) {
    for (let i = cache.legStartIndex.length - 1; i >= 0; i--) {
        const start = cache.legStartIndex[i];
        if (concatIndex >= start) {
            return { legIndex: i, pathIndex: concatIndex - start };
        }
    }
    return { legIndex: 0, pathIndex: concatIndex };
}
