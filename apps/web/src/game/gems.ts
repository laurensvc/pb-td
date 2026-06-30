import { gemDefinitions, BASE_GEM_FAMILIES } from './content';
import { hexAreAdjacent, worldToHex } from './hexGrid';
import { findMatchingRecipe } from './recipes';
import type {
  BaseGemFamilyId,
  GemCombatStats,
  GemDefinition,
  GemFamilyId,
  GemLevel,
  GemState,
  SaveState,
} from './types';

const LEVEL_MULTIPLIERS: Record<GemLevel, number> = {
  1: 1,
  2: 1.45,
  3: 2.05,
  4: 2.8,
  5: 3.7,
  6: 4.8,
  7: 6.5,
};

const LEVEL_RANGE_BONUS: Record<GemLevel, number> = {
  1: 0,
  2: 0.12,
  3: 0.24,
  4: 0.38,
  5: 0.52,
  6: 0.68,
  7: 0.9,
};

const LEVEL_COOLDOWN_MULT: Record<GemLevel, number> = {
  1: 1,
  2: 0.94,
  3: 0.88,
  4: 0.82,
  5: 0.76,
  6: 0.7,
  7: 0.62,
};

export function isHybridFamily(family: GemFamilyId): boolean {
  return Boolean(gemDefinitions[family].hybrid);
}

export function isBaseFamily(family: GemFamilyId): family is BaseGemFamilyId {
  return BASE_GEM_FAMILIES.includes(family as BaseGemFamilyId);
}

export function getGemDefinition(family: GemFamilyId): GemDefinition {
  return gemDefinitions[family];
}

export interface MergeResult {
  family: GemFamilyId;
  level: GemLevel;
  hybrid: boolean;
}

export function resolveMerge(
  a: Pick<GemState, 'family' | 'level'>,
  b: Pick<GemState, 'family' | 'level'>,
  identicalClusterSize = 2,
): MergeResult | null {
  if (a.family === b.family && a.level === b.level && a.level < 7) {
    const gain = identicalClusterSize >= 4 ? 2 : 1;
    return {
      family: a.family,
      level: mergedLevelBy(a.level, gain),
      hybrid: isHybridFamily(a.family),
    };
  }
  const recipe = findMatchingRecipe(
    { family: a.family, level: a.level },
    { family: b.family, level: b.level },
  );
  if (recipe) {
    return {
      family: recipe.output.family,
      level: recipe.output.level,
      hybrid: true,
    };
  }
  return null;
}

export function countIdenticalCluster(
  gems: readonly Pick<GemState, 'id' | 'family' | 'level' | 'x' | 'y'>[],
  seed: Pick<GemState, 'id' | 'family' | 'level' | 'x' | 'y'>,
): number {
  return identicalClusterIds(gems, seed).length;
}

export function identicalClusterIds(
  gems: readonly Pick<GemState, 'id' | 'family' | 'level' | 'x' | 'y'>[],
  seed: Pick<GemState, 'id' | 'family' | 'level' | 'x' | 'y'>,
): number[] {
  const matching = gems.filter((g) => g.family === seed.family && g.level === seed.level);
  const visited = new Set<number>();
  const queue = [seed.id];

  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    const gem = matching.find((g) => g.id === id);
    if (!gem) continue;
    visited.add(id);
    const cell = worldToHex(gem.x, gem.y);
    for (const other of matching) {
      if (visited.has(other.id)) continue;
      if (hexAreAdjacent(cell, worldToHex(other.x, other.y))) queue.push(other.id);
    }
  }
  return [...visited];
}

export function canMergeGems(
  a: Pick<GemState, 'family' | 'level'>,
  b: Pick<GemState, 'family' | 'level'>,
  greatUnlocked: readonly BaseGemFamilyId[] = [],
  identicalClusterSize = 2,
): boolean {
  const result = resolveMerge(a, b, identicalClusterSize);
  if (!result) return false;
  if (result.level === 7 && isBaseFamily(result.family)) {
    return greatUnlocked.includes(result.family);
  }
  return true;
}

export function canCraftGreat(
  family: BaseGemFamilyId,
  greatUnlocked: readonly BaseGemFamilyId[],
): boolean {
  return greatUnlocked.includes(family);
}

export function mergedLevel(level: GemLevel): GemLevel {
  return mergedLevelBy(level, 1);
}

export function mergedLevelBy(level: GemLevel, gain: number): GemLevel {
  return Math.min(7, level + gain) as GemLevel;
}

export function gemSellValue(family: GemFamilyId, level: GemLevel): number {
  const base = gemDefinitions[family].shopCost || 20;
  return Math.floor(base * LEVEL_MULTIPLIERS[level] * 0.55);
}

export function getGemCombatStats(
  _save: SaveState,
  family: GemFamilyId,
  level: GemLevel,
): GemCombatStats {
  const base = gemDefinitions[family];
  const dmgMult = LEVEL_MULTIPLIERS[level];

  let damage = base.baseDamage * dmgMult;
  let range = base.baseRange + LEVEL_RANGE_BONUS[level];
  let cooldown = base.baseCooldown * LEVEL_COOLDOWN_MULT[level];

  const poisonDps = base.poisonDps ? base.poisonDps * dmgMult : undefined;
  const poisonDuration = base.poisonDuration ? base.poisonDuration + (level - 1) * 0.35 : undefined;
  const shieldPierce = base.shieldPierce ? base.shieldPierce + (level - 1) * 0.35 : undefined;
  const splashRadius = base.splashRadius ? base.splashRadius + (level - 1) * 0.12 : undefined;
  const slowFactor = base.slowFactor
    ? Math.min(0.75, base.slowFactor + (level - 1) * 0.04)
    : undefined;
  const slowDuration = base.slowDuration ? base.slowDuration + (level - 1) * 0.25 : undefined;
  const armorReduction = base.armorReduction ? base.armorReduction + (level - 1) * 0.03 : undefined;
  const critChance = base.critChance
    ? Math.min(0.65, base.critChance + (level - 1) * 0.05)
    : undefined;
  const bonusVsHighHp = base.bonusVsHighHp ? base.bonusVsHighHp + (level - 1) * 0.08 : undefined;

  if (level === 7) {
    damage *= 1.25;
    range += 0.35;
    cooldown *= 0.88;
  }

  return {
    family,
    level,
    damage: Math.round(damage),
    range: Number(range.toFixed(2)),
    cooldown: Number(Math.max(0.18, cooldown).toFixed(2)),
    projectileSpeed: base.projectileSpeed,
    color: base.color,
    poisonDps: poisonDps ? Math.round(poisonDps) : undefined,
    poisonDuration: poisonDuration ? Number(poisonDuration.toFixed(2)) : undefined,
    shieldPierce: shieldPierce ? Number(shieldPierce.toFixed(2)) : undefined,
    splashRadius: splashRadius ? Number(splashRadius.toFixed(2)) : undefined,
    slowFactor,
    slowDuration: slowDuration ? Number(slowDuration.toFixed(2)) : undefined,
    armorReduction: armorReduction ? Number(armorReduction.toFixed(2)) : undefined,
    critChance,
    bonusVsHighHp,
  };
}

export function gemDisplayName(family: GemFamilyId, level: GemLevel): string {
  const def = gemDefinitions[family];
  if (level === 7) return `Great ${def.name}`;
  if (def.hybrid && level === 1) return def.name;
  return `${qualityName(level)} ${def.name}`;
}

export function qualityName(level: GemLevel): string {
  switch (level) {
    case 1:
      return 'Chipped';
    case 2:
      return 'Flawed';
    case 3:
      return 'Normal';
    case 4:
      return 'Flawless';
    case 5:
      return 'Perfect';
    case 6:
      return 'Great';
    case 7:
      return 'Great';
  }
}
