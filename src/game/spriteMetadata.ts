import { gameConfig } from './config';
import type { GemFamily } from './types';

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

/** Monster cells stay on a 64px grid. */
const monsterFrameSize = 64;
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

/** `public/assets/sprites/gems.png` — 7×4 framed gems (see script / atlas layout). */
const GEM_SHEET_W = 1448;
const GEM_SHEET_H = 1086;
const GEM_COLS = 7;
const GEM_ROWS = 4;

/** Map each gem family to a column in the sheet (7 columns; aquamarine shares sapphire’s blue column). */
const FAMILY_TO_COL: Record<GemFamily, number> = {
  ruby: 0,
  sapphire: 1,
  aquamarine: 1,
  topaz: 2,
  emerald: 3,
  amethyst: 4,
  diamond: 5,
  opal: 6,
};

function monsterRect(col: number, row: number): SpriteRect {
  return {
    x: col * monsterFrameSize,
    y: row * monsterFrameSize,
    w: monsterFrameSize,
    h: monsterFrameSize,
  };
}

function gemCellRect(col: number, row: number): SpriteRect {
  const baseW = Math.floor(GEM_SHEET_W / GEM_COLS);
  const x = col * baseW;
  const w = col === GEM_COLS - 1 ? GEM_SHEET_W - x : baseW;
  const baseH = Math.floor(GEM_SHEET_H / GEM_ROWS);
  const y = row * baseH;
  const h = row === GEM_ROWS - 1 ? GEM_SHEET_H - y : baseH;
  return { x, y, w, h };
}

function gemFrameForDefinition(gem: { family: GemFamily; tier: number }): SpriteRect {
  const col = FAMILY_TO_COL[gem.family];
  const row = Math.min(Math.max(gem.tier - 1, 0), GEM_ROWS - 1);
  return gemCellRect(col, row);
}

function createMonsterMeta(row: number): MonsterSpriteMeta {
  return {
    sheet: 'monsters',
    animations: {
      idle: {
        frames: monsterAnimationColumns.idle.map((col) => monsterRect(col, row)),
        frameDurationMs: monsterDurations.idle,
      },
      walk: {
        frames: monsterAnimationColumns.walk.map((col) => monsterRect(col, row)),
        frameDurationMs: monsterDurations.walk,
      },
      attack: {
        frames: monsterAnimationColumns.attack.map((col) => monsterRect(col, row)),
        frameDurationMs: monsterDurations.attack,
      },
      death: {
        frames: monsterAnimationColumns.death.map((col) => monsterRect(col, row)),
        frameDurationMs: monsterDurations.death,
      },
    },
  };
}

function buildGemSprites(): Record<string, GemSpriteMeta> {
  const gems: Record<string, GemSpriteMeta> = {};
  for (let i = 0; i < gameConfig.gems.length; i++) {
    const gem = gameConfig.gems[i];
    gems[gem.id] = {
      sheet: 'gems',
      frame: gemFrameForDefinition(gem),
    };
  }
  return gems;
}

function createMetadata(): SpriteMetadata {
  const monsters: Record<string, MonsterSpriteMeta> = {};
  for (let i = 0; i < monsterIds.length; i++) monsters[monsterIds[i]] = createMonsterMeta(i);
  return {
    frameSize: monsterFrameSize,
    sheets: {
      monsters: {
        src: '/assets/sprites/monsters.png',
        width: monsterFrameSize * 13,
        height: monsterFrameSize * monsterIds.length,
      },
      gems: {
        src: '/assets/sprites/gems.png',
        width: GEM_SHEET_W,
        height: GEM_SHEET_H,
      },
    },
    monsters,
    gems: buildGemSprites(),
  };
}

export const spriteMetadata = createMetadata();
