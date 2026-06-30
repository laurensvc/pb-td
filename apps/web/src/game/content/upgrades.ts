import type {
  GemFamilyId,
  MissileStat,
  TowerStat,
  UpgradeDefinition,
} from '../types';
import { gemDefinitions } from './gemDefinitions';

function makeMissileUpgrades(
  stat: MissileStat,
  label: string,
  baseCost: number,
  costStep: number,
  value: number,
): UpgradeDefinition[] {
  return Array.from({ length: 5 }, (_, index) => {
    const level = index + 1;
    return {
      id: `missile-${stat}-${level}`,
      label: `${label} ${level}`,
      branch: 'missile',
      costStars: baseCost + index * costStep,
      missileStat: stat,
      value,
      requires: level === 1 ? undefined : [`missile-${stat}-${level - 1}`],
    };
  });
}

function makeGemStatUpgrades(
  family: GemFamilyId,
  stat: TowerStat,
  label: string,
  baseCost: number,
  costStep: number,
  value: number,
  gate: string[] = [],
): UpgradeDefinition[] {
  return Array.from({ length: 5 }, (_, index) => {
    const level = index + 1;
    return {
      id: `${family}-${stat}-${level}`,
      label: `${label} ${level}`,
      branch: gemDefinitions[family].branch!,
      costStars: baseCost + index * costStep,
      gemFamily: family,
      towerStat: stat,
      value,
      requires: level === 1 ? gate : [`${family}-${stat}-${level - 1}`],
    };
  });
}

function makeUnlock(
  id: string,
  label: string,
  family: GemFamilyId,
  costStars: number,
  costCrowns: number,
  requires: string[],
): UpgradeDefinition {
  return {
    id,
    label,
    branch: 'unlock',
    costStars,
    costCrowns,
    requires,
    unlockGemFamily: family,
    value: 1,
  };
}

const upgradeDefinitions: UpgradeDefinition[] = [
  ...makeMissileUpgrades('damage', 'Payload Yield', 30, 10, 9),
  ...makeMissileUpgrades('radius', 'Blast Footprint', 28, 8, 0.15),
  ...makeMissileUpgrades('cooldown', 'Launch Cycle', 34, 11, -0.18),
  ...makeGemStatUpgrades('kinetic', 'damage', 'Kinetic Damage', 26, 9, 0.14),
  ...makeGemStatUpgrades('kinetic', 'range', 'Kinetic Range', 24, 8, 0.16),
  ...makeGemStatUpgrades('kinetic', 'rate', 'Kinetic Actuator', 28, 10, -0.06),
  makeUnlock('unlock-verdant', 'Verdant Path', 'verdant', 75, 0, ['missile-damage-1']),
  makeUnlock('unlock-arcane', 'Arcane Path', 'arcane', 75, 0, ['missile-damage-1']),
  makeUnlock('unlock-nova', 'Nova Mortar', 'nova', 1, 1, ['unlock-verdant', 'unlock-arcane']),
  makeUnlock('unlock-prism', 'Prism Shard', 'prism', 1, 2, ['unlock-nova']),
  makeUnlock('unlock-ember', 'Ember Core', 'ember', 90, 0, ['unlock-verdant']),
  ...makeGemStatUpgrades('verdant', 'damage', 'Verdant Toxin', 32, 10, 0.13, ['unlock-verdant']),
  ...makeGemStatUpgrades('verdant', 'range', 'Verdant Reach', 30, 9, 0.14, ['unlock-verdant']),
  ...makeGemStatUpgrades('verdant', 'rate', 'Verdant Bloom', 32, 10, -0.055, ['unlock-verdant']),
  ...makeGemStatUpgrades('arcane', 'damage', 'Arcane Fracture', 32, 10, 0.13, ['unlock-arcane']),
  ...makeGemStatUpgrades('arcane', 'range', 'Arcane Aperture', 30, 9, 0.15, ['unlock-arcane']),
  ...makeGemStatUpgrades('arcane', 'rate', 'Arcane Focusing', 32, 10, -0.055, ['unlock-arcane']),
  ...makeGemStatUpgrades('nova', 'damage', 'Nova Charge', 46, 14, 0.14, ['unlock-nova']),
  ...makeGemStatUpgrades('nova', 'range', 'Nova Trajectory', 42, 12, 0.14, ['unlock-nova']),
  ...makeGemStatUpgrades('nova', 'rate', 'Nova Loader', 48, 14, -0.06, ['unlock-nova']),
  ...makeGemStatUpgrades('prism', 'damage', 'Prism Cut', 48, 14, 0.14, ['unlock-prism']),
  ...makeGemStatUpgrades('prism', 'range', 'Prism Focus', 44, 12, 0.14, ['unlock-prism']),
  ...makeGemStatUpgrades('prism', 'rate', 'Prism Refraction', 50, 14, -0.06, ['unlock-prism']),
  ...makeGemStatUpgrades('ember', 'damage', 'Ember Heat', 30, 10, 0.13, ['unlock-ember']),
  ...makeGemStatUpgrades('ember', 'range', 'Ember Reach', 28, 9, 0.14, ['unlock-ember']),
  ...makeGemStatUpgrades('ember', 'rate', 'Ember Pulse', 30, 10, -0.055, ['unlock-ember']),
];

export const upgrades = upgradeDefinitions;

export function getUpgrade(upgradeId: string): UpgradeDefinition {
  const upgrade = upgrades.find((candidate) => candidate.id === upgradeId);
  if (!upgrade) throw new Error(`Missing upgrade: ${upgradeId}`);
  return upgrade;
}
