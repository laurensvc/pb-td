import type { EnemyId, BaseGemFamilyId, GemFamilyId, GemLevel } from '../game/types';
import { BASE_GEM_FAMILIES, HYBRID_GEM_FAMILIES } from '../game/content';

export const TILE_SIZE = 32;
export const GEM_SPRITE_SIZE = 48;
export const ENEMY_FRAME_SIZE = 48;
export const ENEMY_WALK_FRAMES = 4;

export const CHECKPOINT_LEVELS = [1, 2, 3, 4, 5] as const;
export type CheckpointLevel = (typeof CHECKPOINT_LEVELS)[number];

export const ASSET_PATHS = {
  terrainVoid: '/assets/terrain/hex-rock-floor.png',
  terrainGem: '/assets/terrain/hex-gem-floor.png',
  terrainPath: '/assets/terrain/hex-path-floor.png',
  terrainFloorVariants: '/assets/terrain/floor-variants.png',
  rock: '/assets/objects/rock.png',
  spawnPortal: '/assets/objects/spawn-portal.png',
  goalNexus: '/assets/objects/goal-nexus.png',
  fxMergeBurst: '/assets/fx/merge-burst.png',
  fxHitSpark: '/assets/fx/hit-spark.png',
} as const;

export const PROJECTILE_BRANCHES = [
  'kinetic',
  'verdant',
  'arcane',
  'nova',
  'prism',
] as const satisfies readonly BaseGemFamilyId[];

export type ProjectileBranch = (typeof PROJECTILE_BRANCHES)[number];

const HYBRID_PROJECTILE_BRANCH: Partial<Record<GemFamilyId, ProjectileBranch>> = {
  toxic_shot: 'verdant',
  plasma_mortar: 'nova',
  pierce_crystal: 'kinetic',
  spore_bomb: 'verdant',
  slayer_shard: 'prism',
  venom_lens: 'arcane',
  shatter_star: 'nova',
  executioner: 'prism',
  ember_lance: 'kinetic',
  solar_flare: 'nova',
  ember: 'nova',
};

export function projectileVisualBranch(family: GemFamilyId): ProjectileBranch {
  if ((PROJECTILE_BRANCHES as readonly string[]).includes(family)) {
    return family as ProjectileBranch;
  }
  return HYBRID_PROJECTILE_BRANCH[family] ?? 'kinetic';
}

export function projectileTextureKey(branch: ProjectileBranch): string {
  return `projectile-${branch}`;
}

export function projectileAssetPath(branch: ProjectileBranch): string {
  return `/assets/fx/projectiles/${branch}.png`;
}

export function fxTextureKey(kind: 'merge-burst' | 'hit-spark'): string {
  return `fx-${kind}`;
}

/** Wang tileset columns in `floor-variants.png` (16 tiles @ 32px). */
export const FLOOR_VARIANT_TILE_SIZE = 32;
export const FLOOR_VARIANT_COLUMNS = 4;
export const FLOOR_VARIANT_COUNT = 5;

export function floorVariantFrame(variantIndex: number): number {
  return variantIndex % FLOOR_VARIANT_COUNT;
}

export function terrainVariantIndex(q: number, r: number): number {
  return Math.abs((q * 7 + r * 13) % FLOOR_VARIANT_COUNT);
}

export function checkpointTextureKey(level: CheckpointLevel): string {
  return `checkpoint-${level}`;
}

export function checkpointAssetPath(level: CheckpointLevel): string {
  return `/assets/terrain/checkpoints/${level}.png`;
}

/** Wang tileset frame index per checkerboard parity (4×4 grid of 32px tiles). */
export const TERRAIN_FRAMES = {
  rockCell: 'void-0',
  gemCell: 'gem-1',
  pathOverlay: 'void-6',
} as const;

export function gemTextureKey(family: GemFamilyId, level: GemLevel): string {
  return `gem-${family}-l${level}`;
}

export function gemAssetPath(family: GemFamilyId, level: GemLevel): string {
  return `/assets/gems/${family}/L${level}.png`;
}

export function enemyWalkTextureKey(enemyId: EnemyId): string {
  return `enemy-${enemyId}-walk`;
}

export function enemyWalkAssetPath(enemyId: EnemyId): string {
  return `/assets/enemies/${enemyId}/walk.png`;
}

export const GEM_FAMILIES: GemFamilyId[] = [...BASE_GEM_FAMILIES, ...HYBRID_GEM_FAMILIES];
export const GEM_LEVELS: GemLevel[] = [1, 2, 3, 4, 5, 6, 7];

export const ENEMY_IDS: EnemyId[] = [
  'scout',
  'trooper',
  'runner',
  'bulwark',
  'striker',
  'brute',
  'shifter',
  'mystic',
  'warden',
  'vanguard',
  'colossus',
  'dreadnought',
];

export const BOSS_ENEMY_IDS: EnemyId[] = ['colossus', 'dreadnought'];
