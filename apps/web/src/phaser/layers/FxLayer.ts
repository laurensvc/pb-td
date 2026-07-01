import Phaser from 'phaser'

import { PRESENTATION_ASSET_KEYS } from '../../assets/manifest.js'

import { createManifestSprite, playManifestAnimationOnce } from '../../assets/texture-access.js'
import type { AnimationController } from '../AnimationController.js'

/** Short-lived combat FX using manifest sprite sheets. */

export class FxLayer {
  private readonly pool: Phaser.GameObjects.Sprite[] = []

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly animations: AnimationController,
  ) {}

  spawnHit(x: number, y: number): void {
    const spark =
      this.pool.pop() ??
      createManifestSprite(this.scene, 0, 0, PRESENTATION_ASSET_KEYS.hitSpark, 50).setDisplaySize(
        24,
        24,
      )

    spark.setPosition(x, y).setVisible(true).setAlpha(1).setScale(1)

    const release = () => {
      spark.setVisible(false)
      spark.anims.stop()
      this.pool.push(spark)
    }

    if (
      playManifestAnimationOnce(spark, PRESENTATION_ASSET_KEYS.hitSpark, this.scene, release)
    ) {
      return
    }

    this.animations.pulseScale(spark, { factor: 1.6, duration: 180 })
    this.scene.tweens.add({
      targets: spark,
      alpha: 0,
      duration: 180,
      onComplete: release,
    })
  }

  destroy(): void {
    for (const spark of this.pool) spark.destroy()

    this.pool.length = 0
  }
}
