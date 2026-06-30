import type { BoardDefinition } from '../schemas/board.js';
import type { GridCoord } from '../schemas/common.js';
export type CellKind = 'buildable_grass' | 'blocked' | 'unbuildable' | 'checkpoint_pad' | 'spawn_pad' | 'goal_pad' | 'forced_walkable';
export interface BoardGrid {
    width: number;
    height: number;
    cells: CellKind[][];
}
export declare function buildInitialBoardGrid(board: BoardDefinition): BoardGrid;
export declare function isWalkableCell(kind: CellKind): boolean;
export declare function landmarkCenter(board: BoardDefinition, id: string): GridCoord;
//# sourceMappingURL=board-grid.d.ts.map