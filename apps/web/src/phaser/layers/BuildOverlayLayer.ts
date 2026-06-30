import Phaser from 'phaser'

import type { GameSnapshot } from '@facet/protocol'

import { PRESENTATION_ASSET_KEYS } from '../../assets/manifest.js'

import { createManifestSprite } from '../../assets/texture-access.js'

export class BuildOverlayLayer {
  private readonly grid: Phaser.GameObjects.Graphics

  private readonly ghost: Phaser.GameObjects.Rectangle

  private readonly ring: Phaser.GameObjects.Sprite

  constructor(scene: Phaser.Scene, tileSize: number) {
    this.grid = scene.add.graphics().setDepth(100).setVisible(false)

    this.ghost = scene.add

      .rectangle(0, 0, tileSize * 2, tileSize * 2, 0xffffff, 0.25)

      .setStrokeStyle(2, 0xffffff)

      .setDepth(101)

      .setVisible(false)

    this.ring = createManifestSprite(
      scene,

      0,

      0,

      PRESENTATION_ASSET_KEYS.selectionRing,

      102,
    )
      .setVisible(false)

      .setDisplaySize(tileSize * 2.4, tileSize * 2.4)
  }

  sync(snapshot: GameSnapshot): void {
    const show = snapshot.buildOverlayVisible

    this.grid.setVisible(show)

    this.ghost.setVisible(show && snapshot.hover !== null)

    this.ring.setVisible(show && snapshot.hover !== null)

    if (!show) return

    const { tileSize, worldWidth, worldHeight } = snapshot.board

    this.grid.clear()

    this.grid.lineStyle(1, 0xffffff, 0.08)

    for (let x = 0; x <= worldWidth; x += tileSize) {
      this.grid.lineBetween(x, 0, x, worldHeight)
    }

    for (let y = 0; y <= worldHeight; y += tileSize) {
      this.grid.lineBetween(0, y, worldWidth, y)
    }

    if (!snapshot.hover) return

    const { gx, gy, valid } = snapshot.hover

    const size = tileSize * 2

    const cx = gx * tileSize + size / 2

    const cy = gy * tileSize + size / 2

    this.ghost.setPosition(cx, cy)

    this.ghost.setFillStyle(valid ? 0x2ecc71 : 0xe74c3c, 0.25)

    this.ghost.setStrokeStyle(2, valid ? 0x2ecc71 : 0xe74c3c)

    const ringKey = valid
      ? PRESENTATION_ASSET_KEYS.selectionRing
      : PRESENTATION_ASSET_KEYS.invalidRing

    if (this.ring.texture.key !== ringKey) {
      this.ring.setTexture(ringKey, 0)
    }

    this.ring.setPosition(cx, cy).setDisplaySize(size * 1.2, size * 1.2)
  }

  destroy(): void {
    this.grid.destroy()

    this.ghost.destroy()

    this.ring.destroy()
  }
}
