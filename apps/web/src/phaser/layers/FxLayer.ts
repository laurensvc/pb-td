import Phaser from 'phaser'

import { PRESENTATION_ASSET_KEYS } from '../../assets/manifest.js'

import { createManifestSprite } from '../../assets/texture-access.js'

/** Short-lived combat FX using manifest `fx.hit-spark`. */

export class FxLayer {
  private readonly pool: Phaser.GameObjects.Sprite[] = []

  constructor(private readonly scene: Phaser.Scene) {}

  spawnHit(x: number, y: number): void {
    const spark =
      this.pool.pop() ??
      createManifestSprite(this.scene, 0, 0, PRESENTATION_ASSET_KEYS.hitSpark, 50).setDisplaySize(
        24,

        24,
      )

    spark.setPosition(x, y).setVisible(true).setAlpha(1).setScale(1)

    this.scene.tweens.add({
      targets: spark,

      alpha: 0,

      scale: 1.6,

      duration: 180,

      onComplete: () => {
        spark.setVisible(false)

        this.pool.push(spark)
      },
    })
  }

  destroy(): void {
    for (const spark of this.pool) spark.destroy()

    this.pool.length = 0
  }
}
