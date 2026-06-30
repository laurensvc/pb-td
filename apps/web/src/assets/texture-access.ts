import type Phaser from 'phaser'
import { getManifestEntry } from './manifest.js'

const isDev = import.meta.env.DEV

/**
 * Fail-loud in dev when a drawable references a key that was not preloaded.
 */
export function requireTextureKey(scene: Phaser.Scene, key: string): void {
  if (scene.textures.exists(key)) return

  const msg = `[assets] Missing manifest texture key: "${key}"`
  if (isDev) {
    throw new Error(msg)
  }
  console.error(msg)
}

export function createManifestSprite(
  scene: Phaser.Scene,
  x: number,
  y: number,
  key: string,
  depth: number,
): Phaser.GameObjects.Sprite {
  requireTextureKey(scene, key)
  const sprite = scene.add.sprite(x, y, key, 0).setDepth(depth)
  const entry = getManifestEntry(key)
  if (entry) {
    sprite.setOrigin(entry.origin[0], entry.origin[1])
  }
  return sprite
}

export function playManifestAnimation(
  sprite: Phaser.GameObjects.Sprite,
  key: string,
  scene: Phaser.Scene,
): void {
  if (scene.anims.exists(key)) {
    sprite.anims.play(key, true)
  }
}
