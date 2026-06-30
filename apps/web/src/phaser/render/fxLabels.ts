import Phaser from 'phaser';
import type { FxEvent } from '../../game/types';
import { boardToScreen, type BoardLayout } from '../boardCoords';
import { pruneMissingSprites } from './boardGraphics';

export function updateFxLabels(
  scene: Phaser.Scene,
  layout: BoardLayout,
  fxLabels: Map<number, Phaser.GameObjects.Text>,
  fxEvents: readonly FxEvent[],
): void {
  const liveIds = new Set<number>();
  for (const fx of fxEvents) {
    liveIds.add(fx.id);
    const point = boardToScreen(layout, { x: fx.x, y: fx.y });
    const alpha = Math.min(1, fx.life);
    const color =
      fx.kind === 'merge' ? '#fff4a3' : fx.kind === 'quest' ? '#e9d5ff' : '#7fffb2';
    const rise = (1 - alpha) * layout.hexRadius * 0.55;

    let label = fxLabels.get(fx.id);
    if (!label) {
      label = scene.add
        .text(0, 0, fx.text, {
          fontFamily: 'Chakra Petch, monospace',
          fontSize: `${Math.max(12, Math.floor(layout.hexRadius * 0.58))}px`,
          color,
          fontStyle: 'bold',
          stroke: '#02050a',
          strokeThickness: 3,
        })
        .setOrigin(0.5, 0.5)
        .setDepth(4.2);
      fxLabels.set(fx.id, label);
    }

    label
      .setText(fx.text)
      .setColor(color)
      .setAlpha(alpha)
      .setPosition(point.x, point.y - layout.hexRadius * 0.35 - rise)
      .setVisible(true);
  }
  pruneMissingSprites(fxLabels, liveIds);
}
