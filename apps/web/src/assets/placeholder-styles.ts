import { gemTypeTemplates, type GemType } from '@facet/content'
import { ENEMY_COLORS, GEM_COLORS, SPECIAL_COLORS } from '../phaser/colors.js'

export type PlaceholderShape =
  | 'tile'
  | 'gem'
  | 'tower-family'
  | 'special'
  | 'enemy'
  | 'landmark'
  | 'rock'
  | 'ring'
  | 'projectile'
  | 'fx'

export interface PlaceholderStyle {
  shape: PlaceholderShape
  fill: number
  stroke: number
  alpha: number
  label?: string
  tier?: number
}

const FAMILY_COLORS: Record<string, number> = {
  flame: 0xe74c3c,
  stone: 0x95a5a6,
  thorn: 0x2ecc71,
  arcane: 0x9b59b6,
  radiant: 0xf1c40f,
}

const QUALITY_TIER: Record<string, number> = {
  chipped: 1,
  flawed: 2,
  normal: 3,
}

const TOWER_ANIM_FRAMES: Record<string, number> = {
  idle: 0,
  attack: 1,
  build: 2,
}

export function colorToCss(hexColor: number, alpha = 1): string {
  const r = (hexColor >> 16) & 0xff
  const g = (hexColor >> 8) & 0xff
  const b = hexColor & 0xff
  return alpha < 1 ? `rgba(${r},${g},${b},${alpha})` : `#${hexColor.toString(16).padStart(6, '0')}`
}

export function resolvePlaceholderStyle(key: string): PlaceholderStyle {
  if (key.startsWith('terrain.')) {
    const id = key.slice('terrain.'.length)
    const fills: Record<string, number> = {
      'default-floor': 0x3d6b3d,
      'path-floor': 0x4a6741,
      'blocked-floor': 0x2c3e50,
    }
    return {
      shape: 'tile',
      fill: fills[id] ?? 0x3d6b3d,
      stroke: 0x1a1f2e,
      alpha: 1,
    }
  }

  if (key.startsWith('env.')) {
    const id = key.slice('env.'.length)
    if (id === 'rock') {
      return { shape: 'rock', fill: 0x6e6e6e, stroke: 0x1a1f2e, alpha: 0.9 }
    }
    const landmarkColors: Record<string, number> = {
      'spawn-gate': 0x5dade2,
      'goal-nexus': 0xe74c3c,
    }
    const checkpoint = /^checkpoint-(\d)$/.exec(id)
    return {
      shape: 'landmark',
      fill: landmarkColors[id] ?? 0xf39c12,
      stroke: 0x1a1f2e,
      alpha: 0.85,
      label: checkpoint
        ? checkpoint[1]!
        : id === 'spawn-gate'
          ? 'S'
          : id === 'goal-nexus'
            ? 'G'
            : '?',
    }
  }

  if (key.startsWith('fx.')) {
    const id = key.slice('fx.'.length)
    if (id === 'selection-ring' || id === 'invalid-ring') {
      return {
        shape: 'ring',
        fill: id === 'selection-ring' ? 0x2ecc71 : 0xe74c3c,
        stroke: id === 'selection-ring' ? 0x2ecc71 : 0xe74c3c,
        alpha: 0.35,
      }
    }
    const fxColors: Record<string, number> = {
      'hit-spark': 0xf1c40f,
      'burn-tick': 0xe67e22,
      'poison-tick': 0x2ecc71,
      'merge-burst': 0x9b59b6,
      'build-flash': 0xecf0f1,
    }
    return {
      shape: 'fx',
      fill: fxColors[id] ?? 0xffffff,
      stroke: 0x1a1f2e,
      alpha: 0.9,
    }
  }

  if (key.startsWith('projectile.')) {
    const colors: Record<string, number> = {
      'flame-bolt': 0xe67e22,
      'stone-shard': 0xbdc3c7,
      'thorn-spore': 0x27ae60,
      'arcane-lance': 0x8e44ad,
      'radiant-bolt': 0xf39c12,
      'radiant-prism': 0xf39c12,
      'magma-core-shot': 0xc0392b,
    }
    const id = key.slice('projectile.'.length)
    return {
      shape: 'projectile',
      fill: colors[id] ?? 0xffffff,
      stroke: 0x1a1f2e,
      alpha: 1,
    }
  }

  if (key.startsWith('tower.special.')) {
    const id = key.slice('tower.special.'.length) as keyof typeof SPECIAL_COLORS
    return {
      shape: 'special',
      fill: SPECIAL_COLORS[id] ?? 0xffffff,
      stroke: 0x1a1f2e,
      alpha: 1,
      tier: 3,
    }
  }

  const gemMatch = /^tower\.([a-z]+)\.(chipped|flawed|normal)$/.exec(key)
  if (gemMatch) {
    const type = gemMatch[1] as GemType
    const quality = gemMatch[2]!
    return {
      shape: 'gem',
      fill: GEM_COLORS[type] ?? 0xc0392b,
      stroke: 0x1a1f2e,
      alpha: quality === 'chipped' ? 0.65 : quality === 'flawed' ? 0.8 : 1,
      tier: QUALITY_TIER[quality] ?? 1,
    }
  }

  const familyMatch = /^tower\.([a-z]+)-t(\d)\.(idle|attack|build)$/.exec(key)
  if (familyMatch) {
    const family = familyMatch[1]!
    const tier = Number(familyMatch[2])
    return {
      shape: 'tower-family',
      fill: FAMILY_COLORS[family] ?? 0xffffff,
      stroke: 0x1a1f2e,
      alpha: 1,
      tier,
      label: TOWER_ANIM_FRAMES[familyMatch[3]!]?.toString(),
    }
  }

  const magmaMatch = /^tower\.magma-core\.(idle|attack|build)$/.exec(key)
  if (magmaMatch) {
    return {
      shape: 'tower-family',
      fill: 0xc0392b,
      stroke: 0x1a1f2e,
      alpha: 1,
      tier: 4,
    }
  }

  const enemyMatch = /^enemy\.([a-z-]+)\.(walk|fly|hit|death|spawn|shadow|split)$/.exec(key)
  if (enemyMatch) {
    const enemyId = enemyMatch[1]!
    const anim = enemyMatch[2]!
    if (anim === 'shadow') {
      return { shape: 'ring', fill: 0x000000, stroke: 0x000000, alpha: 0.25 }
    }
    return {
      shape: 'enemy',
      fill: ENEMY_COLORS[enemyId] ?? 0xcccccc,
      stroke: 0x1a1f2e,
      alpha: anim === 'hit' ? 0.7 : 1,
      label: anim === 'death' ? 'X' : undefined,
    }
  }

  // Fallback: derive from gem type templates when key is unknown
  const typeGuess = key.split('.')[1] as GemType | undefined
  if (typeGuess && gemTypeTemplates[typeGuess]) {
    return {
      shape: 'gem',
      fill: GEM_COLORS[typeGuess] ?? 0xffffff,
      stroke: 0x1a1f2e,
      alpha: 1,
      tier: 1,
    }
  }

  return { shape: 'fx', fill: 0xff00ff, stroke: 0x1a1f2e, alpha: 1, label: '?' }
}
