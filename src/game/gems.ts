import { gemDefinitions, upgrades } from './content';
import type {
  GemCombatStats,
  GemDefinition,
  GemFamilyId,
  GemLevel,
  GemState,
  SaveState,
  UpgradeDefinition,
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

export function getGemDefinition(family: GemFamilyId): GemDefinition {
  return gemDefinitions[family];
}

export function canMergeGems(a: Pick<GemState, 'family' | 'level'>, b: Pick<GemState, 'family' | 'level'>): boolean {
  return a.family === b.family && a.level === b.level && a.level < 7;
}

export function mergedLevel(level: GemLevel): GemLevel {
  return Math.min(7, level + 1) as GemLevel;
}

export function gemSellValue(family: GemFamilyId, level: GemLevel): number {
  const base = gemDefinitions[family].shopCost;
  return Math.floor(base * LEVEL_MULTIPLIERS[level] * 0.55);
}

export function getGemCombatStats(save: SaveState, family: GemFamilyId, level: GemLevel): GemCombatStats {
  const base = gemDefinitions[family];
  const dmgMult = LEVEL_MULTIPLIERS[level];
  const meta = metaMultipliers(save, family);

  let damage = base.baseDamage * dmgMult * meta.damage;
  let range = base.baseRange + LEVEL_RANGE_BONUS[level] + meta.range;
  let cooldown = base.baseCooldown * LEVEL_COOLDOWN_MULT[level] * meta.cooldown;

  const poisonDps = base.poisonDps ? base.poisonDps * dmgMult * meta.damage : undefined;
  const poisonDuration = base.poisonDuration ? base.poisonDuration + (level - 1) * 0.35 : undefined;
  const shieldPierce = base.shieldPierce ? base.shieldPierce + (level - 1) * 0.35 : undefined;
  const splashRadius = base.splashRadius ? base.splashRadius + (level - 1) * 0.12 : undefined;
  const slowFactor = base.slowFactor ? Math.min(0.75, base.slowFactor + (level - 1) * 0.04) : undefined;
  const slowDuration = base.slowDuration ? base.slowDuration + (level - 1) * 0.25 : undefined;
  const armorReduction = base.armorReduction ? base.armorReduction + (level - 1) * 0.03 : undefined;
  const critChance = base.critChance ? Math.min(0.65, base.critChance + (level - 1) * 0.05) : undefined;
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
  return `${def.name} L${level}`;
}

function metaMultipliers(
  save: SaveState,
  family: GemFamilyId,
): { damage: number; range: number; cooldown: number } {
  let damage = 1;
  let range = 0;
  let cooldown = 1;
  for (const upgrade of purchasedUpgrades(save)) {
    if (upgrade.gemFamily !== family) continue;
    if (upgrade.towerStat === 'damage') damage *= 1 + upgrade.value;
    if (upgrade.towerStat === 'range') range += upgrade.value;
    if (upgrade.towerStat === 'rate') cooldown *= 1 + upgrade.value;
  }
  return { damage, range, cooldown };
}

function purchasedUpgrades(save: SaveState): UpgradeDefinition[] {
  return save.purchasedUpgradeIds
    .map((id) => upgrades.find((u) => u.id === id))
    .filter((u): u is UpgradeDefinition => Boolean(u));
}
