import { TOTAL_WAVES } from './content';
import type { GameAction, GameState, UiFeedback } from './types';
export { TOTAL_WAVES };
export { createGame } from './attempt';
export { canPlaceGemAt, canPlaceHoldGemAt, canPlaceRawGemAt, canPlaceRockAt, previewRockPath, } from './boardQueries';
export { isTierUnlocked } from './upgrades';
export { createSnapshot } from './snapshot';
export declare function dispatchGameAction(state: GameState, action: GameAction): UiFeedback;
export declare function tickGame(state: GameState, dt: number): void;
