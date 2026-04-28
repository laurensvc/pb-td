import type {
  DamageType,
  EnemyDefinition,
  EnemySkill,
  GameConfig,
  GemDefinition,
  GemFamily,
  GemTier,
  MapDefinition,
  QuestDefinition,
  RankDefinition,
  RecipeDefinition,
  SkillDefinition,
  TowerClass,
  TowerEffectDefinition,
  WaveDefinition,
} from './types';

export const gemFamilies = [
  'amethyst',
  'aquamarine',
  'diamond',
  'emerald',
  'opal',
  'ruby',
  'sapphire',
  'topaz',
] as const satisfies readonly GemFamily[];

const familyMeta: Record<GemFamily, { name: string; code: string; color: string }> = {
  amethyst: { name: 'Amethyst', code: 'P', color: '#9b5cff' },
  aquamarine: { name: 'Aquamarine', code: 'Q', color: '#31d6db' },
  diamond: { name: 'Diamond', code: 'D', color: '#e8fbff' },
  emerald: { name: 'Emerald', code: 'G', color: '#39ce72' },
  opal: { name: 'Opal', code: 'E', color: '#f0d6ff' },
  ruby: { name: 'Ruby', code: 'R', color: '#f05268' },
  sapphire: { name: 'Sapphire', code: 'B', color: '#4e7cff' },
  topaz: { name: 'Topaz', code: 'Y', color: '#f2c94c' },
};

const gemStats: Record<
  GemFamily,
  {
    damage: readonly number[];
    range: readonly number[];
    cooldown: readonly number[];
    damageType: DamageType;
    effects: (tier: GemTier) => readonly TowerEffectDefinition[];
  }
> = {
  amethyst: {
    damage: [2, 4, 6, 8, 10, 70],
    range: [5, 5, 5, 5, 5, 5],
    cooldown: [0.6, 0.6, 0.6, 0.6, 0.6, 0.6],
    damageType: 'physical',
    effects: (tier) => [{ type: 'armorBreak', value: [2, 4, 8, 16, 32, 64][tier - 1] }],
  },
  aquamarine: {
    damage: [2, 4, 8, 16, 24, 80],
    range: [4, 4, 4, 4, 4, 5],
    cooldown: [0.25, 0.25, 0.25, 0.25, 0.25, 0.1],
    damageType: 'magic',
    effects: (tier) => [{ type: 'speedAura', value: tier === 6 ? 0.5 : 0.2, radius: 5 }],
  },
  diamond: {
    damage: [5, 10, 20, 60, 120, 460],
    range: [5, 5, 5, 5, 5, 5],
    cooldown: [1, 1, 1, 1, 1, 0.7],
    damageType: 'physical',
    effects: (tier) =>
      tier >= 4
        ? [{ type: 'damageAura', value: tier === 6 ? 3.2 : tier === 5 ? 0.4 : 0.2, radius: 4 }]
        : [],
  },
  emerald: {
    damage: [2, 4, 6, 8, 10, 12],
    range: [5, 5, 5, 5, 5, 5],
    cooldown: [1, 1, 1, 1, 1, 1],
    damageType: 'magic',
    effects: (tier) => [
      { type: 'poison', value: [2, 4, 8, 16, 32, 128][tier - 1], duration: 5 },
      ...(tier >= 2
        ? ([{ type: 'overlook', value: 1, duration: 4 }] satisfies TowerEffectDefinition[])
        : []),
    ],
  },
  opal: {
    damage: [1, 2, 3, 4, 5, 6],
    range: [5, 5, 5, 5, 5, 5],
    cooldown: [1, 1, 1, 1, 1, 1],
    damageType: 'magic',
    effects: (tier) => [
      { type: 'speedAura', value: [0.2, 0.3, 0.4, 0.5, 0.6, 0.7][tier - 1], radius: 5 },
    ],
  },
  ruby: {
    damage: [4, 8, 12, 24, 48, 150],
    range: [5, 5, 5, 5, 5, 5],
    cooldown: [1, 1, 1, 1, 1, 1],
    damageType: 'physical',
    effects: (tier) => [
      {
        type: 'cleave',
        value: [0.3, 0.4, 0.5, 0.6, 0.7, 1][tier - 1],
        radius: [3, 3.5, 4, 4.5, 5, 7][tier - 1],
        damageType: 'pure',
      },
    ],
  },
  sapphire: {
    damage: [2, 4, 6, 8, 10, 36],
    range: [6, 6, 6, 6, 6, 6],
    cooldown: [1, 1, 1, 1, 1, 0.6],
    damageType: 'magic',
    effects: (tier) => [
      {
        type: 'slow',
        value: [0.12, 0.18, 0.24, 0.3, 0.36, 0.58][tier - 1],
        duration: tier === 6 ? 2.4 : 1.6,
        radius: tier === 6 ? 1.2 : 0,
      },
    ],
  },
  topaz: {
    damage: [3, 6, 9, 18, 36, 200],
    range: [6, 5, 5, 5, 5, 50],
    cooldown: [1.3, 1.3, 1.3, 1.3, 1.3, 0.6],
    damageType: 'physical',
    effects: (tier) => [{ type: 'split', value: 1, maxTargets: tier === 6 ? 5 : 3 }],
  },
};

function gem(family: GemFamily, tier: GemTier): GemDefinition {
  const meta = familyMeta[family];
  const index = tier - 1;
  return {
    id: `${family}-${tier}`,
    name: `${meta.name}/${meta.code}${tier}`,
    code: `${meta.code}${tier}`,
    family,
    tier,
    color: meta.color,
    damage: gemStats[family].damage[index],
    range: gemStats[family].range[index],
    cooldown: gemStats[family].cooldown[index],
    projectileSpeed: tier === 6 ? 10 : 8,
    damageType: gemStats[family].damageType,
    effects: gemStats[family].effects(tier),
    classification: 'gem',
  };
}

function tower(
  id: string,
  name: string,
  classification: TowerClass,
  family: GemFamily,
  color: string,
  damage: number,
  range: number,
  cooldown: number,
  damageType: DamageType,
  effects: readonly TowerEffectDefinition[],
): GemDefinition {
  return {
    id,
    name,
    code: id,
    family,
    tier: 6,
    color,
    damage,
    range,
    cooldown,
    projectileSpeed: 10,
    damageType,
    effects,
    classification,
  };
}

const gems: GemDefinition[] = [];
for (const family of gemFamilies) {
  for (let tier = 1; tier <= 6; tier++) gems.push(gem(family, tier as GemTier));
}

gems.push(
  tower('silver', 'Silver', 'basic', 'sapphire', '#cbd5e1', 22, 6, 0.85, 'magic', [
    { type: 'slow', value: 0.24, duration: 1.8 },
  ]),
  tower(
    'silver-knight',
    'Silver Knight',
    'intermediate',
    'sapphire',
    '#a6b8ff',
    58,
    6,
    0.75,
    'physical',
    [
      { type: 'cleave', value: 0.5, radius: 4, damageType: 'pure' },
      { type: 'slow', value: 0.3, duration: 2 },
    ],
  ),
  tower(
    'pink-diamond',
    'Pink Diamond',
    'intermediate',
    'diamond',
    '#ff9bd4',
    155,
    5,
    0.9,
    'physical',
    [{ type: 'crit', value: 0.15, maxTargets: 4 }],
  ),
  tower(
    'huge-pink-diamond',
    'Huge Pink Diamond',
    'advanced',
    'diamond',
    '#ff70bf',
    260,
    6,
    0.78,
    'physical',
    [
      { type: 'cleave', value: 0.7, radius: 5, damageType: 'pure' },
      { type: 'crit', value: 0.18, maxTargets: 5 },
      { type: 'slow', value: 0.24, duration: 2 },
    ],
  ),
  tower(
    'koh-i-noor-diamond',
    'Koh-i-noor Diamond',
    'top',
    'diamond',
    '#fff1ff',
    760,
    7,
    0.62,
    'physical',
    [{ type: 'crit', value: 0.28, maxTargets: 7 }],
  ),
  tower('malachite', 'Malachite', 'basic', 'emerald', '#33d17a', 34, 5, 0.72, 'magic', [
    { type: 'split', value: 1, maxTargets: 3 },
  ]),
  tower(
    'vivid-malachite',
    'Vivid Malachite',
    'intermediate',
    'emerald',
    '#00f08a',
    86,
    5,
    0.62,
    'magic',
    [{ type: 'split', value: 1, maxTargets: 5 }],
  ),
  tower('uranium-238', 'Uranium-238', 'intermediate', 'topaz', '#a3e635', 98, 5, 0.68, 'magic', [
    { type: 'split', value: 1, maxTargets: 5 },
  ]),
  tower('uranium-235', 'Uranium-235', 'advanced', 'topaz', '#84cc16', 170, 6, 0.54, 'magic', [
    { type: 'radiation', value: 18, radius: 3, maxTargets: 10 },
  ]),
  tower('asteriated-ruby', 'Asteriated Ruby', 'basic', 'ruby', '#fb7185', 38, 5, 0.88, 'magic', [
    { type: 'burn', value: 7, duration: 4 },
  ]),
  tower('volcano', 'Volcano', 'intermediate', 'ruby', '#f97316', 110, 5, 0.78, 'magic', [
    { type: 'burn', value: 20, duration: 4 },
  ]),
  tower('bloodstone', 'Bloodstone', 'intermediate', 'ruby', '#dc2626', 130, 5, 0.7, 'magic', [
    { type: 'lightning', value: 0.45, maxTargets: 4 },
  ]),
  tower(
    'antique-bloodstone',
    'Antique Bloodstone',
    'advanced',
    'ruby',
    '#991b1b',
    230,
    6,
    0.62,
    'magic',
    [
      { type: 'lightning', value: 0.55, maxTargets: 6 },
      { type: 'burn', value: 18, duration: 4 },
    ],
  ),
  tower('the-crown-prince', 'The Crown Prince', 'top', 'ruby', '#e11d48', 620, 7, 0.55, 'magic', [
    { type: 'lightning', value: 0.7, maxTargets: 8 },
  ]),
  tower('jade', 'Jade', 'basic', 'emerald', '#22c55e', 54, 5, 0.82, 'magic', [
    { type: 'poison', value: 16, duration: 5 },
  ]),
  tower('grey-jade', 'Grey Jade', 'intermediate', 'emerald', '#86efac', 96, 6, 0.72, 'magic', [
    { type: 'poison', value: 32, duration: 5 },
    { type: 'overlook', value: 1 },
  ]),
  tower(
    'monkey-king-jade',
    'Monkey King Jade',
    'advanced',
    'emerald',
    '#16a34a',
    180,
    6,
    0.6,
    'pure',
    [
      { type: 'poison', value: 52, duration: 5 },
      { type: 'overlook', value: 1 },
    ],
  ),
  tower('diamond-cullinan', 'Diamond Cullinan', 'top', 'diamond', '#f8fafc', 920, 7, 0.58, 'pure', [
    { type: 'poison', value: 96, duration: 5 },
    { type: 'overlook', value: 1 },
    { type: 'damageAura', value: 6.4, radius: 5 },
  ]),
  tower('quartz', 'Quartz', 'basic', 'amethyst', '#ddd6fe', 62, 6, 0.75, 'magic', [
    { type: 'antiFly', value: 1 },
  ]),
  tower(
    'lucky-chinese-jade',
    'Lucky Chinese Jade',
    'advanced',
    'emerald',
    '#65a30d',
    210,
    6,
    0.64,
    'magic',
    [
      { type: 'poison', value: 44, duration: 5 },
      { type: 'recover', value: 1 },
      { type: 'antiFly', value: 1 },
    ],
  ),
  tower(
    'charming-lazurite',
    'Charming Lazurite',
    'advanced',
    'sapphire',
    '#38bdf8',
    230,
    7,
    0.62,
    'magic',
    [{ type: 'antiFly', value: 2 }],
  ),
  tower('golden-jubilee', 'Golden Jubilee', 'top', 'topaz', '#facc15', 680, 8, 0.55, 'magic', [
    { type: 'burn', value: 80, duration: 4 },
    { type: 'antiFly', value: 3 },
  ]),
  tower('gold', 'Gold', 'intermediate', 'amethyst', '#fbbf24', 118, 5, 0.78, 'physical', [
    { type: 'corrupt', value: 0.16, duration: 3 },
  ]),
  tower('egypt-gold', 'Egypt Gold', 'advanced', 'amethyst', '#d97706', 250, 6, 0.66, 'physical', [
    { type: 'corrupt', value: 0.28, duration: 4 },
    { type: 'greedy', value: 0.25 },
  ]),
  tower(
    'dark-emerald',
    'Dark Emerald',
    'intermediate',
    'emerald',
    '#047857',
    120,
    5,
    0.75,
    'magic',
    [{ type: 'stun', value: 0.16, duration: 0.5 }],
  ),
  tower('emerald-golem', 'Emerald Golem', 'advanced', 'emerald', '#065f46', 280, 6, 0.7, 'magic', [
    { type: 'stun', value: 0.2, duration: 0.65 },
    { type: 'corrupt', value: 0.2, duration: 4 },
  ]),
  tower(
    'paraiba-tourmaline',
    'Paraiba Tourmaline',
    'intermediate',
    'aquamarine',
    '#2dd4bf',
    132,
    6,
    0.55,
    'magic',
    [{ type: 'decadent', value: 0.2 }],
  ),
  tower(
    'elaborately-carved-tourmaline',
    'Elaborately Carved Tourmaline',
    'advanced',
    'aquamarine',
    '#14b8a6',
    260,
    6,
    0.48,
    'magic',
    [
      { type: 'stun', value: 0.16, duration: 0.55 },
      { type: 'decadent', value: 0.35 },
    ],
  ),
  tower(
    'sapphire-star-of-adam',
    'Sapphire Star of Adam',
    'top',
    'sapphire',
    '#2563eb',
    690,
    8,
    0.5,
    'magic',
    [{ type: 'decadent', value: 0.55 }],
  ),
  tower('deepsea-pearl', 'Deepsea Pearl', 'intermediate', 'opal', '#bae6fd', 95, 6, 0.72, 'magic', [
    { type: 'resist', value: 0.12, radius: 5 },
  ]),
  tower(
    'chrysoberyl-cats-eye',
    "Chrysoberyl Cat's Eye",
    'intermediate',
    'opal',
    '#fef3c7',
    105,
    6,
    0.66,
    'magic',
    [
      { type: 'speedAura', value: 0.6, radius: 5 },
      { type: 'inspire', value: 0.18, radius: 5 },
    ],
  ),
  tower('red-coral', 'Red Coral', 'advanced', 'opal', '#f87171', 190, 6, 0.58, 'magic', [
    { type: 'speedAura', value: 0.7, radius: 5 },
    { type: 'inspire', value: 0.24, radius: 5 },
    { type: 'resist', value: 0.18, radius: 5 },
  ]),
  tower('carmen-lucia', 'Carmen-Lucia', 'top', 'opal', '#fb7185', 500, 7, 0.42, 'magic', [
    { type: 'speedAura', value: 5, radius: 6 },
  ]),
  tower(
    'yellow-saphire',
    'Yellow Saphire',
    'intermediate',
    'topaz',
    '#fde047',
    132,
    6,
    0.66,
    'magic',
    [{ type: 'slow', value: 0.36, duration: 2.2, radius: 1.4 }],
  ),
  tower(
    'northern-sabers-eye',
    "Northern Saber's Eye",
    'advanced',
    'topaz',
    '#f59e0b',
    260,
    7,
    0.58,
    'magic',
    [
      { type: 'slow', value: 0.42, duration: 2.4, radius: 1.6 },
      { type: 'lightning', value: 0.4, maxTargets: 4 },
    ],
  ),
  tower('star-sapphire', 'Star Sapphire', 'top', 'sapphire', '#60a5fa', 640, 8, 0.5, 'magic', [
    { type: 'slow', value: 0.52, duration: 2.8, radius: 2 },
  ]),
  tower('agate', 'Agate', 'secret', 'topaz', '#fb923c', 340, 7, 0.52, 'physical', [
    { type: 'split', value: 1, maxTargets: 7 },
  ]),
  tower('obsidian', 'Obsidian', 'secret', 'sapphire', '#1f2937', 360, 6, 0.6, 'physical', [
    { type: 'cleave', value: 0.7, radius: 5, damageType: 'pure' },
    { type: 'slow', value: 0.42, duration: 2.4 },
  ]),
  tower(
    'fantastic-miss-shrimp',
    'Fantastic Miss Shrimp',
    'secret',
    'ruby',
    '#f472b6',
    390,
    7,
    0.5,
    'magic',
    [{ type: 'lightning', value: 0.65, maxTargets: 7 }],
  ),
  tower('geluanshi', 'Geluanshi', 'secret', 'amethyst', '#a78bfa', 420, 7, 0.52, 'pure', [
    { type: 'decadent', value: 0.4 },
    { type: 'armorBreak', value: 64 },
    { type: 'antiFly', value: 3 },
  ]),
  tower(
    'the-burning-stone',
    'The Burning Stone',
    'secret',
    'ruby',
    '#ef4444',
    410,
    6,
    0.55,
    'magic',
    [{ type: 'burn', value: 90, duration: 5 }],
  ),
  tower('ehome', 'Ehome', 'secret', 'opal', '#f5d0fe', 180, 7, 0.38, 'magic', [
    { type: 'speedAura', value: 0.9, radius: 7 },
  ]),
  tower('wings-stone', 'Wings Stone', 'secret', 'topaz', '#f97316', 300, 50, 0.62, 'pure', [
    { type: 'antiFly', value: 3 },
  ]),
);

export const recipes: readonly RecipeDefinition[] = [
  r('silver', 'Silver', 'basic', 'Slow 2', 'silver', ['sapphire-1', 'diamond-1', 'topaz-1']),
  r('silver-knight', 'Silver Knight', 'intermediate', 'Cleave 3 and Slow 3', 'silver-knight', [
    'silver',
    'aquamarine-2',
    'ruby-3',
  ]),
  r('pink-diamond', 'Pink Diamond', 'intermediate', 'Crit 1 and damage', 'pink-diamond', [
    'diamond-5',
    'diamond-3',
    'topaz-3',
  ]),
  r(
    'huge-pink-diamond',
    'Huge Pink Diamond',
    'advanced',
    'Cleave, crit, damage, and slow',
    'huge-pink-diamond',
    ['pink-diamond', 'silver-knight', 'silver'],
  ),
  r(
    'koh-i-noor-diamond',
    'Koh-i-noor Diamond',
    'top',
    'High-damage crit top tower',
    'koh-i-noor-diamond',
    ['huge-pink-diamond', 'amethyst-6', 'diamond-6'],
  ),
  r('malachite', 'Malachite', 'basic', 'Split 1', 'malachite', [
    'opal-1',
    'emerald-1',
    'aquamarine-1',
  ]),
  r('vivid-malachite', 'Vivid Malachite', 'intermediate', 'Split 2', 'vivid-malachite', [
    'malachite',
    'diamond-2',
    'topaz-3',
  ]),
  r('uranium-238', 'Uranium-238', 'intermediate', 'Split 2', 'uranium-238', [
    'topaz-5',
    'sapphire-3',
    'opal-2',
  ]),
  r('uranium-235', 'Uranium-235', 'advanced', 'Radiation up to 10 targets', 'uranium-235', [
    'uranium-238',
    'malachite',
    'vivid-malachite',
  ]),
  r('asteriated-ruby', 'Asteriated Ruby', 'basic', 'Burn 1', 'asteriated-ruby', [
    'ruby-2',
    'ruby-1',
    'amethyst-1',
  ]),
  r('volcano', 'Volcano', 'intermediate', 'Burn 2', 'volcano', [
    'asteriated-ruby',
    'ruby-4',
    'amethyst-3',
  ]),
  r('bloodstone', 'Bloodstone', 'intermediate', 'Lightning chain', 'bloodstone', [
    'ruby-5',
    'aquamarine-4',
    'amethyst-3',
  ]),
  r(
    'antique-bloodstone',
    'Antique Bloodstone',
    'advanced',
    'Forked lightning and burn',
    'antique-bloodstone',
    ['bloodstone', 'volcano', 'ruby-2'],
  ),
  r('the-crown-prince', 'The Crown Prince', 'top', 'Bloodstone top tower', 'the-crown-prince', [
    'antique-bloodstone',
    'ruby-6',
    'emerald-6',
  ]),
  r('jade', 'Jade', 'basic', 'Poison 4', 'jade', ['emerald-3', 'opal-3', 'sapphire-2']),
  r('grey-jade', 'Grey Jade', 'intermediate', 'Overlook and Poison 5', 'grey-jade', [
    'jade',
    'sapphire-4',
    'aquamarine-3',
  ]),
  r(
    'monkey-king-jade',
    'Monkey King Jade',
    'advanced',
    'Poison, overlook, and true strike',
    'monkey-king-jade',
    ['grey-jade', 'emerald-4', 'amethyst-2'],
  ),
  r('diamond-cullinan', 'Diamond Cullinan', 'top', 'Poison and high damage', 'diamond-cullinan', [
    'monkey-king-jade',
    'diamond-6',
    'sapphire-6',
  ]),
  r('quartz', 'Quartz', 'basic', 'Anti-Fly 1', 'quartz', ['emerald-4', 'ruby-3', 'amethyst-2']),
  r(
    'lucky-chinese-jade',
    'Lucky Chinese Jade',
    'advanced',
    'Poison, recover, and anti-fly',
    'lucky-chinese-jade',
    ['quartz', 'jade', 'emerald-3'],
  ),
  r('charming-lazurite', 'Charming Lazurite', 'advanced', 'Anti-Fly 2', 'charming-lazurite', [
    'quartz',
    'amethyst-4',
    'topaz-2',
  ]),
  r('golden-jubilee', 'Golden Jubilee', 'top', 'Burned and Anti-Fly 3', 'golden-jubilee', [
    'charming-lazurite',
    'topaz-6',
    'ruby-6',
  ]),
  r('gold', 'Gold', 'intermediate', 'Corrupt 1', 'gold', ['amethyst-5', 'amethyst-4', 'diamond-2']),
  r('egypt-gold', 'Egypt Gold', 'advanced', 'Corrupt 2 and greedy', 'egypt-gold', [
    'gold',
    'amethyst-5',
    'aquamarine-2',
  ]),
  r('dark-emerald', 'Dark Emerald', 'intermediate', 'Stun', 'dark-emerald', [
    'emerald-5',
    'sapphire-4',
    'topaz-2',
  ]),
  r(
    'emerald-golem',
    'Emerald Golem',
    'advanced',
    'Stun, corrupt, and stone gaze',
    'emerald-golem',
    ['dark-emerald', 'gold', 'diamond-3'],
  ),
  r('paraiba-tourmaline', 'Paraiba Tourmaline', 'intermediate', 'Decadent', 'paraiba-tourmaline', [
    'aquamarine-5',
    'opal-4',
    'emerald-2',
  ]),
  r(
    'elaborately-carved-tourmaline',
    'Elaborately Carved Tourmaline',
    'advanced',
    'Stun and Decadent 2',
    'elaborately-carved-tourmaline',
    ['dark-emerald', 'paraiba-tourmaline', 'emerald-2'],
  ),
  r(
    'sapphire-star-of-adam',
    'Sapphire Star of Adam',
    'top',
    'Tourmaline top tower',
    'sapphire-star-of-adam',
    ['elaborately-carved-tourmaline', 'emerald-6', 'amethyst-6'],
  ),
  r('deepsea-pearl', 'Deepsea Pearl', 'intermediate', 'Magic resistance aura', 'deepsea-pearl', [
    'aquamarine-4',
    'diamond-4',
    'opal-2',
  ]),
  r(
    'chrysoberyl-cats-eye',
    "Chrysoberyl Cat's Eye",
    'intermediate',
    'Aura 5 and inspire',
    'chrysoberyl-cats-eye',
    ['opal-5', 'diamond-4', 'aquamarine-3'],
  ),
  r('red-coral', 'Red Coral', 'advanced', 'Aura, inspire, and resist', 'red-coral', [
    'deepsea-pearl',
    'chrysoberyl-cats-eye',
    'opal-4',
  ]),
  r('carmen-lucia', 'Carmen-Lucia', 'top', 'Otomad and huge attack speed aura', 'carmen-lucia', [
    'red-coral',
    'opal-6',
    'aquamarine-6',
  ]),
  r('yellow-saphire', 'Yellow Saphire', 'intermediate', 'Ice', 'yellow-saphire', [
    'sapphire-5',
    'ruby-4',
    'topaz-4',
  ]),
  r(
    'northern-sabers-eye',
    "Northern Saber's Eye",
    'advanced',
    'Upgrade path tower',
    'northern-sabers-eye',
    ['yellow-saphire', 'bloodstone', 'sapphire-5'],
  ),
  r('star-sapphire', 'Star Sapphire', 'top', 'Upgrade path tower', 'star-sapphire', [
    'yellow-saphire',
    'sapphire-6',
    'opal-6',
  ]),
  r(
    'agate',
    'Agate',
    'secret',
    'Split 2, attacks up to 7 enemies',
    'agate',
    ['emerald-5', 'opal-5', 'aquamarine-5'],
    true,
  ),
  r(
    'obsidian',
    'Obsidian',
    'secret',
    'Cleave 5 and Slow 5',
    'obsidian',
    ['diamond-5', 'sapphire-5', 'topaz-5'],
    true,
  ),
  r(
    'fantastic-miss-shrimp',
    'Fantastic Miss Shrimp',
    'secret',
    'Lightning chain and forked lightning',
    'fantastic-miss-shrimp',
    ['emerald-5', 'sapphire-5', 'ruby-5'],
    true,
  ),
  r(
    'geluanshi',
    'Geluanshi',
    'secret',
    'Decadent, pierce max, and anti-fly',
    'geluanshi',
    ['sapphire-5', 'emerald-5', 'sapphire-4', 'emerald-4'],
    true,
  ),
  r(
    'the-burning-stone',
    'The Burning Stone',
    'secret',
    'Burn 3',
    'the-burning-stone',
    ['ruby-5', 'ruby-4', 'amethyst-5', 'amethyst-4'],
    true,
  ),
  r(
    'ehome',
    'Ehome',
    'secret',
    'Aura Max and Otomad',
    'ehome',
    ['opal-1', 'opal-2', 'opal-3', 'opal-4', 'opal-5'],
    true,
  ),
  r(
    'wings-stone',
    'Wings Stone',
    'secret',
    'Burned and random damage on build',
    'wings-stone',
    ['topaz-1', 'topaz-2', 'topaz-3', 'topaz-4', 'topaz-5'],
    true,
  ),
  r(
    'diamond-cullinan-secret',
    'Diamond Cullinan',
    'secret',
    'One-hit secret version of Diamond Cullinan',
    'diamond-cullinan',
    ['diamond-1', 'diamond-2', 'diamond-3', 'diamond-4', 'diamond-5'],
    true,
  ),
];

function r(
  id: string,
  name: string,
  classification: Exclude<TowerClass, 'gem'>,
  description: string,
  resultGemId: string,
  ingredients: readonly string[],
  hidden = false,
): RecipeDefinition {
  return {
    id,
    name,
    classification,
    description,
    resultGemId,
    hidden,
    oneRoundOnly: hidden,
    ingredients: ingredients.map((ingredient) =>
      ingredient.includes('-') && /\d$/.test(ingredient)
        ? { gemId: ingredient }
        : { towerId: ingredient },
    ),
  };
}

export const defaultMap: MapDefinition = {
  id: 'gem-castle-pass',
  name: 'Gem Castle Pass',
  width: 24,
  height: 16,
  entrance: { x: 0, y: 7 },
  checkpoints: [
    { x: 4, y: 3 },
    { x: 10, y: 12 },
    { x: 16, y: 3 },
    { x: 21, y: 11 },
    { x: 23, y: 7 },
  ],
  exit: { x: 23, y: 7 },
  blocked: [],
};

export const enemies: readonly EnemyDefinition[] = [
  e('frenzied-pig', 'Frenzied Pig', 55, 1.25, 6, 0, '#fca5a5'),
  e('swift-frog', 'Swift Frog', 70, 1.55, 7, 0, '#86efac'),
  e('sturdy-yak', 'Sturdy Yak', 105, 1.1, 8, 2, '#a78bfa'),
  e('smart-robot', 'Smart Robot', 130, 1.2, 9, 3, '#94a3b8'),
  e('baby-panda', 'Baby Panda', 160, 1.25, 10, 1, '#f8fafc', ['flying']),
  e('balloon-badger', 'Balloon Badger', 150, 1.35, 10, 0, '#fbbf24', ['flying']),
  e('tardy-stump', 'Tardy Stump', 210, 0.9, 11, 4, '#92400e'),
  e('satisfied-lizard', 'Satisfied Lizard', 230, 1.2, 12, 2, '#bef264'),
  e('invisible-spider', 'Invisible Spider', 250, 1.25, 13, 1, '#c084fc', [
    'vitality',
    'permanentInvisibility',
  ]),
  e('dusky', 'Dusky', 290, 1.3, 14, 2, '#64748b', ['evasion']),
  e('invincible-dog', 'Invincible Dog', 900, 1, 45, 6, '#fef08a', [], true),
  e('sheep', 'Sheep', 380, 1.25, 15, 2, '#f1f5f9'),
  e('funny-alpaca', 'Funny Alpaca', 430, 1.25, 16, 2, '#fed7aa', ['disarm']),
  e('pig-princess', 'Pig Princess', 500, 1.15, 17, 3, '#f9a8d4'),
  e('bulldog', 'Bulldog', 560, 1.2, 18, 4, '#a16207', ['refraction']),
  e('bamboo-addict', 'Bamboo Addict', 620, 1.25, 19, 3, '#4ade80', ['flying', 'vitality']),
  e('cat-dog', 'Cat & Dog', 630, 1.32, 19, 2, '#fb923c', ['flying', 'vitality']),
  e('young-demon', 'Young Demon', 720, 1.3, 20, 3, '#ef4444', ['magicImmune', 'thief']),
  e('belted-chicken', 'Belted Chicken', 790, 1.35, 21, 3, '#fde047', ['untouchable']),
  e('bajie', 'Bajie', 900, 1.2, 22, 4, '#f97316', ['permanentInvisibility', 'disarm']),
  e('donkeytrio', 'Donkeytrio', 980, 1.55, 23, 3, '#a3a3a3', ['rush']),
  e('shakbag', 'Shakbag', 2600, 0.95, 70, 8, '#e879f9', [], true),
  e('crab', 'Crab', 1320, 1.1, 25, 5, '#fb7185', ['vitality']),
  e('lockyaw', 'Lockyaw', 1480, 1.05, 26, 14, '#78716c', ['highArmor']),
  e('flopjaw', 'Flopjaw', 1600, 1.15, 27, 6, '#22d3ee', ['physicalImmune', 'refraction']),
  e('mech-donkey', 'Mech Donkey', 1780, 1.16, 28, 8, '#94a3b8', ['reactiveArmor']),
  e('cosair', 'Cosair', 1900, 1.25, 29, 14, '#bae6fd', ['flying', 'highArmor']),
  e('skateboard-flamingo', 'Skateboard Flamingo', 2150, 1.55, 30, 4, '#f0abfc', ['magicImmune']),
  e('lgd-goldfish', 'LGD Goldfish', 2320, 1.35, 31, 5, '#facc15', [
    'flying',
    'untouchable',
    'physicalImmune',
  ]),
  e('jellyfish', 'Jellyfish', 2240, 1.42, 31, 3, '#67e8f9', [
    'flying',
    'untouchable',
    'physicalImmune',
  ]),
  e('timbersaw', 'Timbersaw', 2500, 1.32, 32, 8, '#d6d3d1', ['flying', 'reactiveArmor']),
  e('ig-dragon', 'IG Dragon', 2620, 1.28, 32, 9, '#f97316', ['flying', 'reactiveArmor']),
  e('vg-fox', 'VG Fox', 2860, 1.45, 33, 5, '#fb923c', ['flying', 'evasion', 'refraction']),
  e('carpet-rider', 'Carpet Rider', 7200, 1.15, 95, 8, '#c4b5fd', ['flying'], true),
  e('zard', 'Zard-', 7600, 1.12, 110, 9, '#f87171', ['flying'], true),
  e('bookwyrm', 'Bookwyrm', 3500, 1.25, 36, 7, '#a78bfa', ['magicImmune', 'refraction']),
  e('otterdragon', 'Otterdragon', 3500, 1.25, 36, 7, '#38bdf8', ['physicalImmune', 'refraction']),
  e('recharable-shark', 'Recharable Shark', 3900, 1.24, 37, 8, '#60a5fa', ['recharge']),
  e('ribboned-zombie', 'Ribboned Zombie', 4200, 1.2, 38, 8, '#86efac', ['physicalImmune', 'blink']),
  e('babybloody', 'Babybloody', 4500, 1.48, 39, 5, '#ef4444', ['flying', 'evasion', 'thief']),
  e('black-white-fox', 'Black & White Fox', 4800, 1.36, 40, 6, '#f8fafc', [
    'flying',
    'magicImmune',
  ]),
  e('jumo', 'Jumo', 5200, 1.22, 41, 8, '#fbbf24', ['physicalImmune']),
  e('baeko', 'Baeko', 5600, 1.32, 42, 8, '#fef3c7', ['blink']),
  e('lilnova', 'Lilnova', 6100, 1.3, 43, 7, '#c084fc', ['cloakAndDagger']),
  e('newt', 'Newt', 6500, 1.42, 44, 7, '#22c55e', [
    'flying',
    'untouchable',
    'krakenShell',
    'evasion',
  ]),
  e(
    'thrilling-ghost',
    'Thrilling Ghost',
    15000,
    1.18,
    140,
    10,
    '#ddd6fe',
    ['flying', 'krakenShell'],
    true,
  ),
  e('azuremir', 'Azuremir', 7600, 1.28, 47, 8, '#38bdf8', ['refraction']),
  e('jade-dragon', 'Jade Dragon', 7900, 1.24, 47, 8, '#4ade80', ['refraction']),
  e('kupu', 'Kupu', 8300, 1.5, 48, 7, '#f0abfc', ['flying', 'magicImmune', 'rush']),
  e('furry-fish', 'Furry fish', 8800, 1.35, 49, 8, '#67e8f9', [
    'untouchable',
    'evasion',
    'recharge',
  ]),
  e('shroomy', 'Shroomy', 9400, 1.3, 50, 9, '#a3e635', ['magicImmune', 'blink']),
  e('chirpy', 'Chirpy', 10000, 1.44, 51, 8, '#fde047', ['flying', 'disarm']),
  e('boooofus', 'Boooofus', 10800, 1.24, 52, 10, '#cbd5e1', ['physicalImmune']),
  e('crummy', 'Crummy', 11600, 1.5, 53, 9, '#fb7185', ['magicImmune', 'untouchable', 'rush']),
  e('wabbit', 'Wabbit', 12400, 1.52, 54, 7, '#f9a8d4', [
    'flying',
    'magicImmune',
    'disarm',
    'evasion',
    'thief',
  ]),
  e('drodo', 'Drodo', 13200, 1.28, 55, 10, '#facc15', ['krakenShell', 'recharge']),
  e('baby-roshan', 'Baby Roshan', 32000, 1.08, 220, 14, '#a78bfa', ['flying', 'krakenShell'], true),
  e(
    'golden-baby-roshan',
    'Golden Baby Roshan',
    36000,
    1.08,
    260,
    16,
    '#facc15',
    ['flying', 'krakenShell', 'magicImmune'],
    true,
  ),
  e(
    'platinum-baby-roshan',
    'Platinum Baby Roshan',
    42000,
    1.05,
    320,
    18,
    '#e0f2fe',
    ['flying', 'krakenShell', 'magicImmune'],
    true,
  ),
];

function e(
  id: string,
  name: string,
  hp: number,
  speed: number,
  reward: number,
  armor: number,
  color: string,
  skills: readonly EnemySkill[] = [],
  boss = false,
): EnemyDefinition {
  return {
    id,
    name,
    hp,
    speed,
    reward,
    armor,
    color,
    skills,
    boss,
    flying: skills.includes('flying'),
  };
}

export const waves: readonly WaveDefinition[] = [
  w(1, 'Frenzied Pig', 'frenzied-pig', 14, 0.62),
  w(2, 'Swift Frog', 'swift-frog', 16, 0.58),
  w(3, 'Sturdy Yak', 'sturdy-yak', 18, 0.56),
  w(4, 'Smart Robot', 'smart-robot', 19, 0.54),
  w(5, 'Baby Panda or Balloon Badger', 'baby-panda', 20, 0.52, ['balloon-badger'], ['flying']),
  w(6, 'Tardy Stump', 'tardy-stump', 22, 0.5),
  w(7, 'Satisfied Lizard', 'satisfied-lizard', 23, 0.49),
  w(8, 'Invisible Spider', 'invisible-spider', 23, 0.48, [], ['vitality', 'permanentInvisibility']),
  w(9, 'Dusky', 'dusky', 24, 0.47, [], ['evasion']),
  w(10, 'Invincible Dog', 'invincible-dog', 1, 2.2, [], [], true),
  w(11, 'Sheep', 'sheep', 25, 0.46),
  w(12, 'Funny Alpaca', 'funny-alpaca', 25, 0.46, [], ['disarm']),
  w(13, 'Pig Princess', 'pig-princess', 26, 0.45),
  w(14, 'Bulldog', 'bulldog', 26, 0.45, [], ['refraction']),
  w(
    15,
    'Bamboo Addict or Cat & Dog',
    'bamboo-addict',
    27,
    0.44,
    ['cat-dog'],
    ['flying', 'vitality'],
  ),
  w(16, 'Young Demon', 'young-demon', 27, 0.44, [], ['magicImmune', 'thief']),
  w(17, 'Belted Chicken', 'belted-chicken', 28, 0.43, [], ['untouchable']),
  w(18, 'Bajie', 'bajie', 28, 0.43, [], ['permanentInvisibility', 'disarm']),
  w(19, 'Donkeytrio', 'donkeytrio', 30, 0.42, [], ['rush']),
  w(20, 'Shakbag', 'shakbag', 1, 2.1, [], [], true),
  w(21, 'Crab', 'crab', 30, 0.42, [], ['vitality']),
  w(22, 'Lockyaw', 'lockyaw', 30, 0.42, [], ['highArmor']),
  w(23, 'Flopjaw', 'flopjaw', 31, 0.41, [], ['physicalImmune', 'refraction']),
  w(24, 'Mech Donkey', 'mech-donkey', 31, 0.41, [], ['reactiveArmor']),
  w(25, 'Cosair', 'cosair', 32, 0.4, [], ['flying', 'highArmor']),
  w(26, 'Skateboard Flamingo', 'skateboard-flamingo', 32, 0.4, [], ['magicImmune']),
  w(
    27,
    'LGD Goldfish or Jellyfish',
    'lgd-goldfish',
    33,
    0.39,
    ['jellyfish'],
    ['flying', 'untouchable', 'physicalImmune'],
  ),
  w(
    28,
    'Timbersaw or IG Dragon',
    'timbersaw',
    33,
    0.39,
    ['ig-dragon'],
    ['flying', 'reactiveArmor'],
  ),
  w(29, 'VG Fox', 'vg-fox', 34, 0.38, [], ['flying', 'evasion', 'refraction']),
  w(30, 'Carpet Rider or Zard-', 'carpet-rider', 1, 2, ['zard'], ['flying'], true),
  w(31, 'Bookwyrm or Otterdragon', 'bookwyrm', 34, 0.38, ['otterdragon'], ['refraction']),
  w(32, 'Recharable Shark', 'recharable-shark', 35, 0.37, [], ['recharge']),
  w(33, 'Ribboned Zombie', 'ribboned-zombie', 35, 0.37, [], ['physicalImmune', 'blink']),
  w(34, 'Babybloody', 'babybloody', 36, 0.36, [], ['flying', 'evasion', 'thief']),
  w(35, 'Black & White Fox', 'black-white-fox', 36, 0.36, [], ['flying', 'magicImmune']),
  w(36, 'Jumo', 'jumo', 37, 0.35, [], ['physicalImmune']),
  w(37, 'Baeko', 'baeko', 37, 0.35, [], ['blink']),
  w(38, 'Lilnova', 'lilnova', 38, 0.34, [], ['cloakAndDagger']),
  w(39, 'Newt', 'newt', 38, 0.34, [], ['flying', 'untouchable', 'krakenShell', 'evasion']),
  w(40, 'Thrilling Ghost', 'thrilling-ghost', 1, 1.9, [], ['flying', 'krakenShell'], true),
  w(41, 'Azuremir or Jade Dragon', 'azuremir', 39, 0.33, ['jade-dragon'], ['refraction']),
  w(42, 'Kupu', 'kupu', 39, 0.33, [], ['flying', 'magicImmune', 'rush']),
  w(43, 'Furry fish', 'furry-fish', 40, 0.32, [], ['untouchable', 'evasion', 'recharge']),
  w(44, 'Shroomy', 'shroomy', 40, 0.32, [], ['magicImmune', 'blink']),
  w(45, 'Chirpy', 'chirpy', 41, 0.31, [], ['flying', 'disarm']),
  w(46, 'Boooofus', 'boooofus', 41, 0.31, [], ['physicalImmune']),
  w(47, 'Crummy', 'crummy', 42, 0.3, [], ['magicImmune', 'untouchable', 'rush']),
  w(48, 'Wabbit', 'wabbit', 42, 0.3, [], ['flying', 'magicImmune', 'disarm', 'evasion', 'thief']),
  w(49, 'Drodo', 'drodo', 43, 0.29, [], ['krakenShell', 'recharge']),
  w(
    50,
    'Baby Roshan variants',
    'baby-roshan',
    1,
    1.8,
    ['golden-baby-roshan', 'platinum-baby-roshan'],
    ['flying', 'krakenShell'],
    true,
  ),
];

function w(
  wave: number,
  name: string,
  enemyId: string,
  count: number,
  spawnInterval: number,
  alternativeEnemyIds: readonly string[] = [],
  skills: readonly EnemySkill[] = [],
  boss = false,
): WaveDefinition {
  return {
    id: `w${wave}`,
    wave,
    name,
    enemyId,
    alternativeEnemyIds,
    count,
    spawnInterval,
    skills,
    boss,
  };
}

export const skills: readonly SkillDefinition[] = [
  s('heal', 'Heal', 'common', 'Heal a random amount.', [400, 400, 400, 400], true),
  s('guard', 'Guard', 'common', 'Lower castle leak damage for 60s.', [300, 300, 300, 300], true),
  s(
    'evade',
    'Evade',
    'common',
    'Castle can evade leak damage for 300s.',
    [500, 500, 500, 500],
    true,
  ),
  s(
    'revenge',
    'Revenge',
    'common',
    'More tower damage below 60% castle health.',
    [0, 0, 0, 0],
    false,
  ),
  s(
    'gemPray',
    'Gem Pray',
    'rare',
    'Bias future candidates toward the selected family.',
    [200, 200, 200, 200],
    true,
  ),
  s(
    'gemQualityPray',
    'Gem Quality Pray',
    'rare',
    'Improve gem quality odds.',
    [200, 200, 200, 200],
    true,
  ),
  s(
    'adjacentSwap',
    'Adjacent Swap',
    'rare',
    'Swap a gem with a nearby stone.',
    [275, 175, 125, 100],
    true,
  ),
  s(
    'timelapse',
    'Timelapse',
    'mythical',
    'Replace the remaining build candidates.',
    [600, 500, 400, 300],
    true,
  ),
  s('hammer', 'Hammer', 'mythical', 'Downgrade a gem by one level.', [250, 150, 100, 75], true),
  s(
    'attackSpeed',
    'Attack Speed',
    'mythical',
    'Buff one tower attack speed for 60s.',
    [200, 200, 200, 200],
    true,
  ),
  s('aim', 'Aim', 'mythical', 'Buff one tower range for 60s.', [100, 100, 100, 100], true),
  s(
    'crit',
    'Crit',
    'mythical',
    'Add high critical strike chance for 60s.',
    [200, 200, 200, 200],
    true,
  ),
  s(
    'fatalBonds',
    'Fatal Bonds',
    'mythical',
    'Linked enemies share bonus damage.',
    [0, 0, 0, 0],
    true,
  ),
  s('swap', 'Swap', 'legendary', 'Swap positions of two towers.', [375, 275, 225, 200], true),
  s(
    'flawlessPray',
    'Flawless Pray',
    'mythical',
    'Increase flawless gem chance.',
    [200, 200, 200, 200],
    true,
  ),
  s(
    'perfectPray',
    'Perfect Pray',
    'legendary',
    'Increase perfect gem chance.',
    [400, 400, 400, 400],
    true,
  ),
  s(
    'candyMaker',
    'Candy Maker',
    'legendary',
    'Place candy that slows enemies once per turn.',
    [375, 300, 250, 225],
    true,
  ),
];

function s(
  id: SkillDefinition['id'],
  name: string,
  rarity: SkillDefinition['rarity'],
  description: string,
  goldCosts: readonly number[],
  active: boolean,
): SkillDefinition {
  return { id, name, rarity, description, goldCosts, active };
}

export const quests: readonly QuestDefinition[] = [
  q('full-health', 'Complete all levels with the Gem Castle at full health.'),
  q('secret-only', 'Complete all levels with any single-round only tower.'),
  q('under-40', 'Complete all levels within 40 minutes.'),
  q('under-60', 'Complete all levels within 60 minutes.'),
  q('no-amethyst', 'Complete all levels without any Amethyst settled.'),
  q('no-single-round', 'Complete all levels without any single-round combination.'),
  q('no-malachite', 'Complete all levels without any Malachite.'),
  q('kill-golden-roshan', 'Complete all levels and kill Golden Baby Roshan.'),
  q('five-mvps', 'Complete all levels with 5 MVPs.'),
  q('kill-zard', 'Complete all levels and kill Zard-.'),
  q('finish-four-random', 'Finish 4 Random Quests.', true),
  q('complete-all', 'Complete all levels.', true, 7),
  q('season-award', 'Season award.', true, 30),
];

function q(id: string, name: string, fixed = false, cooldownDays?: number): QuestDefinition {
  return { id, name, fixed, cooldownDays };
}

export const ranks: readonly RankDefinition[] = [
  { id: 'gray-gem', name: 'Gray Gem', percentage: '80-100%' },
  { id: 'light-blue-gem', name: 'Light Blue Gem', percentage: '30-80%' },
  { id: 'deep-blue-gem', name: 'Deep Blue Gem', percentage: '11-29%' },
  { id: 'purple-gem', name: 'Purple Gem', percentage: '3-10%' },
  { id: 'golden-gem', name: 'Golden Gem', percentage: '1-2%' },
  { id: 'crown', name: 'Crown', percentage: 'Top 100' },
];

export const towerShop = [
  { gemId: 'amethyst-1', cost: 95 },
  { gemId: 'aquamarine-1', cost: 120 },
  { gemId: 'diamond-1', cost: 145 },
  { gemId: 'emerald-1', cost: 110 },
  { gemId: 'opal-1', cost: 90 },
  { gemId: 'ruby-1', cost: 130 },
  { gemId: 'sapphire-1', cost: 115 },
  { gemId: 'topaz-1', cost: 125 },
] as const;

const activeSkillIds = new Set<SkillDefinition['id']>([
  'heal',
  'guard',
  'evade',
  'revenge',
  'adjacentSwap',
  'attackSpeed',
  'aim',
  'crit',
  'fatalBonds',
  'swap',
  'candyMaker',
]);

export const shopQuests: readonly QuestDefinition[] = [
  q('full-health', 'Complete all levels with the Gem Castle at full health.'),
  q('under-40', 'Complete all levels within 40 minutes.'),
  q('under-60', 'Complete all levels within 60 minutes.'),
  q('build-25-blocks', 'Place 25 free maze blocks.'),
  q('buy-20-towers', 'Buy 20 shop towers.'),
  q('upgrade-30-times', 'Buy 30 tower upgrades.'),
  q('five-mvps', 'Complete all levels with 5 MVPs.'),
  q('kill-golden-roshan', 'Complete all levels and kill Golden Baby Roshan.'),
  q('kill-zard', 'Complete all levels and kill Zard-.'),
  q('complete-all', 'Complete all levels.', true, 7),
  q('season-award', 'Season award.', true, 30),
];

export const gameConfig: GameConfig = {
  map: defaultMap,
  gems,
  recipes: [],
  towerShop,
  towerUpgradeCosts: {
    tierBase: 180,
    tierGrowth: 1.72,
    damageBase: 95,
    speedBase: 115,
    rangeBase: 105,
    statGrowth: 1.55,
    maxStatLevel: 5,
  },
  freeBlocksPerWave: 5,
  maxBankedFreeBlocks: 15,
  enemies,
  waves,
  skills: skills.filter((skill) => activeSkillIds.has(skill.id)),
  quests: shopQuests,
  ranks,
  economy: {
    startingGold: 625,
    startingLives: 100,
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

export function getSkill(config: GameConfig, skillId: SkillDefinition['id']): SkillDefinition {
  for (let i = 0; i < config.skills.length; i++) {
    if (config.skills[i].id === skillId) return config.skills[i];
  }
  throw new Error(`Missing skill definition: ${skillId}`);
}
