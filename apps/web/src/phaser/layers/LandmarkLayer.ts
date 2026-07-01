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

import { BOARD_LANDMARKS, landmarkWorldCenter } from '../../board/landmarks.js'

export class LandmarkLayer {
  private readonly markers = new Map<string, Phaser.GameObjects.Sprite>()

  constructor(private readonly scene: Phaser.Scene) {}

  sync(snapshot: GameSnapshot): void {
    const tile = snapshot.board.tileSize

    const pad = tile * 3

    for (const lm of BOARD_LANDMARKS) {
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
    return landmarkWorldCenter(landmarkId, tileSize)
  }

  destroy(): void {
    for (const marker of this.markers.values()) marker.destroy()

    this.markers.clear()
  }
}
