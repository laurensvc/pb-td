import { getGemCombatStats } from './gems';
import type { GameState } from './types';

export interface DetectionGem {
  x: number;
  y: number;
  range: number;
}

export function buildDetectionGems(state: GameState): DetectionGem[] {
  return state.gems.map((gem) => ({
    x: gem.x,
    y: gem.y,
    range: getGemCombatStats(state.save, gem.family, gem.level).range,
  }));
}
