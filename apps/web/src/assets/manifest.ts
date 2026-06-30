import {
  gemTypes,
  v1EnemyDefinitions,
  v1GemDefinitions,
  v1Qualities,
  v1SpecialTowers,
  type GameContent,
} from '@facet/content'
import type { AssetManifestEntry } from './types.js'

const TOWER_ORIGIN: [number, number] = [0.5, 1.0]
const ENEMY_ORIGIN: [number, number] = [0.5, 0.75]
const TILE_ORIGIN: [number, number] = [0, 0]
const FX_ORIGIN: [number, number] = [0.5, 0.5]

function entry(
  partial: Omit<AssetManifestEntry, 'repeat'> & { repeat?: -1 | 0 },
): AssetManifestEntry {
  return { repeat: -1, ...partial }
}

function terrainEntries(): AssetManifestEntry[] {
  const tiles = [
    { id: 'default-floor', frames: 1, fps: 0 },
    { id: 'path-floor', frames: 1, fps: 0 },
    { id: 'blocked-floor', frames: 1, fps: 0 },
  ] as const
  return tiles.map((t) =>
    entry({
      key: `terrain.${t.id}`,
      path: `assets/terrain/tiles/${t.id}.png`,
      frameWidth: 32,
      frameHeight: 32,
      frames: t.frames,
      fps: t.fps,
      repeat: 0,
      origin: TILE_ORIGIN,
    }),
  )
}

function environmentEntries(): AssetManifestEntry[] {
  const objects = [
    'spawn-gate',
    'goal-nexus',
    'checkpoint-1',
    'checkpoint-2',
    'checkpoint-3',
    'checkpoint-4',
    'checkpoint-5',
    'rock',
  ] as const
  return objects.map((id) =>
    entry({
      key: `env.${id}`,
      path: `assets/terrain/objects/${id}.png`,
      frameWidth: 64,
      frameHeight: 64,
      frames: 1,
      fps: 0,
      repeat: 0,
      origin: TOWER_ORIGIN,
    }),
  )
}

function buildUxEntries(): AssetManifestEntry[] {
  return ['selection-ring', 'invalid-ring'].map((id) =>
    entry({
      key: `fx.${id}`,
      path: `assets/terrain/objects/${id}.png`,
      frameWidth: 64,
      frameHeight: 64,
      frames: 1,
      fps: 0,
      repeat: 0,
      origin: FX_ORIGIN,
    }),
  )
}

function towerFamilyEntries(): AssetManifestEntry[] {
  const families = ['flame', 'stone', 'thorn'] as const
  const tiers = [1, 2, 3] as const
  const anims = [
    { name: 'idle', frames: 6, fps: 6, repeat: -1 as const },
    { name: 'attack', frames: 6, fps: 12, repeat: 0 as const },
    { name: 'build', frames: 8, fps: 12, repeat: 0 as const },
  ]
  const out: AssetManifestEntry[] = []
  for (const family of families) {
    for (const tier of tiers) {
      for (const anim of anims) {
        out.push(
          entry({
            key: `tower.${family}-t${tier}.${anim.name}`,
            path: `assets/towers/${family}-t${tier}/${anim.name}.png`,
            frameWidth: 64,
            frameHeight: 64,
            frames: anim.frames,
            fps: anim.fps,
            repeat: anim.repeat,
            origin: TOWER_ORIGIN,
          }),
        )
      }
    }
  }
  for (const anim of anims) {
    out.push(
      entry({
        key: `tower.magma-core.${anim.name}`,
        path: `assets/towers/magma-core/${anim.name}.png`,
        frameWidth: 96,
        frameHeight: 96,
        frames: anim.frames,
        fps: anim.fps,
        repeat: anim.repeat,
        origin: TOWER_ORIGIN,
      }),
    )
  }
  return out
}

function contentGemEntries(): AssetManifestEntry[] {
  return v1GemDefinitions.map((gem) =>
    entry({
      key: gem.assetKey,
      path: `assets/towers/gems/${gem.id}.png`,
      frameWidth: 64,
      frameHeight: 64,
      frames: gem.quality === 'normal' ? 6 : 4,
      fps: 6,
      origin: TOWER_ORIGIN,
    }),
  )
}

function specialTowerEntries(): AssetManifestEntry[] {
  return v1SpecialTowers.map((tower) =>
    entry({
      key: tower.assetKey,
      path: `assets/towers/specials/${tower.id}.png`,
      frameWidth: 96,
      frameHeight: 96,
      frames: 6,
      fps: 6,
      origin: TOWER_ORIGIN,
    }),
  )
}

function enemyEntries(): AssetManifestEntry[] {
  const out: AssetManifestEntry[] = []
  for (const enemy of v1EnemyDefinitions) {
    const size = enemy.id === 'gate-colossus' ? 96 : 64
    const animMeta: Record<string, { frames: number; fps: number; repeat: -1 | 0 }> = {
      walk: { frames: 8, fps: 10, repeat: -1 },
      fly: { frames: 8, fps: 10, repeat: -1 },
      hit: { frames: 3, fps: 14, repeat: 0 },
      death: { frames: 8, fps: 12, repeat: 0 },
      spawn: { frames: 8, fps: 10, repeat: 0 },
      shadow: { frames: 1, fps: 0, repeat: 0 },
    }
    const keys = [
      ...Object.values(enemy.visuals.animations),
      ...(enemy.visuals.shadowKey ? [enemy.visuals.shadowKey] : []),
    ]
    for (const key of keys) {
      const anim = key.split('.').pop() ?? 'walk'
      const meta = animMeta[anim] ?? { frames: 6, fps: 10, repeat: -1 }
      out.push(
        entry({
          key,
          path: `assets/enemies/${enemy.id}/${anim}.png`,
          frameWidth: size,
          frameHeight: size,
          frames: meta.frames,
          fps: meta.fps,
          repeat: meta.repeat,
          origin: anim === 'shadow' ? ([0.5, 0.5] as [number, number]) : ENEMY_ORIGIN,
        }),
      )
    }
  }
  return out
}

function projectileEntries(): AssetManifestEntry[] {
  const ids = [
    'flame-bolt',
    'stone-shard',
    'thorn-spore',
    'arcane-lance',
    'radiant-bolt',
    'radiant-prism',
    'magma-core-shot',
  ] as const
  return ids.map((id) =>
    entry({
      key: `projectile.${id}`,
      path: `assets/projectiles/${id}.png`,
      frameWidth: id === 'magma-core-shot' ? 64 : 32,
      frameHeight: id === 'magma-core-shot' ? 64 : 32,
      frames: 1,
      fps: 0,
      repeat: 0,
      origin: FX_ORIGIN,
    }),
  )
}

function fxEntries(): AssetManifestEntry[] {
  const defs = [
    { id: 'hit-spark', frames: 6, fps: 20 },
    { id: 'burn-tick', frames: 6, fps: 10 },
    { id: 'poison-tick', frames: 6, fps: 10 },
    { id: 'merge-burst', frames: 10, fps: 18 },
    { id: 'build-flash', frames: 8, fps: 18 },
  ] as const
  return defs.map((fx) =>
    entry({
      key: `fx.${fx.id}`,
      path: `assets/particles/${fx.id}.png`,
      frameWidth: 32,
      frameHeight: 32,
      frames: fx.frames,
      fps: fx.fps,
      repeat: 0,
      origin: FX_ORIGIN,
    }),
  )
}

function dedupeByKey(entries: AssetManifestEntry[]): AssetManifestEntry[] {
  const map = new Map<string, AssetManifestEntry>()
  for (const e of entries) {
    map.set(e.key, e)
  }
  return [...map.values()]
}

/** Full v1 slice manifest keyed to ASSET-GENERATION-TRACKER export paths. */
export const ASSET_MANIFEST: AssetManifestEntry[] = dedupeByKey([
  ...terrainEntries(),
  ...environmentEntries(),
  ...buildUxEntries(),
  ...towerFamilyEntries(),
  ...contentGemEntries(),
  ...specialTowerEntries(),
  ...enemyEntries(),
  ...projectileEntries(),
  ...fxEntries(),
])

const manifestByKey = new Map(ASSET_MANIFEST.map((e) => [e.key, e]))

export function getManifestEntry(key: string): AssetManifestEntry | undefined {
  return manifestByKey.get(key)
}

/** Collect every asset key referenced by loaded game content. */
export function collectContentAssetKeys(content: GameContent): string[] {
  const keys = new Set<string>()

  for (const gem of content.gems) {
    keys.add(gem.assetKey)
    if (gem.projectileKey) keys.add(gem.projectileKey)
  }
  for (const tower of content.towers) {
    keys.add(tower.assetKey)
    if (tower.projectileKey) keys.add(tower.projectileKey)
  }
  for (const enemy of content.enemies) {
    for (const animKey of Object.values(enemy.visuals.animations)) {
      keys.add(animKey)
    }
    if (enemy.visuals.shadowKey) keys.add(enemy.visuals.shadowKey)
  }

  keys.add('env.rock')
  keys.add('terrain.default-floor')
  keys.add('fx.selection-ring')
  keys.add('fx.invalid-ring')
  keys.add('fx.hit-spark')

  return [...keys]
}

export function assertManifestCoversContent(content: GameContent): void {
  const missing = collectContentAssetKeys(content).filter((k) => !manifestByKey.has(k))
  if (missing.length > 0) {
    throw new Error(`[assets] Manifest missing content keys: ${missing.join(', ')}`)
  }
}

/** Runtime keys used by presentation layers beyond raw content refs. */
export const PRESENTATION_ASSET_KEYS = {
  rock: 'env.rock',
  terrainFloor: 'terrain.default-floor',
  selectionRing: 'fx.selection-ring',
  invalidRing: 'fx.invalid-ring',
  hitSpark: 'fx.hit-spark',
} as const

export function enemyLocomotionKey(enemyId: string, mobility: 'ground' | 'flying'): string {
  return mobility === 'flying' ? `enemy.${enemyId}.fly` : `enemy.${enemyId}.walk`
}

export function gemAssetKeyFromGemId(gemId: string): string {
  const lastDash = gemId.lastIndexOf('-')
  if (lastDash <= 0) return `tower.ruby.chipped`
  const type = gemId.slice(0, lastDash)
  const quality = gemId.slice(lastDash + 1)
  return `tower.${type}.${quality}`
}

export function specialAssetKey(specialId: string): string {
  return `tower.special.${specialId}`
}

export { gemTypes, v1Qualities }
