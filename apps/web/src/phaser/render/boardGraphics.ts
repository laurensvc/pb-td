import Phaser from 'phaser';
import { hexPixelCorners } from '../../game/hexGrid';
import type { GameState, MissileState, Vec2 } from '../../game/types';
import { canPlaceAtBoardPoint } from '../boardInput';
import {
  boardToScreen,
  cellCenter,
  cellToScreen,
  rangeToPixels,
  type BoardLayout,
} from '../boardCoords';

export const COLORS = {
  bg: 0x050812,
  grid: 0x19324a,
  path: 0x35d0ff,
  green: 0x7fffb2,
  red: 0xff5a7a,
  shield: 0xbd9cff,
};

export function hideMissingSprites<T extends string | number>(
  sprites: Map<T, Phaser.GameObjects.Image | Phaser.GameObjects.Sprite>,
  liveIds: ReadonlySet<T>,
): void {
  for (const [id, sprite] of sprites) {
    if (!liveIds.has(id)) sprite.setVisible(false);
  }
}

export function pruneMissingSprites<T extends string | number>(
  sprites: Map<T, Phaser.GameObjects.GameObject>,
  liveIds: ReadonlySet<T>,
): void {
  for (const [id, sprite] of sprites) {
    if (!liveIds.has(id)) {
      sprite.destroy();
      sprites.delete(id);
    }
  }
}

export function hexScreenCorners(layout: BoardLayout, cell: Vec2): Vec2[] {
  return hexPixelCorners(cell.x, cell.y, layout.hexRadius).map((corner) => ({
    x: layout.left + layout.padX + corner.x,
    y: layout.top + layout.padY + corner.y,
  }));
}

function drawHexShape(
  g: Phaser.GameObjects.Graphics,
  corners: Vec2[],
  fill: number,
  fillAlpha: number,
  stroke?: number,
  strokeAlpha = 0.35,
): void {
  g.fillStyle(fill, fillAlpha);
  g.beginPath();
  g.moveTo(corners[0]!.x, corners[0]!.y);
  for (let i = 1; i < corners.length; i++) g.lineTo(corners[i]!.x, corners[i]!.y);
  g.closePath();
  g.fillPath();
  if (stroke !== undefined) {
    g.lineStyle(1, stroke, strokeAlpha);
    g.strokePath();
  }
}

export function drawCheckpointRoute(
  g: Phaser.GameObjects.Graphics,
  layout: BoardLayout,
  checkpoints: readonly Vec2[],
): void {
  if (checkpoints.length < 2) return;
  g.lineStyle(3, COLORS.path, 0.28);
  for (let i = 0; i < checkpoints.length - 1; i++) {
    const a = cellToScreen(layout, checkpoints[i]!);
    const b = cellToScreen(layout, checkpoints[i + 1]!);
    g.beginPath();
    g.moveTo(a.x, a.y);
    g.lineTo(b.x, b.y);
    g.strokePath();
  }
  for (const cp of checkpoints) {
    const point = cellToScreen(layout, cp);
    g.fillStyle(COLORS.path, 0.55);
    g.fillCircle(point.x, point.y, Math.max(4, layout.hexRadius * 0.08));
  }
}

export function drawPathOverlay(
  g: Phaser.GameObjects.Graphics,
  layout: BoardLayout,
  pathNav: GameState['pathNav'],
): void {
  for (const key of pathNav.pathCells) {
    const [x, y] = key.split(',').map(Number);
    drawHexShape(g, hexScreenCorners(layout, { x, y }), COLORS.path, 0.08, undefined);
  }
}

export function drawPlacementPreview(
  g: Phaser.GameObjects.Graphics,
  layout: BoardLayout,
  state: GameState,
  hoverCell: Vec2 | null,
): void {
  if (!hoverCell || state.status === 'running') return;
  const boardPoint = cellCenter(hoverCell);
  const corners = hexScreenCorners(layout, hoverCell);
  if (canPlaceAtBoardPoint(state, boardPoint.x, boardPoint.y)) {
    drawHexShape(g, corners, COLORS.green, 0.25, COLORS.green, 0.85);
  }
}

export function drawMissile(
  g: Phaser.GameObjects.Graphics,
  layout: BoardLayout,
  missile: MissileState,
): void {
  const point = boardToScreen(layout, missile);
  const radius = rangeToPixels(layout, missile.radius);
  if (missile.active) {
    g.lineStyle(2, 0xfff4a3, 0.75);
    g.strokeCircle(point.x, point.y, Math.max(6, radius * (1 - missile.impactIn / 0.24)));
    return;
  }
  g.fillStyle(0xfff4a3, Math.max(0, missile.life / 0.42) * 0.18);
  g.fillCircle(point.x, point.y, radius);
  g.lineStyle(3, 0xffcf6b, Math.max(0, missile.life / 0.42) * 0.8);
  g.strokeCircle(point.x, point.y, radius);
}
