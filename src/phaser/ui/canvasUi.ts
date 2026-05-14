import Phaser from 'phaser';
import { Colors, textStyle } from './palette';

export interface UiButton {
  destroy: () => void;
}

export function addLabel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  size = 14,
  color = '#d8eef4',
): Phaser.GameObjects.Text {
  return scene.add.text(x, y, text, textStyle(size, color)).setOrigin(0, 0.5).setDepth(40);
}

export function addButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  onClick: () => void,
  disabled = false,
  tone: 'primary' | 'secondary' | 'danger' = 'secondary',
): UiButton {
  const bg = scene.add.graphics().setDepth(35);
  const color =
    tone === 'primary' ? Colors.cyan : tone === 'danger' ? Colors.red : Colors.panelDark;
  const textColor = tone === 'primary' ? '#041016' : '#d8eef4';
  bg.fillStyle(color, disabled ? 0.34 : tone === 'secondary' ? 0.86 : 0.92);
  bg.fillRoundedRect(x, y, width, height, 3);
  bg.lineStyle(1, tone === 'danger' ? Colors.red : Colors.line, disabled ? 0.16 : 0.55);
  bg.strokeRoundedRect(x, y, width, height, 3);
  const text = scene.add
    .text(x + width / 2, y + height / 2, label, textStyle(13, disabled ? '#7f9ca8' : textColor))
    .setOrigin(0.5)
    .setDepth(40);
  const zone = scene.add
    .zone(x, y, width, height)
    .setOrigin(0)
    .setDepth(45)
    .setInteractive({ useHandCursor: !disabled });
  if (!disabled) zone.on('pointerdown', onClick);
  return {
    destroy: () => {
      zone.destroy();
      text.destroy();
      bg.destroy();
    },
  };
}

export function drawPanel(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  alpha = 0.9,
): void {
  g.fillStyle(Colors.panelDark, alpha);
  g.fillRoundedRect(x, y, width, height, 4);
  g.lineStyle(1, Colors.line, 0.32);
  g.strokeRoundedRect(x, y, width, height, 4);
}

export function destroyButtons(buttons: UiButton[]): void {
  for (let i = 0; i < buttons.length; i++) buttons[i].destroy();
  buttons.length = 0;
}

export function destroyTexts(texts: Phaser.GameObjects.Text[]): void {
  for (let i = 0; i < texts.length; i++) texts[i].destroy();
  texts.length = 0;
}
