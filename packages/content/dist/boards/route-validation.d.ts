import type { BoardDefinition } from '../schemas/board.js';
import type { GridCoord } from '../schemas/common.js';
import { type BoardGrid } from './board-grid.js';
export declare function findLegPath(board: BoardDefinition, grid: BoardGrid, fromId: string, toId: string): GridCoord[] | null;
export declare function validateRouteLegsConnected(board: BoardDefinition, routeId: string): {
    ok: true;
} | {
    ok: false;
    leg: {
        from: string;
        to: string;
    };
};
export declare function validateAllRoutesConnected(board: BoardDefinition): {
    ok: true;
} | {
    ok: false;
    routeId: string;
    leg: {
        from: string;
        to: string;
    };
};
//# sourceMappingURL=route-validation.d.ts.map