import Phaser from 'phaser'

import type { GameSnapshot } from '@facet/protocol'

import { enemyLocomotionKey } from '../../assets/manifest.js'

import { createManifestSprite, playManifestAnimation } from '../../assets/texture-access.js'

interface UnitSprite {
  body: Phaser.GameObjects.Sprite
  shadow?: Phaser.GameObjects.Sprite
  bar: Phaser.GameObjects.Rectangle
  fromX: number
  fromY: number
  toX: number
  toY: number
  hpFrac: number
  radius: number
}

function roundPos(x: number, y: number): { x: number; y: number } {
  return { x: Math.round(x), y: Math.round(y) }
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
      const display = this.tileSize * 0.9
      const hpFrac = creep.maxHp > 0 ? creep.hp / creep.maxHp : 0

      let entry = this.sprites.get(creep.id)

      if (!entry) {
        const pos = roundPos(x, y)
        const depth = 30 + pos.y
        const shadow =
          creep.mobility === 'flying' && this.scene.textures.exists(shadowKey)
            ? createManifestSprite(this.scene, pos.x, pos.y + radius, shadowKey, depth - 1)
            : undefined

        shadow?.setDisplaySize(radius * 2, radius * 0.6)

        const body = createManifestSprite(this.scene, pos.x, pos.y, textureKey, depth)
        body.setDisplaySize(display, display)
        playManifestAnimation(body, textureKey, this.scene)

        const bar = this.scene.add.rectangle(pos.x, pos.y - radius - 4, radius * 2, 3, 0x2ecc71, 1)

        entry = {
          body,
          shadow,
          bar,
          fromX: pos.x,
          fromY: pos.y,
          toX: pos.x,
          toY: pos.y,
          hpFrac,
          radius,
        }

        this.sprites.set(creep.id, entry)
      } else {
        entry.fromX = entry.body.x
        entry.fromY = entry.body.y
        entry.toX = x
        entry.toY = y
        entry.hpFrac = hpFrac
        entry.radius = radius
      }
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

  interpolate(alpha: number): void {
    const t = Phaser.Math.Clamp(alpha, 0, 1)

    for (const entry of this.sprites.values()) {
      const pos = roundPos(
        Phaser.Math.Linear(entry.fromX, entry.toX, t),
        Phaser.Math.Linear(entry.fromY, entry.toY, t),
      )
      const depth = 30 + pos.y
      const { radius, hpFrac } = entry

      entry.body.setPosition(pos.x, pos.y).setDepth(depth)
      entry.shadow?.setPosition(pos.x, pos.y + radius).setDepth(depth - 1)
      entry.bar
        .setPosition(pos.x - radius + radius * hpFrac, pos.y - radius - 4)
        .setSize(radius * 2 * hpFrac, 3)
        .setFillStyle(hpFrac > 0.35 ? 0x2ecc71 : 0xe74c3c)
        .setDepth(depth + 0.1)
    }
  }

  playCreepHit(
    creepId: string,
    animations: { flashTint: (sprite: Phaser.GameObjects.Sprite) => void },
  ): void {
    const entry = this.sprites.get(creepId)
    if (!entry) return
    animations.flashTint(entry.body)
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
