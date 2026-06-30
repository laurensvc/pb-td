import { TOTAL_WAVES } from './content';
import { createDefaultSave } from './save';
import { createAttempt, replaceState } from './attempt';
import * as placement from './placement';
import { MAX_DT, buyUpgrade, fireMissile, respecUpgrades, tickCombatStep, tickMissilesOnly } from './combat';
import { tickTransientFx } from './runProgress';
import type { GameAction, GameState, UiFeedback } from './types';

export { TOTAL_WAVES };
export { createGame } from './attempt';
export {
  canPlaceGemAt,
  canPlaceHoldGemAt,
  canPlaceRockAt,
  previewRockPath,
} from './boardQueries';
export { canBuyUpgrade, getMissileStats, isTierUnlocked } from './upgrades';
export { createSnapshot } from './snapshot';

export function dispatchGameAction(state: GameState, action: GameAction): UiFeedback {
  switch (action.type) {
    case 'startArea':
      replaceState(state, createAttempt(state.save, action.areaId, action.tierId));
      break;
    case 'startWave':
      placement.startWave(state);
      break;
    case 'selectPlacementMode':
      state.placementMode = action.mode;
      if (action.mode !== 'merge') state.mergeSourceGemId = null;
      break;
    case 'selectInventoryGem':
      state.selectedInventoryGemId = action.gemId;
      if (action.gemId !== null) state.placementMode = 'gem';
      break;
    case 'placeGem':
      placement.placeGem(state, action.x, action.y);
      break;
    case 'placeRock':
      return placement.placeRock(state, action.x, action.y);
    case 'finishRocks':
      placement.finishRocks(state);
      break;
    case 'claimOffer':
      return placement.claimOffer(state, action.index);
    case 'rerollOffers':
      placement.rerollOffers(state);
      break;
    case 'upgradeRock':
      placement.upgradeRock(state, action.x, action.y);
      break;
    case 'sellRock':
      return placement.sellRock(state, action.x, action.y);
    case 'sellGem':
      placement.sellGem(state, action.gemId);
      break;
    case 'selectMergeSource':
      state.mergeSourceGemId = action.gemId;
      state.placementMode = 'merge';
      break;
    case 'mergeGems':
      placement.mergeGems(state, action.targetGemId);
      break;
    case 'pickUpGem':
      placement.pickUpGem(state, action.gemId);
      break;
    case 'swapGemWithHold':
      placement.swapGemWithHold(state, action.gemId);
      break;
    case 'selectHoldGem':
      placement.selectHoldGem(state);
      break;
    case 'placeHoldGem':
      placement.placeHoldGem(state, action.x, action.y);
      break;
    case 'clearHold':
      placement.clearHold(state);
      break;
    case 'undoMerge':
      placement.undoMerge(state);
      break;
    case 'cycleGemTargeting':
      placement.cycleGemTargeting(state, action.gemId);
      break;
    case 'setGameSpeed':
      state.gameSpeed = action.speed;
      break;
    case 'rerollQuest':
      placement.rerollQuestAction(state, action.questId);
      break;
    case 'buyGem':
      placement.buyGem(state, action.family);
      break;
    case 'buyRandomGem':
      placement.buyRandomGem(state);
      break;
    case 'buyLuckyBox':
      placement.buyLuckyBox(state);
      break;
    case 'fireMissile':
      fireMissile(state, action.x, action.y);
      break;
    case 'buyUpgrade':
      buyUpgrade(state, action.upgradeId);
      break;
    case 'respecUpgrades':
      respecUpgrades(state);
      break;
    case 'retry':
      replaceState(state, createAttempt(state.save, state.areaId, state.tierId));
      break;
    case 'resetSave':
      replaceState(state, createAttempt(createDefaultSave(), 'a1', 'normal'));
      break;
  }
  return {};
}

export function tickGame(state: GameState, dt: number): void {
  const step = Math.min(MAX_DT, Math.max(0, dt));
  tickTransientFx(state, step);
  const pendingMissiles = state.missiles.some((missile) => missile.active && missile.impactIn > 0);
  if (state.status !== 'running') {
    if (pendingMissiles) tickMissilesOnly(state, step);
    return;
  }
  tickCombatStep(state, step);
}
