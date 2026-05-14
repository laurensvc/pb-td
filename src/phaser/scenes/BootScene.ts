import Phaser from 'phaser';
import { spriteMetadata } from '../../game/spriteMetadata';
import { SceneKeys } from './sceneKeys';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Boot);
  }

  preload(): void {
    this.load.image('monsters', spriteMetadata.sheets.monsters.src);
    this.load.image('gems', spriteMetadata.sheets.gems.src);
    this.load.image('tactical-backdrop', '/assets/ui/tactical-backdrop.png');
  }

  create(): void {
    this.scene.launch(SceneKeys.Board);
    this.scene.launch(SceneKeys.Hud);
    this.scene.launch(SceneKeys.Inspector);
    this.scene.launch(SceneKeys.BuildBar);
    this.scene.stop(SceneKeys.Boot);
  }
}
