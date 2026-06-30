import Phaser from 'phaser';
import { BOARD_HEIGHT, BOARD_WIDTH } from '../../game/content';
import { hexPixelCorners } from '../../game/hexGrid';
import type { GameState, Vec2 } from '../../game/types';
import { canPlaceAtBoardPoint } from '../boardInput';
import { cellCenter, cellToScreen, effectiveTileSize, type BoardLayout } from '../boardCoords';

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

export function cellScreenCorners(layout: BoardLayout, cell: Vec2): Vec2[] {
  const ts = effectiveTileSize(layout);
  return hexPixelCorners(cell.x, cell.y, ts).map((corner) => ({
    x: layout.left + layout.padX + corner.x - layout.scrollX,
    y: layout.top + layout.padY + corner.y - layout.scrollY,
  }));
}

function drawSquareShape(
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

export function drawGridOverlay(
  g: Phaser.GameObjects.Graphics,
  layout: BoardLayout,
  alpha: number,
): void {
  if (alpha <= 0.01) return;
  const ts = effectiveTileSize(layout);
  const originX = layout.left + layout.padX - layout.scrollX;
  const originY = layout.top + layout.padY - layout.scrollY;
  const firstCol = Math.max(0, Math.floor(layout.scrollX / ts) - 1);
  const lastCol = Math.min(BOARD_WIDTH, Math.ceil((layout.scrollX + layout.width) / ts) + 1);
  const firstRow = Math.max(0, Math.floor(layout.scrollY / ts) - 1);
  const lastRow = Math.min(BOARD_HEIGHT, Math.ceil((layout.scrollY + layout.height) / ts) + 1);

  g.lineStyle(1, COLORS.grid, alpha);
  for (let col = firstCol; col <= lastCol; col++) {
    const x = originX + col * ts;
    g.beginPath();
    g.moveTo(x, originY + firstRow * ts);
    g.lineTo(x, originY + lastRow * ts);
    g.strokePath();
  }
  for (let row = firstRow; row <= lastRow; row++) {
    const y = originY + row * ts;
    g.beginPath();
    g.moveTo(originX + firstCol * ts, y);
    g.lineTo(originX + lastCol * ts, y);
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
    g.fillCircle(point.x, point.y, Math.max(4, effectiveTileSize(layout) * 0.08));
  }
}

export function drawPathOverlay(
  g: Phaser.GameObjects.Graphics,
  layout: BoardLayout,
  pathNav: GameState['pathNav'],
): void {
  for (const key of pathNav.pathCells) {
    const [x, y] = key.split(',').map(Number);
    drawSquareShape(g, cellScreenCorners(layout, { x, y }), COLORS.path, 0.08, undefined);
  }
}

export function gridOverlayAlpha(state: GameState): number {
  if (state.status === 'running') return 0;
  if (state.buildStep === 'rocks' || state.buildStep === 'prospect') return 0.22;
  if (state.placementMode === 'gem' || state.placementMode === 'hold') return 0.14;
  return 0.06;
}

export function drawPlacementPreview(
  g: Phaser.GameObjects.Graphics,
  layout: BoardLayout,
  state: GameState,
  hoverCell: Vec2 | null,
): void {
  if (!hoverCell || state.status === 'running') return;
  const boardPoint = cellCenter(hoverCell);
  const corners = cellScreenCorners(layout, hoverCell);
  const canPlace = canPlaceAtBoardPoint(state, boardPoint.x, boardPoint.y);
  if (canPlace) {
    drawSquareShape(g, corners, COLORS.green, 0.22, COLORS.green, 0.9);
  } else if (state.buildStep === 'rocks' && state.placementMode === 'rock') {
    drawSquareShape(g, corners, COLORS.red, 0.16, COLORS.red, 0.75);
  }
}

export function drawProspectHighlight(
  g: Phaser.GameObjects.Graphics,
  layout: BoardLayout,
  cell: Vec2,
): void {
  drawSquareShape(g, cellScreenCorners(layout, cell), COLORS.path, 0.18, COLORS.path, 0.85);
}
