export { createGame, type CreateGameOptions } from './attempt';
export { dispatchGameAction, tickGame } from './engine';
export { createSnapshot, consumeTransientUi } from './snapshot';
export {
  canPlaceGemAt,
  canPlaceHoldGemAt,
  canPlaceRockAt,
  previewRockPath,
  clearRockPathPreview,
} from './boardQueries';
export { canBuyUpgrade, getMissileStats, isTierUnlocked } from './upgrades';
export { isPlanningPhase, ROCKS_PER_PHASE } from './buildPhase';
export { TOTAL_WAVES, getWave, getWaveCount } from './content';
