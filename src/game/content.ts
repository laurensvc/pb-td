import type {
  AreaDefinition,
  EnemyDefinition,
  MissileStat,
  TierId,
  TowerDefinition,
  TowerId,
  TowerStat,
  UpgradeDefinition,
} from './types';
import { borderBuildSlots } from './pathBuild';

export const BOARD_WIDTH = 16;
export const BOARD_HEIGHT = 10;
export const LOADOUT_LIMIT = 3;
export const STARTING_LIVES = 8;
/** Screen-clear style active — tuned to matter vs dense mid/late waves. */
export const MISSILE_BASE = {
  damage: 78,
  radius: 1.28,
  cooldown: 2.35,
};

export const enemyDefinitions: Record<string, EnemyDefinition> = {
  scout: {
    id: 'scout',
    name: 'Void Scout',
    hp: 55,
    speed: 1.7,
    rewardStars: 4,
    color: '#77e7ff',
  },
  trooper: {
    id: 'trooper',
    name: 'Astral Trooper',
    hp: 82,
    speed: 1.35,
    rewardStars: 5,
    color: '#e4e9ff',
  },
  bulwark: {
    id: 'bulwark',
    name: 'Shield Bulwark',
    hp: 88,
    speed: 1.08,
    rewardStars: 8,
    shield: 55,
    color: '#bd9cff',
  },
  striker: {
    id: 'striker',
    name: 'Comet Striker',
    hp: 130,
    speed: 1.55,
    rewardStars: 9,
    color: '#ffb86b',
  },
  warden: {
    id: 'warden',
    name: 'Nebula Warden',
    hp: 180,
    speed: 1.05,
    rewardStars: 13,
    shield: 85,
    color: '#a48cff',
  },
  vanguard: {
    id: 'vanguard',
    name: 'Crown Vanguard',
    hp: 250,
    speed: 0.92,
    rewardStars: 18,
    shield: 115,
    color: '#ffd166',
  },
};

export const towerDefinitions: Record<TowerId, TowerDefinition> = {
  kinetic: {
    id: 'kinetic',
    name: 'Kinetic Spire',
    role: 'Reliable single-target fire.',
    branch: 'kinetic',
    damage: 22,
    range: 3.1,
    cooldown: 0.92,
    projectileSpeed: 8.5,
    color: '#7dd3fc',
  },
  nature: {
    id: 'nature',
    name: 'Verdant Relay',
    role: 'Poison that scales through longer waves.',
    branch: 'nature',
    damage: 12,
    range: 2.8,
    cooldown: 1.08,
    projectileSpeed: 7.2,
    color: '#66f2a4',
    poisonDps: 8,
    poisonDuration: 3.8,
  },
  arcane: {
    id: 'arcane',
    name: 'Arcane Lens',
    role: 'Shield-breaking precision beam.',
    branch: 'arcane',
    damage: 20,
    range: 3.4,
    cooldown: 1.12,
    projectileSpeed: 10,
    color: '#c084fc',
    shieldPierce: 2.7,
  },
  nova: {
    id: 'nova',
    name: 'Nova Mortar',
    role: 'Slow splash when the path turns into a carpet of bodies.',
    branch: 'nova',
    damage: 34,
    range: 2.7,
    cooldown: 1.85,
    projectileSpeed: 6.2,
    color: '#fb7185',
    splashRadius: 0.85,
  },
};

const areaOnePath = [
  { x: 0, y: 5 },
  { x: 10, y: 5 },
  { x: 10, y: 8 },
  { x: 15, y: 8 },
];

const areaTwoPath = [
  { x: 0, y: 4 },
  { x: 9, y: 4 },
  { x: 9, y: 7 },
  { x: 15, y: 7 },
];

const areaThreePath = [
  { x: 0, y: 3 },
  { x: 11, y: 3 },
  { x: 11, y: 6 },
  { x: 15, y: 6 },
];

export const areaDefinitions: AreaDefinition[] = [
  {
    id: 'a1',
    name: 'Orion Breach',
    subtitle: 'Corridor horde route — choke them on the path, then bomb the clump.',
    path: areaOnePath,
    buildSlots: borderBuildSlots(areaOnePath, BOARD_WIDTH, BOARD_HEIGHT),
    tiers: {
      normal: {
        waves: [
          { id: 'a1n1', enemyId: 'scout', count: 18, spawnInterval: 0.3 },
          { id: 'a1n2', enemyId: 'trooper', count: 72, spawnInterval: 0.18 },
          { id: 'a1n3', enemyId: 'bulwark', count: 54, spawnInterval: 0.2 },
        ],
        enemyHpMultiplier: 1.38,
        enemySpeedMultiplier: 0.98,
        starMultiplier: 1.08,
      },
      hard: {
        waves: [
          { id: 'a1h1', enemyId: 'trooper', count: 22, spawnInterval: 0.24 },
          { id: 'a1h2', enemyId: 'bulwark', count: 58, spawnInterval: 0.18 },
          { id: 'a1h3', enemyId: 'striker', count: 48, spawnInterval: 0.17 },
        ],
        enemyHpMultiplier: 1.72,
        enemySpeedMultiplier: 1.04,
        starMultiplier: 1.22,
      },
    },
  },
  {
    id: 'a2',
    name: 'Lunar Causeway',
    subtitle: 'Double-bend meat grinder — expect floods; save your strike for the stack.',
    path: areaTwoPath,
    buildSlots: borderBuildSlots(areaTwoPath, BOARD_WIDTH, BOARD_HEIGHT),
    tiers: {
      normal: {
        waves: [
          { id: 'a2n1', enemyId: 'scout', count: 18, spawnInterval: 0.3 },
          { id: 'a2n2', enemyId: 'striker', count: 64, spawnInterval: 0.18 },
          { id: 'a2n3', enemyId: 'warden', count: 42, spawnInterval: 0.22 },
        ],
        enemyHpMultiplier: 1.48,
        enemySpeedMultiplier: 1.02,
        starMultiplier: 1.25,
      },
      hard: {
        waves: [
          { id: 'a2h1', enemyId: 'striker', count: 22, spawnInterval: 0.22 },
          { id: 'a2h2', enemyId: 'warden', count: 46, spawnInterval: 0.2 },
          { id: 'a2h3', enemyId: 'vanguard', count: 18, spawnInterval: 0.32 },
        ],
        enemyHpMultiplier: 1.82,
        enemySpeedMultiplier: 1.08,
        starMultiplier: 1.38,
      },
    },
  },
  {
    id: 'a3',
    name: 'Crownfall Gate',
    subtitle: 'Elite tide on a wide bend — splash, shields, and a well-timed bombardment.',
    path: areaThreePath,
    buildSlots: borderBuildSlots(areaThreePath, BOARD_WIDTH, BOARD_HEIGHT),
    tiers: {
      normal: {
        waves: [
          { id: 'a3n1', enemyId: 'trooper', count: 20, spawnInterval: 0.28 },
          { id: 'a3n2', enemyId: 'warden', count: 52, spawnInterval: 0.2 },
          { id: 'a3n3', enemyId: 'vanguard', count: 24, spawnInterval: 0.28 },
        ],
        enemyHpMultiplier: 1.78,
        enemySpeedMultiplier: 1.04,
        starMultiplier: 1.52,
      },
      hard: {
        waves: [
          { id: 'a3h1', enemyId: 'striker', count: 24, spawnInterval: 0.22 },
          { id: 'a3h2', enemyId: 'warden', count: 54, spawnInterval: 0.18 },
          { id: 'a3h3', enemyId: 'vanguard', count: 28, spawnInterval: 0.26 },
        ],
        enemyHpMultiplier: 2.12,
        enemySpeedMultiplier: 1.1,
        starMultiplier: 1.75,
      },
    },
  },
];

const upgradeDefinitions: UpgradeDefinition[] = [
  ...makeMissileUpgrades('damage', 'Payload Yield', 30, 10, 9),
  ...makeMissileUpgrades('radius', 'Blast Footprint', 28, 8, 0.15),
  ...makeMissileUpgrades('cooldown', 'Launch Cycle', 34, 11, -0.18),
  ...makeTowerStatUpgrades('kinetic', 'damage', 'Kinetic Damage', 26, 9, 0.14),
  ...makeTowerStatUpgrades('kinetic', 'range', 'Kinetic Range', 24, 8, 0.16),
  ...makeTowerStatUpgrades('kinetic', 'rate', 'Kinetic Actuator', 28, 10, -0.06),
  makeUnlock('unlock-nature', 'Nature Path', 'nature', 85, 0, ['missile-damage-1']),
  makeUnlock('unlock-arcane', 'Arcane Path', 'arcane', 85, 0, ['missile-damage-1']),
  makeUnlock('unlock-nova', 'Nova Mortar', 'nova', 1, 1, ['unlock-nature', 'unlock-arcane']),
  ...makeTowerStatUpgrades('nature', 'damage', 'Nature Toxin', 32, 10, 0.13, ['unlock-nature']),
  ...makeTowerStatUpgrades('nature', 'range', 'Nature Reach', 30, 9, 0.14, ['unlock-nature']),
  ...makeTowerStatUpgrades('nature', 'rate', 'Nature Bloom', 32, 10, -0.055, ['unlock-nature']),
  ...makeTowerStatUpgrades('arcane', 'damage', 'Arcane Fracture', 32, 10, 0.13, ['unlock-arcane']),
  ...makeTowerStatUpgrades('arcane', 'range', 'Arcane Aperture', 30, 9, 0.15, ['unlock-arcane']),
  ...makeTowerStatUpgrades('arcane', 'rate', 'Arcane Focusing', 32, 10, -0.055, ['unlock-arcane']),
  ...makeTowerStatUpgrades('nova', 'damage', 'Nova Charge', 46, 14, 0.14, ['unlock-nova']),
  ...makeTowerStatUpgrades('nova', 'range', 'Nova Trajectory', 42, 12, 0.14, ['unlock-nova']),
  ...makeTowerStatUpgrades('nova', 'rate', 'Nova Loader', 48, 14, -0.06, ['unlock-nova']),
];

export const upgrades = upgradeDefinitions;

export function getArea(areaId: string): AreaDefinition {
  const area = areaDefinitions.find((candidate) => candidate.id === areaId);
  if (!area) throw new Error(`Missing area: ${areaId}`);
  return area;
}

export function getTower(towerId: TowerId): TowerDefinition {
  return towerDefinitions[towerId];
}

export function getEnemy(enemyId: string): EnemyDefinition {
  const enemy = enemyDefinitions[enemyId];
  if (!enemy) throw new Error(`Missing enemy: ${enemyId}`);
  return enemy;
}

export function getUpgrade(upgradeId: string): UpgradeDefinition {
  const upgrade = upgrades.find((candidate) => candidate.id === upgradeId);
  if (!upgrade) throw new Error(`Missing upgrade: ${upgradeId}`);
  return upgrade;
}

export function areaTierKey(areaId: string, tierId: TierId): string {
  return `${areaId}:${tierId}`;
}

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

function makeTowerStatUpgrades(
  towerId: TowerId,
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
      id: `${towerId}-${stat}-${level}`,
      label: `${label} ${level}`,
      branch: towerDefinitions[towerId].branch,
      costStars: baseCost + index * costStep,
      towerId,
      towerStat: stat,
      value,
      requires: level === 1 ? gate : [`${towerId}-${stat}-${level - 1}`],
    };
  });
}

function makeUnlock(
  id: string,
  label: string,
  towerId: TowerId,
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
    unlockTowerId: towerId,
    value: 1,
  };
}
