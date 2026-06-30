import { type BoardDefinition } from '@facet/content';
import type { GridCoord } from '../board/coordinates.js';
import { type SimBoard } from '../board/sim-board.js';
export declare function findPath(sim: SimBoard, start: GridCoord, goal: GridCoord, extraBlocking?: Uint8Array): GridCoord[] | null;
export declare function findLegPath(board: BoardDefinition, sim: SimBoard, fromId: string, toId: string, extraBlocking?: Uint8Array): GridCoord[] | null;
export declare function allLegsReachable(board: BoardDefinition, sim: SimBoard, routeId: string, extraBlocking?: Uint8Array): boolean;
//# sourceMappingURL=astar.d.ts.map