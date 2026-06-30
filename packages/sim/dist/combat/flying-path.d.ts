import type { BoardDefinition } from '@facet/content';
import { type WorldCoord } from '../board/coordinates.js';
export interface FlyingPath {
    worldPoints: WorldCoord[];
    totalLength: number;
}
export declare function buildFlyingPath(board: BoardDefinition, routeId: string): FlyingPath;
//# sourceMappingURL=flying-path.d.ts.map