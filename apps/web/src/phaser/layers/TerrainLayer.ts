import Phaser from 'phaser'
import type { GameSnapshot } from '@facet/protocol'
import { getManifestEntry, PRESENTATION_ASSET_KEYS } from '../../assets/manifest.js'

export class TerrainLayer {
  private readonly tileKey = PRESENTATION_ASSET_KEYS.terrainFloor
  private tilemap: Phaser.GameObjects.TileSprite | null = null

  constructor(private readonly scene: Phaser.Scene) {}

  sync(snapshot: GameSnapshot): void {
    if (this.tilemap) return
    const { worldWidth, worldHeight } = snapshot.board

    if (this.scene.textures.exists(this.tileKey)) {
      const entry = getManifestEntry(this.tileKey)
      const origin = entry ? { x: entry.origin[0], y: entry.origin[1] } : { x: 0, y: 0 }
      this.tilemap = this.scene.add
        .tileSprite(0, 0, worldWidth, worldHeight, this.tileKey)
        .setOrigin(origin.x, origin.y)
        .setDepth(0)
      return
    }

    const g = this.scene.add.graphics().setDepth(0)
    const tileSize = snapshot.board.tileSize
    for (let y = 0; y < worldHeight; y += tileSize) {
      for (let x = 0; x < worldWidth; x += tileSize) {
        const checker = (x / tileSize + y / tileSize) % 2 === 0
        g.fillStyle(checker ? 0x3d6b3d : 0x356235, 1)
        g.fillRect(x, y, tileSize, tileSize)
      }
    }
    this.tilemap = g as unknown as Phaser.GameObjects.TileSprite
  }

  destroy(): void {
    this.tilemap?.destroy()
    this.tilemap = null
  }
}
