export type SpriteSheetId = 'monsters' | 'gems';

export interface SpriteRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SpriteAnimationMeta {
  frames: SpriteRect[];
  frameDurationMs: number;
}

export interface MonsterSpriteMeta {
  sheet: SpriteSheetId;
  animations: Record<'idle' | 'walk' | 'attack' | 'death', SpriteAnimationMeta>;
}

export interface GemSpriteMeta {
  sheet: SpriteSheetId;
  frame: SpriteRect;
}

export interface SpriteMetadata {
  frameSize: number;
  sheets: Record<SpriteSheetId, { src: string; width: number; height: number }>;
  monsters: Record<string, MonsterSpriteMeta>;
  gems: Record<string, GemSpriteMeta>;
}

const frameSize = 64;
const monsterIds = ['cinderling', 'slag-runner', 'iron-wight', 'glass-hex', 'obelisk'] as const;
const monsterAnimationColumns = {
  idle: [0, 1],
  walk: [2, 3, 4, 5],
  attack: [6, 7, 8],
  death: [9, 10, 11, 12],
} as const;
const monsterDurations = {
  idle: 260,
  walk: 120,
  attack: 95,
  death: 130,
} as const;
const gemIds = [
  'ruby-1',
  'sapphire-1',
  'topaz-1',
  'emerald-1',
  'amethyst-1',
  'onyx-1',
  'ruby-2',
  'sapphire-2',
  'topaz-2',
  'emerald-2',
  'amethyst-2',
  'onyx-2',
  'ruby-3',
  'sapphire-3',
  'topaz-3',
  'emerald-3',
  'amethyst-3',
  'onyx-3',
  'ruby-4',
  'sapphire-4',
  'topaz-4',
  'emerald-4',
  'amethyst-4',
  'onyx-4',
  'prism-lens',
  'verdant-forge',
  'night-crucible',
  'sunward-core',
] as const;

function rect(col: number, row: number): SpriteRect {
  return { x: col * frameSize, y: row * frameSize, w: frameSize, h: frameSize };
}

function createMonsterMeta(row: number): MonsterSpriteMeta {
  return {
    sheet: 'monsters',
    animations: {
      idle: {
        frames: monsterAnimationColumns.idle.map((col) => rect(col, row)),
        frameDurationMs: monsterDurations.idle,
      },
      walk: {
        frames: monsterAnimationColumns.walk.map((col) => rect(col, row)),
        frameDurationMs: monsterDurations.walk,
      },
      attack: {
        frames: monsterAnimationColumns.attack.map((col) => rect(col, row)),
        frameDurationMs: monsterDurations.attack,
      },
      death: {
        frames: monsterAnimationColumns.death.map((col) => rect(col, row)),
        frameDurationMs: monsterDurations.death,
      },
    },
  };
}

function createMetadata(): SpriteMetadata {
  const monsters: Record<string, MonsterSpriteMeta> = {};
  const gems: Record<string, GemSpriteMeta> = {};
  for (let i = 0; i < monsterIds.length; i++) monsters[monsterIds[i]] = createMonsterMeta(i);
  for (let i = 0; i < gemIds.length; i++) {
    gems[gemIds[i]] = {
      sheet: 'gems',
      frame: rect(i % 7, Math.floor(i / 7)),
    };
  }
  return {
    frameSize,
    sheets: {
      monsters: {
        src: '/assets/sprites/monsters.png',
        width: frameSize * 13,
        height: frameSize * monsterIds.length,
      },
      gems: {
        src: '/assets/sprites/gems.png',
        width: frameSize * 7,
        height: frameSize * 4,
      },
    },
    monsters,
    gems,
  };
}

export const spriteMetadata = createMetadata();
