import { generatePlaceholderCanvas } from './placeholder-generator.js'
import { ASSET_MANIFEST } from './manifest.js'
import type { AssetManifestEntry } from './types.js'

let registeredKeys: Set<string> | null = null

export function getRegisteredTextureKeys(): ReadonlySet<string> {
  return registeredKeys ?? new Set()
}

function applyPlaceholderTexture(scene: Phaser.Scene, entry: AssetManifestEntry): void {
  if (scene.textures.exists(entry.key)) return

  const canvas = generatePlaceholderCanvas(entry)
  if (entry.frames > 1) {
    scene.textures.addSpriteSheet(entry.key, canvas as unknown as HTMLImageElement, {
      frameWidth: entry.frameWidth,
      frameHeight: entry.frameHeight,
    })
  } else {
    scene.textures.addCanvas(entry.key, canvas)
  }
}

function applyNearestFilter(scene: Phaser.Scene, key: string): void {
  if (!scene.textures.exists(key)) return
  scene.textures.get(key).setFilter(0)
}

/** Queue manifest PNG loads from `public/` (missing files fail silently until finalize). */
export function queueManifestLoads(loader: {
  image: (key: string, url: string) => void
  spritesheet: (
    key: string,
    url: string,
    config: { frameWidth: number; frameHeight: number },
  ) => void
}): void {
  for (const entry of ASSET_MANIFEST) {
    const url = `/${entry.path}`
    if (entry.frames > 1) {
      loader.spritesheet(entry.key, url, {
        frameWidth: entry.frameWidth,
        frameHeight: entry.frameHeight,
      })
    } else {
      loader.image(entry.key, url)
    }
  }
}

/** After loader completes: placeholder fallback for missing keys, then register animations. */
export function finalizeManifestPreload(
  scene: Phaser.Scene,
  failedKeys?: ReadonlySet<string>,
): void {
  const keys = new Set<string>()
  const failures = failedKeys ?? new Set<string>()

  for (const entry of ASSET_MANIFEST) {
    const missing = failures.has(entry.key) || !scene.textures.exists(entry.key)
    if (missing) {
      applyPlaceholderTexture(scene, entry)
    } else {
      applyNearestFilter(scene, entry.key)
    }
    keys.add(entry.key)
  }

  registeredKeys = keys
  registerManifestAnimations(scene)
}

/** Synchronous placeholder preload (tests and emergency fallback). */
export function preloadManifest(scene: Phaser.Scene): void {
  const keys = new Set<string>()

  for (const entry of ASSET_MANIFEST) {
    applyPlaceholderTexture(scene, entry)
    keys.add(entry.key)
  }

  registeredKeys = keys
  registerManifestAnimations(scene)
}

export function registerManifestAnimations(scene: Phaser.Scene): void {
  for (const entry of ASSET_MANIFEST) {
    if (entry.frames <= 1 || entry.fps <= 0) continue
    if (scene.anims.exists(entry.key)) continue
    if (!scene.textures.exists(entry.key)) continue

    scene.anims.create({
      key: entry.key,
      frames: scene.anims.generateFrameNumbers(entry.key, {
        start: 0,
        end: entry.frames - 1,
      }),
      frameRate: entry.fps,
      repeat: entry.repeat,
    })
  }
}

export function applyManifestOrigin(
  sprite: Phaser.GameObjects.Sprite,
  entry: AssetManifestEntry,
): void {
  sprite.setOrigin(entry.origin[0], entry.origin[1])
}

export function manifestProgressTotal(): number {
  return ASSET_MANIFEST.length
}
