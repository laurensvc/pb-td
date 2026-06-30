import Phaser from 'phaser'

import type { GameBridge } from '../bridge/game-bridge.js'

import { preloadManifest } from '../assets/preload.js'

import { BoardScene } from './scenes/BoardScene.js'

class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene')
  }

  create(): void {
    preloadManifest(this)

    this.scene.start('BoardScene', { bridge: this.registry.get('bridge') })
  }
}

export function createPhaserGame(parent: HTMLElement, bridge: GameBridge) {
  const snapshot = bridge.getSnapshot()

  const width = Math.min(960, snapshot.board.worldWidth)

  const height = Math.min(640, snapshot.board.worldHeight)

  const game = new Phaser.Game({
    type: Phaser.AUTO,

    parent,

    width,

    height,

    backgroundColor: '#1a1f2e',

    pixelArt: true,

    roundPixels: true,

    scene: [PreloadScene, BoardScene],
  })

  game.registry.set('bridge', bridge)

  return game
}
