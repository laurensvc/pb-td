export { createGame, type CreateGameOptions } from './attempt';
export { dispatchGameAction, tickGame } from './engine';
export { createSnapshot } from './snapshot';
export { canPlaceGemAt, canPlaceHoldGemAt, canPlaceRockAt, previewRockPath } from './boardQueries';
export { isTierUnlocked } from './upgrades';
export { isPlanningPhase, ROCKS_PER_PHASE } from './buildPhase';
export { TOTAL_WAVES, getWave, getWaveCount } from './content';
export type { UiFeedback } from './types';
