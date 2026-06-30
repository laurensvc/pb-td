import type { BoardDefinition } from '@facet/content';
import { type SimBoard } from '../board/sim-board.js';
export type PlacementRejectReason = 'wrong_phase' | 'no_charges' | 'invalid_alignment' | 'out_of_bounds' | 'not_buildable' | 'overlap' | 'blocks_path';
export interface PlacementValidationResult {
    ok: boolean;
    reason?: PlacementRejectReason;
}
export interface PlacementValidatorOptions {
    routeId: string;
    phase: 'placement';
    placementCharges: number;
}
export declare function validatePlacement(board: BoardDefinition, sim: SimBoard, gx: number, gy: number, options: PlacementValidatorOptions, footprint?: number): PlacementValidationResult;
export declare function canPlaceFootprint(board: BoardDefinition, sim: SimBoard, gx: number, gy: number, routeId: string, footprint?: number): boolean;
//# sourceMappingURL=placement-validator.d.ts.map