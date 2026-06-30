import type {
  AreaDefinition,
  BaseGemFamilyId,
  EnemyDefinition,
  GemDefinition,
  GemFamilyId,
  HybridGemFamilyId,
  MissileStat,
  TierId,
  TowerStat,
  UpgradeDefinition,
  WaveDefinition,
  WaveSegment,
} from './types';
import { buildPathNav } from './pathNav';
import { authoredWaveSegments } from './waveTables';

export const BOARD_WIDTH = 16;
export const BOARD_HEIGHT = 10;
export const STARTING_LIVES = 20;
export const TOTAL_WAVES = 50;
export const TOWER_MIN_SPACING = 0.85;
export const LUCKY_BOX_COST = 55;
export const RANDOM_GEM_COST = 18;

export const MISSILE_BASE = {
  damage: 85,
  radius: 1.35,
  cooldown: 2.2,
};

export const enemyDefinitions: Record<string, EnemyDefinition> = {
  scout: {
    id: 'scout',
    name: 'Void Scout',
    hp: 48,
    speed: 1.75,
    rewardStars: 3,
    rewardGold: 4,
    color: '#77e7ff',
  },
  trooper: {
    id: 'trooper',
    name: 'Astral Trooper',
    hp: 72,
    speed: 1.38,
    rewardStars: 4,
    rewardGold: 5,
    color: '#e4e9ff',
  },
  runner: {
    id: 'runner',
    name: 'Comet Runner',
    hp: 42,
    speed: 2.35,
    rewardStars: 4,
    rewardGold: 5,
    color: '#5eead4',
    flying: true,
  },
  bulwark: {
    id: 'bulwark',
    name: 'Shield Bulwark',
    hp: 95,
    speed: 1.05,
    rewardStars: 6,
    rewardGold: 7,
    shield: 48,
    color: '#bd9cff',
  },
  striker: {
    id: 'striker',
    name: 'Comet Striker',
    hp: 118,
    speed: 1.58,
    rewardStars: 7,
    rewardGold: 8,
    color: '#ffb86b',
  },
  brute: {
    id: 'brute',
    name: 'Iron Brute',
    hp: 210,
    speed: 0.88,
    rewardStars: 9,
    rewardGold: 10,
    color: '#a78bfa',
    physicalImmune: true,
  },
  shifter: {
    id: 'shifter',
    name: 'Phase Shifter',
    hp: 88,
    speed: 1.42,
    rewardStars: 8,
    rewardGold: 9,
    color: '#f0abfc',
    splitInto: 'scout',
    splitCount: 2,
    invisible: true,
  },
  mystic: {
    id: 'mystic',
    name: 'Void Mystic',
    hp: 135,
    speed: 1.12,
    rewardStars: 10,
    rewardGold: 11,
    shield: 72,
    color: '#c4b5fd',
    magicImmune: true,
  },
  warden: {
    id: 'warden',
    name: 'Nebula Warden',
    hp: 175,
    speed: 1.02,
    rewardStars: 11,
    rewardGold: 12,
    shield: 78,
    color: '#a48cff',
    flying: true,
    invisible: true,
  },
  vanguard: {
    id: 'vanguard',
    name: 'Crown Vanguard',
    hp: 240,
    speed: 0.95,
    rewardStars: 14,
    rewardGold: 15,
    shield: 105,
    color: '#ffd166',
  },
  colossus: {
    id: 'colossus',
    name: 'Titan Colossus',
    hp: 1800,
    speed: 0.72,
    rewardStars: 45,
    rewardGold: 80,
    shield: 320,
    color: '#f87171',
    isBoss: true,
    leakDamage: 2,
  },
  dreadnought: {
    id: 'dreadnought',
    name: 'Abyss Dreadnought',
    hp: 3200,
    speed: 0.65,
    rewardStars: 65,
    rewardGold: 120,
    shield: 480,
    color: '#ef4444',
    isBoss: true,
    leakDamage: 3,
  },
};

export const gemDefinitions: Record<GemFamilyId, GemDefinition> = {
  kinetic: {
    id: 'kinetic',
    name: 'Kinetic Crystal',
    role: 'Rapid fire with crit bursts.',
    branch: 'kinetic',
    damageType: 'physical',
    baseDamage: 18,
    baseRange: 3.0,
    baseCooldown: 0.85,
    projectileSpeed: 9,
    color: '#7dd3fc',
    shopCost: 16,
    critChance: 0.12,
  },
  verdant: {
    id: 'verdant',
    name: 'Verdant Spore',
    role: 'Stacking poison damage over time.',
    branch: 'verdant',
    damageType: 'magic',
    baseDamage: 10,
    baseRange: 2.75,
    baseCooldown: 1.0,
    projectileSpeed: 7.5,
    color: '#66f2a4',
    shopCost: 18,
    poisonDps: 7,
    poisonDuration: 3.5,
  },
  arcane: {
    id: 'arcane',
    name: 'Arcane Lens',
    role: 'Shield-breaking precision beams.',
    branch: 'arcane',
    damageType: 'magic',
    baseDamage: 17,
    baseRange: 3.35,
    baseCooldown: 1.05,
    projectileSpeed: 10.5,
    color: '#c084fc',
    shopCost: 20,
    shieldPierce: 2.4,
  },
  nova: {
    id: 'nova',
    name: 'Nova Mortar',
    role: 'Slowing splash artillery.',
    branch: 'nova',
    damageType: 'pure',
    baseDamage: 28,
    baseRange: 2.65,
    baseCooldown: 1.75,
    projectileSpeed: 6.5,
    color: '#fb7185',
    shopCost: 22,
    splashRadius: 0.75,
    slowFactor: 0.35,
    slowDuration: 1.8,
  },
  prism: {
    id: 'prism',
    name: 'Prism Shard',
    role: 'Armor shred and bonus vs tanks.',
    branch: 'prism',
    damageType: 'physical',
    baseDamage: 15,
    baseRange: 3.1,
    baseCooldown: 0.95,
    projectileSpeed: 8.8,
    color: '#fde68a',
    shopCost: 24,
    armorReduction: 0.08,
    bonusVsHighHp: 0.25,
  },
  ember: {
    id: 'ember',
    name: 'Ember Core',
    role: 'Burn damage that stacks on repeated hits.',
    branch: 'ember',
    damageType: 'magic',
    baseDamage: 16,
    baseRange: 2.85,
    baseCooldown: 0.92,
    projectileSpeed: 8.2,
    color: '#fb923c',
    shopCost: 21,
    poisonDps: 5,
    poisonDuration: 2.5,
  },
  toxic_shot: {
    id: 'toxic_shot',
    name: 'Toxic Shot',
    role: 'Hybrid: kinetic + verdant. Crit poison darts.',
    hybrid: true,
    damageType: 'magic',
    baseDamage: 14,
    baseRange: 2.9,
    baseCooldown: 0.9,
    projectileSpeed: 8.5,
    color: '#5ee4a8',
    shopCost: 0,
    poisonDps: 9,
    poisonDuration: 2.8,
    critChance: 0.1,
  },
  plasma_mortar: {
    id: 'plasma_mortar',
    name: 'Plasma Mortar',
    role: 'Hybrid: arcane + nova. Shield-piercing splash.',
    hybrid: true,
    damageType: 'pure',
    baseDamage: 24,
    baseRange: 2.8,
    baseCooldown: 1.55,
    projectileSpeed: 6.8,
    color: '#e879f9',
    shopCost: 0,
    shieldPierce: 1.8,
    splashRadius: 0.65,
    slowFactor: 0.25,
    slowDuration: 1.4,
  },
  pierce_crystal: {
    id: 'pierce_crystal',
    name: 'Pierce Crystal',
    role: 'Hybrid: kinetic + arcane. Heavy shield break.',
    hybrid: true,
    damageType: 'physical',
    baseDamage: 22,
    baseRange: 3.2,
    baseCooldown: 1.0,
    projectileSpeed: 10,
    color: '#a5b4fc',
    shopCost: 0,
    shieldPierce: 3.2,
    critChance: 0.08,
  },
  spore_bomb: {
    id: 'spore_bomb',
    name: 'Spore Bomb',
    role: 'Hybrid: verdant + nova. AoE toxin clouds.',
    hybrid: true,
    damageType: 'magic',
    baseDamage: 18,
    baseRange: 2.7,
    baseCooldown: 1.35,
    projectileSpeed: 7,
    color: '#4ade80',
    shopCost: 0,
    poisonDps: 11,
    poisonDuration: 3.2,
    splashRadius: 0.7,
  },
  slayer_shard: {
    id: 'slayer_shard',
    name: 'Slayer Shard',
    role: 'Hybrid: prism + kinetic. Tank hunter.',
    hybrid: true,
    damageType: 'physical',
    baseDamage: 20,
    baseRange: 3.05,
    baseCooldown: 0.92,
    projectileSpeed: 9,
    color: '#fcd34d',
    shopCost: 0,
    armorReduction: 0.1,
    bonusVsHighHp: 0.35,
    critChance: 0.1,
  },
  venom_lens: {
    id: 'venom_lens',
    name: 'Venom Lens',
    role: 'Hybrid: arcane + verdant. Magic poison beam.',
    hybrid: true,
    damageType: 'magic',
    baseDamage: 16,
    baseRange: 3.25,
    baseCooldown: 1.05,
    projectileSpeed: 10.2,
    color: '#86efac',
    shopCost: 0,
    poisonDps: 12,
    poisonDuration: 3.8,
    shieldPierce: 2.0,
  },
  shatter_star: {
    id: 'shatter_star',
    name: 'Shatter Star',
    role: 'Hybrid: nova + prism. Splash armor shred.',
    hybrid: true,
    damageType: 'pure',
    baseDamage: 26,
    baseRange: 2.85,
    baseCooldown: 1.45,
    projectileSpeed: 7.2,
    color: '#fde047',
    shopCost: 0,
    splashRadius: 0.8,
    armorReduction: 0.12,
    slowFactor: 0.2,
    slowDuration: 1.2,
  },
  executioner: {
    id: 'executioner',
    name: 'Executioner',
    role: 'Hybrid: kinetic + prism. Elite finisher.',
    hybrid: true,
    damageType: 'physical',
    baseDamage: 28,
    baseRange: 3.15,
    baseCooldown: 1.1,
    projectileSpeed: 9.5,
    color: '#fbbf24',
    shopCost: 0,
    critChance: 0.18,
    bonusVsHighHp: 0.45,
    armorReduction: 0.14,
  },
  ember_lance: {
    id: 'ember_lance',
    name: 'Ember Lance',
    role: 'Hybrid: ember + kinetic. Rapid burning crits.',
    hybrid: true,
    damageType: 'magic',
    baseDamage: 20,
    baseRange: 3.0,
    baseCooldown: 0.82,
    projectileSpeed: 9.2,
    color: '#fdba74',
    shopCost: 0,
    poisonDps: 8,
    poisonDuration: 2.2,
    critChance: 0.14,
  },
  solar_flare: {
    id: 'solar_flare',
    name: 'Solar Flare',
    role: 'Hybrid: ember + nova. Burning splash artillery.',
    hybrid: true,
    damageType: 'pure',
    baseDamage: 26,
    baseRange: 2.75,
    baseCooldown: 1.5,
    projectileSpeed: 6.6,
    color: '#f97316',
    shopCost: 0,
    poisonDps: 10,
    poisonDuration: 2.8,
    splashRadius: 0.72,
    slowFactor: 0.22,
    slowDuration: 1.3,
  },
};

export const BASE_GEM_FAMILIES: BaseGemFamilyId[] = [
  'kinetic',
  'verdant',
  'arcane',
  'nova',
  'prism',
  'ember',
];

export const HYBRID_GEM_FAMILIES: HybridGemFamilyId[] = [
  'toxic_shot',
  'plasma_mortar',
  'pierce_crystal',
  'spore_bomb',
  'slayer_shard',
  'venom_lens',
  'shatter_star',
  'executioner',
  'ember_lance',
  'solar_flare',
];

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

function makeTierWaves(areaId: string, tier: TierId): WaveDefinition[] {
  return Array.from({ length: TOTAL_WAVES }, (_, index) =>
    buildWave(areaId, index + 1, tier),
  );
}

export const areaDefinitions: AreaDefinition[] = [
  {
    id: 'a1',
    name: 'Orion Breach',
    subtitle: 'Build your maze, merge gems, survive 50 waves.',
    path: areaOnePath,
    pathNav: buildPathNav(areaOnePath),
    tiers: {
      normal: {
        waves: makeTierWaves('a1', 'normal'),
        enemyHpMultiplier: 1,
        enemySpeedMultiplier: 1,
        starMultiplier: 1,
        goldMultiplier: 1,
        startingGold: 35,
      },
      hard: {
        waves: makeTierWaves('a1', 'hard'),
        enemyHpMultiplier: 1.45,
        enemySpeedMultiplier: 1.08,
        starMultiplier: 1.35,
        goldMultiplier: 1.15,
        startingGold: 30,
      },
    },
  },
  {
    id: 'a2',
    name: 'Lunar Causeway',
    subtitle: 'Tighter bends reward splash gems and maze choke points.',
    path: areaTwoPath,
    pathNav: buildPathNav(areaTwoPath),
    tiers: {
      normal: {
        waves: makeTierWaves('a2', 'normal'),
        enemyHpMultiplier: 1.15,
        enemySpeedMultiplier: 1.04,
        starMultiplier: 1.2,
        goldMultiplier: 1.05,
        startingGold: 38,
      },
      hard: {
        waves: makeTierWaves('a2', 'hard'),
        enemyHpMultiplier: 1.62,
        enemySpeedMultiplier: 1.12,
        starMultiplier: 1.48,
        goldMultiplier: 1.2,
        startingGold: 32,
      },
    },
  },
  {
    id: 'a3',
    name: 'Crownfall Gate',
    subtitle: 'Elite tides and boss rushes test your great gem builds.',
    path: areaThreePath,
    pathNav: buildPathNav(areaThreePath),
    tiers: {
      normal: {
        waves: makeTierWaves('a3', 'normal'),
        enemyHpMultiplier: 1.28,
        enemySpeedMultiplier: 1.06,
        starMultiplier: 1.35,
        goldMultiplier: 1.1,
        startingGold: 40,
      },
      hard: {
        waves: makeTierWaves('a3', 'hard'),
        enemyHpMultiplier: 1.78,
        enemySpeedMultiplier: 1.14,
        starMultiplier: 1.62,
        goldMultiplier: 1.25,
        startingGold: 35,
      },
    },
  },
];

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

export function getArea(areaId: string): AreaDefinition {
  const area = areaDefinitions.find((candidate) => candidate.id === areaId);
  if (!area) throw new Error(`Missing area: ${areaId}`);
  return area;
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

export function rockPlacementCost(rocksPlaced: number): number {
  return 2 + rocksPlaced * 2;
}

export function waveClearGoldBonus(waveNumber: number): number {
  return 8 + Math.floor(waveNumber * 1.5);
}

function buildWave(areaId: string, waveNumber: number, tier: TierId): WaveDefinition {
  const isBoss = waveNumber % 10 === 0;
  const authored = authoredWaveSegments(areaId, waveNumber, tier);
  const segments = authored ?? composeWaveSegments(waveNumber, isBoss, tier);
  const spawnInterval = Math.max(0.06, 0.14 - waveNumber * 0.0015);
  return {
    id: `wave-${areaId}-${waveNumber}-${tier}`,
    segments,
    spawnInterval,
    isBoss,
    goldBonus: waveClearGoldBonus(waveNumber),
  };
}

function composeWaveSegments(waveNumber: number, isBoss: boolean, tier: TierId): WaveSegment[] {
  if (isBoss) {
    const bossId = waveNumber >= 40 ? 'dreadnought' : 'colossus';
    const escorts = waveNumber >= 30 ? 6 : 4;
    return [
      { enemyId: bossId, count: 1 },
      { enemyId: waveNumber >= 20 ? 'vanguard' : 'warden', count: escorts },
      { enemyId: 'striker', count: Math.floor(waveNumber / 2) },
    ];
  }

  const scale = 1 + (waveNumber - 1) * 0.08 + (tier === 'hard' ? 0.15 : 0);
  const baseCount = Math.max(4, Math.floor(6 + waveNumber * 0.55 * scale));
  const segments: WaveSegment[] = [];

  if (waveNumber <= 5) {
    segments.push({ enemyId: 'scout', count: Math.floor(baseCount * 0.7) });
    segments.push({ enemyId: 'trooper', count: Math.floor(baseCount * 0.3) });
  } else if (waveNumber <= 12) {
    segments.push({ enemyId: 'trooper', count: Math.floor(baseCount * 0.45) });
    segments.push({ enemyId: 'runner', count: Math.floor(baseCount * 0.3) });
    segments.push({ enemyId: 'bulwark', count: Math.floor(baseCount * 0.25) });
  } else if (waveNumber <= 22) {
    segments.push({ enemyId: 'striker', count: Math.floor(baseCount * 0.35) });
    segments.push({ enemyId: 'bulwark', count: Math.floor(baseCount * 0.25) });
    segments.push({ enemyId: 'shifter', count: Math.floor(baseCount * 0.2) });
    segments.push({ enemyId: 'runner', count: Math.floor(baseCount * 0.2) });
  } else if (waveNumber <= 28) {
    segments.push({ enemyId: 'brute', count: Math.floor(baseCount * 0.3) });
    segments.push({ enemyId: 'mystic', count: Math.floor(baseCount * 0.25) });
    segments.push({ enemyId: 'striker', count: Math.floor(baseCount * 0.25) });
    segments.push({ enemyId: 'shifter', count: Math.floor(baseCount * 0.2) });
  } else if (waveNumber <= 35) {
    segments.push({ enemyId: 'brute', count: Math.floor(baseCount * 0.25) });
    segments.push({ enemyId: 'mystic', count: Math.floor(baseCount * 0.25) });
    segments.push({ enemyId: 'striker', count: Math.floor(baseCount * 0.25) });
    segments.push({ enemyId: 'shifter', count: Math.floor(baseCount * 0.25) });
  } else {
    segments.push({ enemyId: 'vanguard', count: Math.floor(baseCount * 0.3) });
    segments.push({ enemyId: 'warden', count: Math.floor(baseCount * 0.25) });
    segments.push({ enemyId: 'brute', count: Math.floor(baseCount * 0.25) });
    segments.push({ enemyId: 'mystic', count: Math.floor(baseCount * 0.2) });
  }

  return segments.filter((segment) => segment.count > 0);
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
