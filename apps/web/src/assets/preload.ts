import type Phaser from 'phaser'
import { generatePlaceholderCanvas } from './placeholder-generator.js'
import { ASSET_MANIFEST } from './manifest.js'
import type { AssetManifestEntry } from './types.js'

let registeredKeys: Set<string> | null = null

export function getRegisteredTextureKeys(): ReadonlySet<string> {
  return registeredKeys ?? new Set()
}

/** Generate placeholder textures and register Phaser animations from the manifest. */
export function preloadManifest(scene: Phaser.Scene): void {
  const keys = new Set<string>()

  for (const entry of ASSET_MANIFEST) {
    if (scene.textures.exists(entry.key)) continue

    const canvas = generatePlaceholderCanvas(entry)
    if (entry.frames > 1) {
      scene.textures.addSpriteSheet(entry.key, canvas as unknown as HTMLImageElement, {
        frameWidth: entry.frameWidth,
        frameHeight: entry.frameHeight,
      })
    } else {
      scene.textures.addCanvas(entry.key, canvas)
    }
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
