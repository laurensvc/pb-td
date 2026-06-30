import { buildInitialBoardGrid } from '@facet/content';
import type { BoardDefinition } from '@facet/content';
export type CellKind = ReturnType<typeof buildInitialBoardGrid>['cells'][number][number];
export type BoardGrid = ReturnType<typeof buildInitialBoardGrid>;
export type StructureKind = 'candidate' | 'tower' | 'rock' | 'special';
export interface BoardStructure {
    id: string;
    gx: number;
    gy: number;
    kind: StructureKind;
    footprint: number;
}
export interface SimBoard {
    board: BoardDefinition;
    terrain: BoardGrid;
    /** 1 = blocked by a structure, 0 = open */
    blocking: Uint8Array;
    structures: BoardStructure[];
    mazeVersion: number;
}
export declare function createSimBoard(board: BoardDefinition): SimBoard;
export declare function cloneBlocking(sim: SimBoard): Uint8Array;
export declare function isCellBlocked(sim: SimBoard, gx: number, gy: number, extraBlocking?: Uint8Array): boolean;
export declare function terrainKind(sim: SimBoard, gx: number, gy: number): CellKind;
export declare function isGroundWalkable(sim: SimBoard, gx: number, gy: number, extraBlocking?: Uint8Array): boolean;
export declare function isFootprintBuildable(sim: SimBoard, gx: number, gy: number, extraBlocking?: Uint8Array, footprint?: number): boolean;
export declare function overlapsStructure(sim: SimBoard, gx: number, gy: number, footprint?: number, ignoreId?: string): boolean;
export declare function setFootprintBlocked(blocking: Uint8Array, width: number, gx: number, gy: number, footprint?: number, value?: 0 | 1): void;
export declare function rebuildBlocking(sim: SimBoard): void;
export declare function addStructure(sim: SimBoard, structure: BoardStructure): void;
export declare function removeStructure(sim: SimBoard, id: string): void;
export declare function removeStructures(sim: SimBoard, ids: Set<string>): void;
/** Trial-place footprint without mutating sim state. Returns a blocking overlay copy. */
export declare function trialFootprintBlocking(sim: SimBoard, gx: number, gy: number, footprint?: number): Uint8Array;
//# sourceMappingURL=sim-board.d.ts.map