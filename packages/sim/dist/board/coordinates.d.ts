export interface GridCoord {
    gx: number;
    gy: number;
}
export interface WorldCoord {
    x: number;
    y: number;
}
export declare function gridToWorldCenter(gx: number, gy: number): WorldCoord;
export declare function gridToWorldTopLeft(gx: number, gy: number): WorldCoord;
export declare function worldToGrid(x: number, y: number): GridCoord;
/** Snap hover to 2×2 footprint top-left (even coordinates). */
export declare function snapFootprint(gx: number, gy: number): GridCoord;
//# sourceMappingURL=coordinates.d.ts.map