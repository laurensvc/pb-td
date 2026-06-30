import { MISSILE_BASE, areaDefinitions, areaTierKey, upgrades } from './content';
import type { GameState, SaveState, TierId, UpgradeDefinition } from './types';

export function purchasedUpgrades(save: SaveState): UpgradeDefinition[] {
  return save.purchasedUpgradeIds
    .map((upgradeId) => upgrades.find((upgrade) => upgrade.id === upgradeId))
    .filter((upgrade): upgrade is UpgradeDefinition => Boolean(upgrade));
}

export function canBuyUpgrade(save: SaveState, upgrade: UpgradeDefinition): boolean {
  if (save.purchasedUpgradeIds.includes(upgrade.id)) return false;
  if (save.stars < upgrade.costStars) return false;
  if (save.crowns < (upgrade.costCrowns ?? 0)) return false;
  return (upgrade.requires ?? []).every((requiredId) =>
    save.purchasedUpgradeIds.includes(requiredId),
  );
}

export function getMissileStats(state: GameState): {
  damage: number;
  radius: number;
  cooldown: number;
} {
  let damage = MISSILE_BASE.damage;
  let radius = MISSILE_BASE.radius;
  let cooldown = MISSILE_BASE.cooldown;
  for (const upgrade of purchasedUpgrades(state.save)) {
    if (upgrade.missileStat === 'damage') damage += upgrade.value;
    if (upgrade.missileStat === 'radius') radius += upgrade.value;
    if (upgrade.missileStat === 'cooldown') cooldown += upgrade.value;
  }
  return {
    damage: Math.round(damage),
    radius: Number(Math.max(0.55, radius).toFixed(2)),
    cooldown: Number(Math.max(0.8, cooldown).toFixed(2)),
  };
}

export function hasMissileUnlocked(save: SaveState): boolean {
  return save.purchasedUpgradeIds.some((id) => id.startsWith('missile-'));
}

function previousAreaId(areaId: string): string {
  const index = areaDefinitions.findIndex((area) => area.id === areaId);
  if (index <= 0) return areaId;
  return areaDefinitions[index - 1].id;
}

export function isTierUnlocked(save: SaveState, areaId: string, tierId: TierId): boolean {
  if (tierId === 'normal')
    return (
      areaDefinitions.findIndex((area) => area.id === areaId) === 0 ||
      save.clearedAreaTiers.includes(areaTierKey(previousAreaId(areaId), 'normal'))
    );
  return save.clearedAreaTiers.includes(areaTierKey(areaId, 'normal'));
}
