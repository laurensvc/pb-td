import type { GridCoord } from './coordinates.js';
export declare function footprintCells(gx: number, gy: number, size?: number): GridCoord[];
export declare function isEvenAlignedFootprint(gx: number, gy: number): boolean;
export declare function footprintInBounds(gx: number, gy: number, width: number, height: number, size?: number): boolean;
export declare function footprintsOverlap(aGx: number, aGy: number, bGx: number, bGy: number, size?: number): boolean;
//# sourceMappingURL=footprint.d.ts.map