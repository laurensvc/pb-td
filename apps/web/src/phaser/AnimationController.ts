import type Phaser from 'phaser'
import { getManifestEntry } from '../assets/manifest.js'

export class AnimationController {
  constructor(private readonly scene: Phaser.Scene) {}

  hasAnimation(key: string): boolean {
    return this.scene.anims.exists(key)
  }

  playLoop(sprite: Phaser.GameObjects.Sprite, key: string): boolean {
    if (!this.hasAnimation(key)) return false
    sprite.anims.play({ key, repeat: -1 }, true)
    return true
  }

  playOnce(sprite: Phaser.GameObjects.Sprite, key: string, onComplete?: () => void): boolean {
    if (!this.hasAnimation(key)) return false

    const entry = getManifestEntry(key)
    const repeat = entry?.repeat ?? 0

    sprite.anims.play({ key, repeat: repeat === -1 ? 0 : repeat }, true)
    if (onComplete) {
      sprite.once('animationcomplete', onComplete)
    }
    return true
  }

  pulseScale(
    target: Phaser.GameObjects.Sprite,
    options: { factor?: number; duration?: number } = {},
  ): void {
    const factor = options.factor ?? 1.12
    const duration = options.duration ?? 80
    const baseX = target.scaleX
    const baseY = target.scaleY

    this.scene.tweens.add({
      targets: target,
      scaleX: baseX * factor,
      scaleY: baseY * factor,
      yoyo: true,
      duration,
      ease: 'Quad.easeOut',
      onComplete: () => {
        target.setScale(baseX, baseY)
      },
    })
  }

  flashTint(
    sprite: Phaser.GameObjects.Sprite,
    options: { tint?: number; duration?: number } = {},
  ): void {
    const tint = options.tint ?? 0xffffff
    const duration = options.duration ?? 100
    sprite.setTint(tint)
    this.scene.time.delayedCall(duration, () => sprite.clearTint())
  }
}
