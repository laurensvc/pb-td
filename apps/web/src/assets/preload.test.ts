import { describe, expect, it, vi } from 'vitest'
import { ASSET_MANIFEST } from './manifest.js'
import { finalizeManifestPreload, preloadManifest } from './preload.js'
import { requireTextureKey } from './texture-access.js'

function createMockScene() {
  const textures = new Map<string, unknown>()
  const anims = new Map<string, unknown>()

  return {
    textures: {
      exists: (key: string) => textures.has(key),
      addSpriteSheet: vi.fn((key: string) => {
        textures.set(key, 'sheet')
      }),
      addCanvas: vi.fn((key: string) => {
        textures.set(key, 'canvas')
      }),
    },
    anims: {
      exists: (key: string) => anims.has(key),
      create: vi.fn((config: { key: string }) => {
        anims.set(config.key, config)
      }),
      generateFrameNumbers: vi.fn((_key: string, range: { start: number; end: number }) =>
        Array.from({ length: range.end - range.start + 1 }, (_, i) => ({ frame: range.start + i })),
      ),
    },
    texturesMap: textures,
  }
}

describe('preloadManifest', () => {
  it('registers every manifest texture', () => {
    const scene = createMockScene()
    preloadManifest(scene as never)
    expect(scene.textures.addSpriteSheet).toHaveBeenCalled()
    expect(scene.textures.addCanvas).toHaveBeenCalled()
    expect(scene.texturesMap.size).toBe(ASSET_MANIFEST.length)
  })

  it('creates animations for multi-frame entries', () => {
    const scene = createMockScene()
    preloadManifest(scene as never)
    const animated = ASSET_MANIFEST.filter((e) => e.frames > 1 && e.fps > 0)
    expect(scene.anims.create).toHaveBeenCalledTimes(animated.length)
  })

  it('finalizeManifestPreload fills placeholders for failed loads', () => {
    const scene = createMockScene()
    finalizeManifestPreload(scene as never, new Set(['terrain.default-floor']))
    expect(scene.texturesMap.size).toBe(ASSET_MANIFEST.length)
    expect(scene.textures.addCanvas).toHaveBeenCalled()
  })
})

describe('requireTextureKey', () => {
  it('throws in dev for missing keys', () => {
    const scene = { textures: { exists: () => false } }
    expect(() => requireTextureKey(scene as never, 'missing.key')).toThrow(
      /Missing manifest texture key/,
    )
  })

  it('passes when texture exists', () => {
    const scene = { textures: { exists: () => true } }
    expect(() => requireTextureKey(scene as never, 'terrain.default-floor')).not.toThrow()
  })
})
