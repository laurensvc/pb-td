import type { GameState } from './types';
export interface DetectionGem {
    x: number;
    y: number;
    range: number;
}
export declare function buildDetectionGems(state: GameState): DetectionGem[];
