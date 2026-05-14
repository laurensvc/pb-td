import Phaser from 'phaser';
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

const SPEEDS = [1, 1.5, 2, 3] as const;

export class HudScene extends Phaser.Scene {
  private bridge!: PhaserSceneBridge;
  private graphics!: Phaser.GameObjects.Graphics;
  private buttons: UiButton[] = [];
  private texts: Phaser.GameObjects.Text[] = [];
  private lastToken = '';

  constructor() {
    super(SceneKeys.Hud);
  }

  create(): void {
    this.bridge = getSceneBridge();
    this.graphics = this.add.graphics().setDepth(30);
  }

  update(): void {
    const snapshot = this.bridge.getSnapshot();
    const speed = this.bridge.getSpeed();
    const token = `${this.scale.width}:${snapshot.gold}:${snapshot.lives}:${snapshot.wave}:${snapshot.totalWaves}:${snapshot.phase}:${snapshot.status}:${snapshot.message}:${snapshot.canStartWave}:${speed}`;
    if (token === this.lastToken) return;
    this.lastToken = token;
    this.redraw();
  }

  private redraw(): void {
    const snapshot = this.bridge.getSnapshot();
    const speed = this.bridge.getSpeed();
    this.graphics.clear();
    destroyButtons(this.buttons);
    destroyTexts(this.texts);
    drawPanel(this.graphics, 12, 10, this.scale.width - 24, 92, 0.92);
    this.graphics.fillStyle(Colors.cyan, 0.9);
    this.graphics.fillRect(12, 10, 4, 92);
    this.texts.push(addLabel(this, 28, 30, 'PB TD', 14, '#8beaff'));
    this.texts.push(addLabel(this, 28, 60, 'Gem Castle Defense', 25, '#d8eef4'));
    this.texts.push(addLabel(this, 300, 28, `GOLD ${snapshot.gold}`, 16, '#f3ca72'));
    this.texts.push(addLabel(this, 430, 28, `LIVES ${snapshot.lives}`, 16, '#ff6f86'));
    this.texts.push(
      addLabel(this, 560, 28, `WAVE ${snapshot.wave} / ${snapshot.totalWaves}`, 16, '#b8a5ff'),
    );
    this.texts.push(addLabel(this, 300, 66, snapshot.message, 14, '#d8eef4'));
    const right = this.scale.width - 476;
    this.buttons.push(
      addButton(
        this,
        right,
        28,
        118,
        42,
        'START WAVE',
        () => this.bridge.dispatch({ type: 'startWave' }),
        !snapshot.canStartWave,
        'primary',
      ),
    );
    this.buttons.push(
      addButton(
        this,
        right + 128,
        28,
        92,
        42,
        snapshot.status === 'paused' ? 'RESUME' : 'PAUSE',
        () => this.bridge.dispatch({ type: snapshot.status === 'paused' ? 'resume' : 'pause' }),
      ),
    );
    this.buttons.push(
      addButton(this, right + 230, 28, 92, 42, `SPD ${speed}x`, () => this.cycleSpeed()),
    );
    this.buttons.push(
      addButton(
        this,
        right + 332,
        28,
        118,
        42,
        'RESET',
        () => this.bridge.dispatch({ type: 'resetRun' }),
        false,
        'danger',
      ),
    );
  }

  private cycleSpeed(): void {
    const speed = this.bridge.getSpeed();
    let next: number = SPEEDS[0];
    for (let i = 0; i < SPEEDS.length; i++) {
      if (SPEEDS[i] === speed) {
        next = SPEEDS[(i + 1) % SPEEDS.length];
        break;
      }
    }
    this.bridge.setSpeed(next);
  }
}
