import type { EnemyId, GemFamilyId, GemLevel } from '../game/types';

export const TILE_SIZE = 32;
export const GEM_SPRITE_SIZE = 48;
export const ENEMY_FRAME_SIZE = 48;
export const ENEMY_WALK_FRAMES = 4;

export const ASSET_PATHS = {
  terrainVoid: '/assets/terrain/void-floor.png',
  terrainGem: '/assets/terrain/gem-cell.png',
  rock: '/assets/objects/rock.png',
  spawnPortal: '/assets/objects/spawn-portal.png',
  goalNexus: '/assets/objects/goal-nexus.png',
} as const;

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

export const GEM_FAMILIES: GemFamilyId[] = ['kinetic', 'verdant', 'arcane', 'nova', 'prism'];
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
