import Phaser from 'phaser'

import type { GameSnapshot } from '@facet/protocol'

import {
  gemAssetKeyFromGemId,
  PRESENTATION_ASSET_KEYS,
  specialAssetKey,
} from '../../assets/manifest.js'

import { createManifestSprite, playManifestAnimation } from '../../assets/texture-access.js'

interface StructureSprite {
  gfx: Phaser.GameObjects.Sprite

  label: Phaser.GameObjects.Text
}

export class StructureLayer {
  private readonly sprites = new Map<string, StructureSprite>()

  private readonly tileSize: number

  constructor(
    private readonly scene: Phaser.Scene,

    tileSize: number,
  ) {
    this.tileSize = tileSize
  }

  sync(snapshot: GameSnapshot): void {
    const seen = new Set<string>()

    const size = this.tileSize * 2

    const upsert = (
      id: string,

      gx: number,

      gy: number,

      textureKey: string,

      alpha: number,

      label: string,

      depth: number,
    ) => {
      seen.add(id)

      const footX = gx * this.tileSize + size / 2

      const footY = gy * this.tileSize + size

      let entry = this.sprites.get(id)

      if (!entry) {
        const gfx = createManifestSprite(this.scene, footX, footY, textureKey, depth)

        gfx.setDisplaySize(size, size)

        const text = this.scene.add.text(footX, footY - size * 0.55, label, {
          fontFamily: 'monospace',

          fontSize: '10px',

          color: '#0f1219',
        })

        text.setOrigin(0.5)

        entry = { gfx, label: text }

        this.sprites.set(id, entry)

        playManifestAnimation(gfx, textureKey, this.scene)
      } else if (entry.gfx.texture.key !== textureKey) {
        entry.gfx.setTexture(textureKey, 0)

        playManifestAnimation(entry.gfx, textureKey, this.scene)
      }

      entry.gfx.setPosition(footX, footY).setDepth(depth).setAlpha(alpha)

      entry.label.setText(label)

      entry.label.setPosition(footX, footY - size * 0.55)

      entry.label.setDepth(depth + 0.1)

      if (id === snapshot.selectedTowerId) {
        entry.gfx.setTint(0xffffaa)
      } else {
        entry.gfx.clearTint()
      }
    }

    for (const c of snapshot.candidates) {
      upsert(
        c.id,

        c.gx,

        c.gy,

        gemAssetKeyFromGemId(c.gemId),

        c.quality === 'chipped' ? 0.65 : c.quality === 'flawed' ? 0.8 : 1,

        c.type.slice(0, 3),

        20 + c.gy,
      )
    }

    for (const t of snapshot.towers) {
      const textureKey = t.specialId
        ? specialAssetKey(t.specialId)
        : gemAssetKeyFromGemId(t.gemId ?? 'ruby-chipped')

      const label = t.specialId
        ? t.specialId.slice(0, 3)
        : (t.gemId?.split('-')[0]?.slice(0, 3) ?? 'T')

      upsert(t.id, t.gx, t.gy, textureKey, t.active ? 1 : 0.5, label, 20 + t.gy)
    }

    for (const r of snapshot.rocks) {
      upsert(r.id, r.gx, r.gy, PRESENTATION_ASSET_KEYS.rock, 0.9, 'R', 15 + r.gy)
    }

    for (const [id, entry] of this.sprites) {
      if (!seen.has(id)) {
        entry.gfx.destroy()

        entry.label.destroy()

        this.sprites.delete(id)
      }
    }
  }

  hitTest(worldX: number, worldY: number, snapshot: GameSnapshot): string | null {
    const size = this.tileSize * 2

    const structures = [
      ...snapshot.towers.map((t) => ({ id: t.id, gx: t.gx, gy: t.gy })),

      ...snapshot.candidates.map((c) => ({ id: c.id, gx: c.gx, gy: c.gy })),
    ]

    for (const s of structures) {
      const left = s.gx * this.tileSize

      const top = s.gy * this.tileSize

      if (worldX >= left && worldX <= left + size && worldY >= top && worldY <= top + size) {
        return s.id
      }
    }

    return null
  }

  destroy(): void {
    for (const entry of this.sprites.values()) {
      entry.gfx.destroy()

      entry.label.destroy()
    }

    this.sprites.clear()
  }
}
