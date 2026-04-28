import publicSpriteAtlas from '../../public/assets/sprites/sprites.json';
import { gameConfig } from './config';
import type { GemDefinition, GemFamily } from './types';

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

/** Map game families to a column in `public/assets/sprites/gems.png` (script names). */
const FAMILY_ATLAS_STEM: Record<GemFamily, string> = {
  amethyst: 'amethyst',
  aquamarine: 'sapphire',
  diamond: 'onyx',
  emerald: 'emerald',
  opal: 'amethyst',
  ruby: 'ruby',
  sapphire: 'sapphire',
  topaz: 'topaz',
};

const atlasGems = publicSpriteAtlas.gems as Record<string, GemSpriteMeta>;

function resolveGemSpriteMeta(gem: GemDefinition): GemSpriteMeta {
  const exact = atlasGems[gem.id];
  if (exact) return exact;
  const stem = FAMILY_ATLAS_STEM[gem.family] ?? gem.family;
  const tier = Math.min(Math.max(gem.tier, 1), 4);
  const withTier = atlasGems[`${stem}-${String(tier)}`];
  if (withTier) {
    return { sheet: withTier.sheet, frame: { ...withTier.frame } };
  }
  for (let t = 4; t >= 1; t -= 1) {
    const fallback = atlasGems[`${stem}-${String(t)}`];
    if (fallback) {
      return { sheet: fallback.sheet, frame: { ...fallback.frame } };
    }
  }
  const anchor = atlasGems['ruby-1']!;
  return { sheet: anchor.sheet, frame: { ...anchor.frame } };
}

function buildGameGems(): Record<string, GemSpriteMeta> {
  const out: Record<string, GemSpriteMeta> = { ...atlasGems };
  for (let i = 0; i < gameConfig.gems.length; i++) {
    const gem = gameConfig.gems[i];
    out[gem.id] = resolveGemSpriteMeta(gem);
  }
  return out;
}

const sheets = publicSpriteAtlas.sheets as SpriteMetadata['sheets'];
const monsters = publicSpriteAtlas.monsters as SpriteMetadata['monsters'];

export const spriteMetadata: SpriteMetadata = {
  frameSize: publicSpriteAtlas.frameSize,
  sheets,
  monsters,
  gems: buildGameGems(),
};
