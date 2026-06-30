import Phaser from 'phaser'

import type { GameSnapshot } from '@facet/protocol'

import { createManifestSprite } from '../../assets/texture-access.js'

const LANDMARK_TEXTURE_KEYS: Record<string, string> = {
  spawn: 'env.spawn-gate',

  'checkpoint-1': 'env.checkpoint-1',

  'checkpoint-2': 'env.checkpoint-2',

  'checkpoint-3': 'env.checkpoint-3',

  'checkpoint-4': 'env.checkpoint-4',

  'checkpoint-5': 'env.checkpoint-5',

  goal: 'env.goal-nexus',
}

const LANDMARKS: Array<{ id: string; gx: number; gy: number }> = [
  { id: 'spawn', gx: 8, gy: 124 },

  { id: 'checkpoint-1', gx: 68, gy: 68 },

  { id: 'checkpoint-2', gx: 108, gy: 48 },

  { id: 'checkpoint-3', gx: 48, gy: 48 },

  { id: 'checkpoint-4', gx: 108, gy: 88 },

  { id: 'checkpoint-5', gx: 48, gy: 88 },

  { id: 'goal', gx: 124, gy: 8 },
]

export class LandmarkLayer {
  private readonly markers = new Map<string, Phaser.GameObjects.Sprite>()

  constructor(private readonly scene: Phaser.Scene) {}

  sync(snapshot: GameSnapshot): void {
    const tile = snapshot.board.tileSize

    const pad = tile * 3

    for (const lm of LANDMARKS) {
      const key = LANDMARK_TEXTURE_KEYS[lm.id]!

      const footX = lm.gx * tile + tile * 1.5

      const footY = lm.gy * tile + pad

      let sprite = this.markers.get(lm.id)

      if (!sprite) {
        sprite = createManifestSprite(this.scene, footX, footY, key, 5)

        sprite.setDisplaySize(pad, pad)

        this.markers.set(lm.id, sprite)
      }

      sprite.setPosition(footX, footY)
    }
  }

  getWorldCenter(landmarkId: string, tileSize: number): { x: number; y: number } | null {
    const lm = LANDMARKS.find((l) => l.id === landmarkId)

    if (!lm) return null

    return { x: lm.gx * tileSize + tileSize * 1.5, y: lm.gy * tileSize + tileSize * 1.5 }
  }

  destroy(): void {
    for (const marker of this.markers.values()) marker.destroy()

    this.markers.clear()
  }
}
