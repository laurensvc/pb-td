import type {
  EnemyDefinition,
  GameConfig,
  GemDefinition,
  GemFamily,
  GemTier,
  MapDefinition,
  RecipeDefinition,
  WaveDefinition,
} from './types';

const families: readonly GemFamily[] = ['ruby', 'sapphire', 'topaz', 'emerald', 'amethyst', 'onyx'];
const familyNames: Record<GemFamily, string> = {
  ruby: 'Ruby',
  sapphire: 'Sapphire',
  topaz: 'Topaz',
  emerald: 'Emerald',
  amethyst: 'Amethyst',
  onyx: 'Onyx',
};
const colors: Record<GemFamily, string> = {
  ruby: '#c84d58',
  sapphire: '#436cc9',
  topaz: '#c89b22',
  emerald: '#2f9f67',
  amethyst: '#8058bf',
  onyx: '#675e6e',
};
const damageBase: Record<GemFamily, number> = {
  ruby: 24,
  sapphire: 15,
  topaz: 18,
  emerald: 12,
  amethyst: 9,
  onyx: 30,
};
const cooldownBase: Record<GemFamily, number> = {
  ruby: 0.58,
  sapphire: 0.34,
  topaz: 0.72,
  emerald: 0.42,
  amethyst: 0.8,
  onyx: 1.05,
};
const rangeBase: Record<GemFamily, number> = {
  ruby: 2.9,
  sapphire: 2.45,
  topaz: 3.25,
  emerald: 2.65,
  amethyst: 3.6,
  onyx: 2.3,
};

function makeGem(family: GemFamily, tier: GemTier): GemDefinition {
  const multiplier = [0, 1, 1.85, 3.35, 5.8][tier];
  return {
    id: `${family}-${tier}`,
    name: `${familyNames[family]} ${['', 'Shard', 'Facet', 'Crown', 'Heart'][tier]}`,
    family,
    tier,
    color: colors[family],
    damage: Math.round(damageBase[family] * multiplier),
    range: rangeBase[family] + tier * 0.12,
    cooldown: Math.max(0.18, cooldownBase[family] - tier * 0.025),
    projectileSpeed: 7 + tier * 0.55,
    splashRadius: family === 'topaz' ? 0.5 + tier * 0.12 : family === 'onyx' ? 0.35 : 0,
    slow: family === 'sapphire' ? 0.18 + tier * 0.04 : 0,
  };
}

const tierValues: readonly GemTier[] = [1, 2, 3, 4];
const gems: GemDefinition[] = [];
for (let f = 0; f < families.length; f++) {
  for (let t = 0; t < tierValues.length; t++) {
    gems.push(makeGem(families[f], tierValues[t]));
  }
}

gems.push(
  {
    id: 'prism-lens',
    name: 'Prism Lens',
    family: 'amethyst',
    tier: 4,
    color: '#d89f2f',
    damage: 92,
    range: 4.35,
    cooldown: 0.48,
    projectileSpeed: 9.2,
    splashRadius: 0.7,
    slow: 0.12,
  },
  {
    id: 'verdant-forge',
    name: 'Verdant Forge',
    family: 'emerald',
    tier: 4,
    color: '#2f8f83',
    damage: 76,
    range: 3.75,
    cooldown: 0.31,
    projectileSpeed: 8.5,
    splashRadius: 0.35,
    slow: 0,
  },
  {
    id: 'night-crucible',
    name: 'Night Crucible',
    family: 'onyx',
    tier: 4,
    color: '#5d5470',
    damage: 185,
    range: 3.1,
    cooldown: 1.15,
    projectileSpeed: 7.1,
    splashRadius: 1.05,
    slow: 0.22,
  },
  {
    id: 'sunward-core',
    name: 'Sunward Core',
    family: 'topaz',
    tier: 4,
    color: '#d47b31',
    damage: 132,
    range: 4,
    cooldown: 0.68,
    projectileSpeed: 8,
    splashRadius: 0.95,
    slow: 0,
  },
);

export const gemFamilies = families;

export const recipes: readonly RecipeDefinition[] = [
  {
    id: 'prism-lens',
    name: 'Prism Lens',
    description: 'Ruby, Sapphire, and Topaz facets focus into a long-range splash tower.',
    ingredients: [
      { family: 'ruby', tier: 2 },
      { family: 'sapphire', tier: 2 },
      { family: 'topaz', tier: 2 },
    ],
    resultGemId: 'prism-lens',
  },
  {
    id: 'verdant-forge',
    name: 'Verdant Forge',
    description: 'Emerald, Ruby, and Amethyst facets create a fast alchemical engine.',
    ingredients: [
      { family: 'emerald', tier: 2 },
      { family: 'ruby', tier: 2 },
      { family: 'amethyst', tier: 2 },
    ],
    resultGemId: 'verdant-forge',
  },
  {
    id: 'night-crucible',
    name: 'Night Crucible',
    description: 'Onyx, Sapphire, and Amethyst crowns become a heavy slowing cannon.',
    ingredients: [
      { family: 'onyx', tier: 3 },
      { family: 'sapphire', tier: 2 },
      { family: 'amethyst', tier: 2 },
    ],
    resultGemId: 'night-crucible',
    hidden: true,
  },
  {
    id: 'sunward-core',
    name: 'Sunward Core',
    description: 'Topaz, Ruby, and Emerald crowns ignite a broad-area solar blast.',
    ingredients: [
      { family: 'topaz', tier: 3 },
      { family: 'ruby', tier: 3 },
      { family: 'emerald', tier: 2 },
    ],
    resultGemId: 'sunward-core',
    hidden: true,
  },
];

export const defaultMap: MapDefinition = {
  id: 'foundry-crossing',
  name: 'Foundry Crossing',
  width: 16,
  height: 10,
  entrance: { x: 0, y: 5 },
  exit: { x: 15, y: 5 },
  blocked: [
    { x: 4, y: 2 },
    { x: 4, y: 3 },
    { x: 4, y: 7 },
    { x: 11, y: 2 },
    { x: 11, y: 6 },
    { x: 11, y: 7 },
    { x: 7, y: 0 },
    { x: 8, y: 9 },
  ],
};

export const enemies: readonly EnemyDefinition[] = [
  {
    id: 'cinderling',
    name: 'Cinderling',
    hp: 55,
    speed: 1.35,
    reward: 7,
    armor: 0,
    color: '#ff9b54',
  },
  {
    id: 'slag-runner',
    name: 'Slag Runner',
    hp: 72,
    speed: 1.85,
    reward: 8,
    armor: 1,
    color: '#f2cf73',
  },
  {
    id: 'iron-wight',
    name: 'Iron Wight',
    hp: 150,
    speed: 1.05,
    reward: 13,
    armor: 4,
    color: '#b6b1a7',
  },
  {
    id: 'glass-hex',
    name: 'Glass Hex',
    hp: 115,
    speed: 1.55,
    reward: 11,
    armor: 2,
    color: '#9ad9ff',
  },
  { id: 'obelisk', name: 'Obelisk', hp: 520, speed: 0.82, reward: 35, armor: 8, color: '#d9c8ff' },
];

export const waves: readonly WaveDefinition[] = [
  { id: 'w1', name: 'Sparks', enemyId: 'cinderling', count: 10, spawnInterval: 0.72 },
  { id: 'w2', name: 'Hot Footing', enemyId: 'slag-runner', count: 12, spawnInterval: 0.62 },
  { id: 'w3', name: 'Ash Pack', enemyId: 'cinderling', count: 18, spawnInterval: 0.5 },
  { id: 'w4', name: 'Iron March', enemyId: 'iron-wight', count: 9, spawnInterval: 0.82 },
  { id: 'w5', name: 'Glass Current', enemyId: 'glass-hex', count: 16, spawnInterval: 0.54 },
  { id: 'w6', name: 'Bellows', enemyId: 'slag-runner', count: 24, spawnInterval: 0.42 },
  { id: 'w7', name: 'Anvil Guard', enemyId: 'iron-wight', count: 16, spawnInterval: 0.66 },
  { id: 'w8', name: 'Prismatic Drift', enemyId: 'glass-hex', count: 24, spawnInterval: 0.44 },
  { id: 'w9', name: 'Crucible Host', enemyId: 'cinderling', count: 42, spawnInterval: 0.28 },
  { id: 'w10', name: 'The Obelisk', enemyId: 'obelisk', count: 3, spawnInterval: 2.1 },
  { id: 'w11', name: 'Molten Run', enemyId: 'slag-runner', count: 34, spawnInterval: 0.35 },
  { id: 'w12', name: 'Night Alloy', enemyId: 'iron-wight', count: 26, spawnInterval: 0.5 },
];

export const gameConfig: GameConfig = {
  map: defaultMap,
  gems,
  recipes,
  enemies,
  waves,
  economy: {
    startingGold: 155,
    startingLives: 24,
    draftCost: 45,
    sellRefundRate: 0.55,
  },
};

export function getGem(config: GameConfig, gemId: string): GemDefinition {
  for (let i = 0; i < config.gems.length; i++) {
    if (config.gems[i].id === gemId) return config.gems[i];
  }
  throw new Error(`Missing gem definition: ${gemId}`);
}

export function getEnemy(config: GameConfig, enemyId: string): EnemyDefinition {
  for (let i = 0; i < config.enemies.length; i++) {
    if (config.enemies[i].id === enemyId) return config.enemies[i];
  }
  throw new Error(`Missing enemy definition: ${enemyId}`);
}
