import type { PathCache } from './path-cache.js';
/** Monotonic progress along the cached ground route for targeting and leaks. */
export declare function computePathProgress(legIndex: number, pathIndex: number, distanceAlongSegment: number, legStartIndex: readonly number[]): number;
export declare function progressAtNode(cache: PathCache, legIndex: number, pathIndex: number): number;
export declare function progressAtConcatIndex(cache: PathCache, concatIndex: number): number;
export declare function findLegForConcatIndex(cache: PathCache, concatIndex: number): {
    legIndex: number;
    pathIndex: number;
};
//# sourceMappingURL=path-progress.d.ts.map