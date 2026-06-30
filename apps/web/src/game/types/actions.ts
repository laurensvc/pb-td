import type { GameSpeed, PlacementMode, TierId } from './primitives';

export interface UiFeedback {
  toast?: string;
}

export type GameAction =
  | { type: 'startArea'; areaId: string; tierId: TierId }
  | { type: 'startWave' }
  | { type: 'selectPlacementMode'; mode: PlacementMode }
  | { type: 'selectInventoryGem'; gemId: number | null }
  | { type: 'placeGem'; x: number; y: number }
  | { type: 'placeRawGem'; x: number; y: number }
  | { type: 'placeRock'; x: number; y: number }
  | { type: 'finishRocks' }
  | { type: 'claimOffer'; index: number }
  | { type: 'commitRawGem'; rawGemId: number }
  | { type: 'commitRawRecipe'; recipeId: string }
  | { type: 'rerollOffers' }
  | { type: 'upgradeRock'; x: number; y: number }
  | { type: 'sellRock'; x: number; y: number }
  | { type: 'sellGem'; gemId: number }
  | { type: 'selectMergeSource'; gemId: number | null }
  | { type: 'mergeGems'; targetGemId: number }
  | { type: 'pickUpGem'; gemId: number }
  | { type: 'selectHoldGem' }
  | { type: 'placeHoldGem'; x: number; y: number }
  | { type: 'swapGemWithHold'; gemId: number }
  | { type: 'clearHold' }
  | { type: 'undoMerge' }
  | { type: 'cycleGemTargeting'; gemId: number }
  | { type: 'setGameSpeed'; speed: GameSpeed }
  | { type: 'rerollQuest'; questId: string }
  | { type: 'retry' }
  | { type: 'resetSave' };
