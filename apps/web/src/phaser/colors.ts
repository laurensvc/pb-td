/** Placeholder tint keys — resolved via assets/placeholder-styles.ts manifest seam. */

export const GEM_COLORS: Record<string, number> = {
  amethyst: 0x9b59b6,
  aquamarine: 0x48c9b0,
  diamond: 0xecf0f1,
  emerald: 0x2ecc71,
  opal: 0xf8f9fa,
  ruby: 0xe74c3c,
  sapphire: 0x3498db,
  topaz: 0xf1c40f,
}

export const ENEMY_COLORS: Record<string, number> = {
  'crystal-runner': 0x5dade2,
  'stone-grunt': 0x95a5a6,
  'shield-bulwark': 0x566573,
  'sky-warden': 0xaf7ac5,
  'gate-colossus': 0xc0392b,
}

export const SPECIAL_COLORS: Record<string, number> = {
  silver: 0xbdc3c7,
  malachite: 0x1e8449,
  quartz: 0xf5eef8,
}

export function gemColorFromId(gemId: string): number {
  const type = gemId.split('-')[0] ?? 'ruby'
  return GEM_COLORS[type] ?? 0xc0392b
}

export function qualityAlpha(quality: string): number {
  switch (quality) {
    case 'chipped':
      return 0.65
    case 'flawed':
      return 0.8
    case 'normal':
      return 1
    default:
      return 1
  }
}
