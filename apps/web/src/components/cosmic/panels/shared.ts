import type { GemFamilyId, GemLevel, SaveState } from '../../../game/types';
import { gemDefinitions } from '../../../game/content';
import { getGemCombatStats } from '../../../game/gems';

export const GEM_LEVEL_COLORS: Record<GemLevel, string> = {
  1: '0.55',
  2: '0.65',
  3: '0.75',
  4: '0.85',
  5: '0.92',
  6: '0.98',
  7: '1',
};

export function gemTooltip(save: SaveState, family: string, level: GemLevel): string {
  const id = family as GemFamilyId;
  const stats = getGemCombatStats(save, id, level);
  const def = gemDefinitions[id];
  return `${def.name} L${level}: ${Math.round(stats.damage)} dmg · ${stats.range.toFixed(1)} rng · ${stats.cooldown.toFixed(2)}s · ${def.role}`;
}
