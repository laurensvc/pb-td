import Phaser from 'phaser'

import type { GameSnapshot } from '@facet/protocol'

import { enemyLocomotionKey } from '../../assets/manifest.js'

import { createManifestSprite, playManifestAnimation } from '../../assets/texture-access.js'

interface UnitSprite {
  body: Phaser.GameObjects.Sprite

  shadow?: Phaser.GameObjects.Sprite

  bar: Phaser.GameObjects.Rectangle
}

export class UnitLayer {
  private readonly sprites = new Map<string, UnitSprite>()

  private readonly tileSize: number

  constructor(
    private readonly scene: Phaser.Scene,

    tileSize: number,
  ) {
    this.tileSize = tileSize
  }

  sync(snapshot: GameSnapshot): void {
    const seen = new Set<string>()

    const radius = this.tileSize * 0.35

    for (const creep of snapshot.creeps) {
      seen.add(creep.id)

      const textureKey = enemyLocomotionKey(creep.enemyId, creep.mobility)

      const shadowKey = `enemy.${creep.enemyId}.shadow`

      const { x, y } = creep.worldPos

      const depth = 30 + y

      const display = this.tileSize * 0.9

      let entry = this.sprites.get(creep.id)

      if (!entry) {
        const shadow =
          creep.mobility === 'flying' && this.scene.textures.exists(shadowKey)
            ? createManifestSprite(this.scene, x, y + radius, shadowKey, depth - 1)
            : undefined

        shadow?.setDisplaySize(radius * 2, radius * 0.6)

        const body = createManifestSprite(this.scene, x, y, textureKey, depth)

        body.setDisplaySize(display, display)

        playManifestAnimation(body, textureKey, this.scene)

        const bar = this.scene.add.rectangle(x, y - radius - 4, radius * 2, 3, 0x2ecc71, 1)

        entry = { body, shadow, bar }

        this.sprites.set(creep.id, entry)
      }

      entry.body.setPosition(x, y).setDepth(depth)

      entry.shadow?.setPosition(x, y + radius).setDepth(depth - 1)

      const hpFrac = creep.maxHp > 0 ? creep.hp / creep.maxHp : 0

      entry.bar

        .setPosition(x - radius + radius * hpFrac, y - radius - 4)

        .setSize(radius * 2 * hpFrac, 3)

        .setFillStyle(hpFrac > 0.35 ? 0x2ecc71 : 0xe74c3c)

        .setDepth(depth + 0.1)
    }

    for (const [id, entry] of this.sprites) {
      if (!seen.has(id)) {
        entry.body.destroy()

        entry.shadow?.destroy()

        entry.bar.destroy()

        this.sprites.delete(id)
      }
    }
  }

  destroy(): void {
    for (const entry of this.sprites.values()) {
      entry.body.destroy()

      entry.shadow?.destroy()

      entry.bar.destroy()
    }

    this.sprites.clear()
  }
}
