import Phaser from 'phaser';
import { getGem } from '../../game/config';
import { spriteMetadata } from '../../game/spriteMetadata';
import { getSceneBridge, type PhaserSceneBridge } from '../adapters/sceneBridge';
import {
  addButton,
  addLabel,
  destroyButtons,
  destroyTexts,
  drawPanel,
  type UiButton,
} from '../ui/canvasUi';
import { Colors } from '../ui/palette';
import { SceneKeys } from './sceneKeys';

export class BuildBarScene extends Phaser.Scene {
  private bridge!: PhaserSceneBridge;
  private graphics!: Phaser.GameObjects.Graphics;
  private buttons: UiButton[] = [];
  private texts: Phaser.GameObjects.Text[] = [];
  private icons: Phaser.GameObjects.Image[] = [];
  private lastToken = '';

  constructor() {
    super(SceneKeys.BuildBar);
  }

  create(): void {
    this.bridge = getSceneBridge();
    this.graphics = this.add.graphics().setDepth(30);
  }

  update(): void {
    const snapshot = this.bridge.getSnapshot();
    const token = `${this.scale.width}:${this.scale.height}:${snapshot.gold}:${snapshot.bankedMazeBlocks}:${snapshot.buildMode}:${snapshot.selectedShopGemId}:${snapshot.canPlaceMazeBlock}`;
    if (token === this.lastToken) return;
    this.lastToken = token;
    this.redraw();
  }

  private redraw(): void {
    const snapshot = this.bridge.getSnapshot();
    const y = this.scale.height - 132;
    this.graphics.clear();
    destroyButtons(this.buttons);
    destroyTexts(this.texts);
    for (let i = 0; i < this.icons.length; i++) this.icons[i].destroy();
    this.icons.length = 0;
    drawPanel(this.graphics, 12, y, this.scale.width - 24, 120, 0.94);
    this.texts.push(addLabel(this, 28, y + 28, 'MAZE BLOCKS', 13, '#f3ca72'));
    this.texts.push(addLabel(this, 28, y + 66, String(snapshot.bankedMazeBlocks), 32, '#d8eef4'));
    this.buttons.push(
      addButton(
        this,
        126,
        y + 42,
        100,
        42,
        'PLACE',
        () => this.bridge.dispatch({ type: 'placeMazeBlock', x: -1, y: -1 }),
        !snapshot.canPlaceMazeBlock,
        snapshot.buildMode === 'mazeBlock' ? 'primary' : 'secondary',
      ),
    );
    this.texts.push(addLabel(this, 250, y + 24, 'TOWER SHOP', 14, '#8beaff'));
    let x = 250;
    for (let i = 0; i < snapshot.towerShop.length; i++) {
      const item = snapshot.towerShop[i];
      const gem = getGem(this.bridge.game.current.config, item.gemId);
      const active = snapshot.selectedShopGemId === item.gemId;
      const affordable = snapshot.gold >= item.cost;
      const cardY = y + 44;
      this.graphics.fillStyle(active ? Colors.cyan : Colors.panelDark, active ? 0.26 : 0.88);
      this.graphics.fillRoundedRect(x, cardY, 138, 56, 3);
      this.graphics.lineStyle(1, active ? Colors.cyan : Colors.line, affordable ? 0.58 : 0.18);
      this.graphics.strokeRoundedRect(x, cardY, 138, 56, 3);
      const meta = spriteMetadata.gems[item.gemId];
      const icon = this.add
        .image(x + 24, cardY + 28, 'gems')
        .setDepth(40)
        .setDisplaySize(34, 34);
      if (meta) icon.setCrop(meta.frame.x, meta.frame.y, meta.frame.w, meta.frame.h);
      this.icons.push(icon);
      this.texts.push(addLabel(this, x + 48, cardY + 18, gem.family.toUpperCase(), 12, '#d8eef4'));
      this.texts.push(addLabel(this, x + 48, cardY + 40, `${item.cost}G`, 12, '#f3ca72'));
      this.buttons.push(
        addButton(
          this,
          x,
          cardY,
          138,
          56,
          '',
          () => this.bridge.dispatch({ type: 'selectShopTower', gemId: item.gemId }),
          !affordable,
        ),
      );
      x += 148;
    }
    if (snapshot.selectedShopGemId) {
      this.buttons.push(
        addButton(this, this.scale.width - 132, y + 42, 104, 42, 'CLEAR', () =>
          this.bridge.dispatch({ type: 'clearShopSelection' }),
        ),
      );
    }
  }
}
