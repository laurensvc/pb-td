import type { GemType, QualityTier } from '@facet/content'

export const TILE_SIZE = 32
export const GEM_FOOTPRINT = 2
export const SIM_HZ = 30
export const STARTING_GOLD = 10
export const PLACEMENT_CHARGES_PER_ROUND = 5
export const FIRST_LETHAL_LEAK_LEVEL = 10
export const MAX_WAVE_LEVEL = 10
export const SLOW_STACK_CAP = 0.75
export const SLOW_MIN_SPEED_FRACTION = 0.25
export const MVP_DAMAGE_BONUS_PER_STACK = 0.1
export const MVP_MAX_STACKS = 10
export const MAX_GEM_CHANCE_LEVEL_V1 = 3

/** Gold cost to upgrade from `currentLevel` to the next probability tier. */
export function gemChanceUpgradeCost(currentLevel: number): number {
  return 5 + currentLevel * 5
}

export const GEM_TYPES: readonly GemType[] = [
  'amethyst',
  'aquamarine',
  'diamond',
  'emerald',
  'opal',
  'ruby',
  'sapphire',
  'topaz',
] as const

export const GEM_QUALITY_ORDER: readonly QualityTier[] = [
  'chipped',
  'flawed',
  'normal',
  'flawless',
  'perfect',
  'great',
] as const

export function qualityIndex(quality: QualityTier): number {
  const idx = GEM_QUALITY_ORDER.indexOf(quality)
  if (idx < 0) throw new Error(`Unknown quality: ${quality}`)
  return idx
}

export function qualityAtIndex(index: number): QualityTier | undefined {
  return GEM_QUALITY_ORDER[index]
}

export function gemId(type: GemType, quality: QualityTier): string {
  return `${type}-${quality}`
}

export function parseGemId(gemId: string): { type: GemType; quality: QualityTier } {
  const dash = gemId.lastIndexOf('-')
  if (dash <= 0) throw new Error(`Invalid gem id: ${gemId}`)
  return {
    type: gemId.slice(0, dash) as GemType,
    quality: gemId.slice(dash + 1) as QualityTier,
  }
}
