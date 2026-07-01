import { describe, expect, it } from 'vitest'
import { gameContent } from '@facet/content'
import {
  ASSET_MANIFEST,
  assertManifestCoversContent,
  collectContentAssetKeys,
  getManifestEntry,
  resolvePresentationKey,
} from './manifest.js'

describe('asset manifest', () => {
  it('has unique keys', () => {
    const keys = ASSET_MANIFEST.map((e) => e.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('entries define frames, fps, and origin', () => {
    for (const entry of ASSET_MANIFEST) {
      expect(entry.key.length).toBeGreaterThan(0)
      expect(entry.path.startsWith('assets/')).toBe(true)
      expect(entry.frameWidth).toBeGreaterThan(0)
      expect(entry.frameHeight).toBeGreaterThan(0)
      expect(entry.frames).toBeGreaterThan(0)
      expect(entry.origin).toHaveLength(2)
      expect(entry.origin[0]).toBeGreaterThanOrEqual(0)
      expect(entry.origin[1]).toBeGreaterThanOrEqual(0)
    }
  })

  it('covers all content-referenced asset keys', () => {
    expect(() => assertManifestCoversContent(gameContent)).not.toThrow()
    const contentKeys = collectContentAssetKeys(gameContent)
    for (const key of contentKeys) {
      expect(getManifestEntry(key), `missing ${key}`).toBeDefined()
    }
  })

  it('includes tracker vertical-slice environment keys', () => {
    const keys = new Set(ASSET_MANIFEST.map((e) => e.key))
    expect(keys.has('terrain.default-floor')).toBe(true)
    expect(keys.has('env.spawn-gate')).toBe(true)
    expect(keys.has('fx.selection-ring')).toBe(true)
    expect(keys.has('enemy.stone-grunt.walk')).toBe(true)
    expect(keys.has('tower.flame-t1.idle')).toBe(true)
    expect(keys.has('projectile.flame-bolt')).toBe(true)
    expect(keys.has('fx.hit-spark')).toBe(true)
  })

  it('maps gem content keys to family-tier idle sprites', () => {
    expect(resolvePresentationKey('tower.ruby.chipped')).toBe('tower.flame-t1.idle')
    expect(resolvePresentationKey('tower.emerald.normal')).toBe('tower.thorn-t3.idle')
    expect(resolvePresentationKey('tower.amethyst.chipped')).toBe('tower.amethyst.chipped')
    expect(resolvePresentationKey('enemy.stone-grunt.walk')).toBe('enemy.stone-grunt.walk')
  })
})
