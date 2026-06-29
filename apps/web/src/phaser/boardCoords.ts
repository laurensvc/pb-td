import { BOARD_HEIGHT, BOARD_WIDTH } from '../game/content';
import {
  boardPixelBounds,
  hexPixelCenter,
  hexWorldCenter,
  pixelToHex,
  worldPerPixel,
  worldToHex,
} from '../game/hexGrid';
import type { Vec2 } from '../game/types';

export interface BoardLayout {
  left: number;
  top: number;
  hexRadius: number;
  padX: number;
  padY: number;
  width: number;
  height: number;
}

/** Right sidebar width + margin (matches .control-panel in styles.css). */
export const PANEL_RESERVE = 434;
/** Top HUD height + margin (matches .top-hud overlay). */
export const HUD_RESERVE = 76;

export function computeLayout(width: number, height: number): BoardLayout {
  const reservedTop = width >= 980 ? HUD_RESERVE : 56;
  const reservedRight = width >= 980 ? PANEL_RESERVE : 0;
  const availableWidth = Math.max(320, width - reservedRight - 32);
  const availableHeight = Math.max(280, height - reservedTop - reservedBottom(width));

  let hexRadius = 22;
  for (let attempt = 0; attempt < 12; attempt++) {
    const bounds = boardPixelBounds(BOARD_WIDTH, BOARD_HEIGHT, hexRadius);
    if (bounds.width <= availableWidth && bounds.height <= availableHeight) break;
    hexRadius = Math.floor(hexRadius * 0.92);
  }

  const bounds = boardPixelBounds(BOARD_WIDTH, BOARD_HEIGHT, hexRadius);
  return {
    left: Math.max(16, Math.floor((availableWidth - bounds.width) / 2)),
    top: reservedTop + Math.max(0, Math.floor((availableHeight - bounds.height) / 2)),
    hexRadius,
    padX: bounds.padX,
    padY: bounds.padY,
    width: bounds.width,
    height: bounds.height,
  };
}

function reservedBottom(width: number): number {
  return width >= 980 ? 24 : 18;
}

/** Map canvas pixel position to axial hex cell. */
export function screenToCell(layout: BoardLayout, px: number, py: number): Vec2 | null {
  const localX = px - layout.left - layout.padX;
  const localY = py - layout.top - layout.padY;
  const cell = pixelToHex(localX, localY, layout.hexRadius);
  if (cell.x < 0 || cell.y < 0 || cell.x >= BOARD_WIDTH || cell.y >= BOARD_HEIGHT) return null;
  return cell;
}

/** Map canvas pixels to continuous world coordinates. */
export function screenToBoard(layout: BoardLayout, px: number, py: number): Vec2 | null {
  const cell = screenToCell(layout, px, py);
  if (!cell) return null;
  return hexWorldCenter(cell.x, cell.y);
}

/** Axial cell -> canvas pixel center. */
export function cellToScreen(layout: BoardLayout, cell: Vec2): Vec2 {
  const local = hexPixelCenter(cell.x, cell.y, layout.hexRadius);
  return {
    x: layout.left + layout.padX + local.x,
    y: layout.top + layout.padY + local.y,
  };
}

/** Continuous world position -> canvas pixels. */
export function boardToScreen(layout: BoardLayout, point: Vec2): Vec2 {
  const scale = layout.hexRadius * Math.sqrt(3);
  return {
    x: layout.left + layout.padX + point.x * scale,
    y: layout.top + layout.padY + point.y * scale,
  };
}
export function cellCenter(cell: Vec2): Vec2 {
  return hexWorldCenter(cell.x, cell.y);
}

/** World-space range (hex steps) -> pixel radius for overlays. */
export function rangeToPixels(layout: BoardLayout, range: number): number {
  return range * layout.hexRadius * Math.sqrt(3);
}

export function pointerToCanvas(
  pointer: Phaser.Input.Pointer,
  canvas: HTMLCanvasElement,
  gameWidth: number,
  gameHeight: number,
): Vec2 {
  const event = pointer.event as MouseEvent | TouchEvent | undefined;
  const rect = canvas.getBoundingClientRect();
  const scaleX = gameWidth / rect.width;
  const scaleY = gameHeight / rect.height;

  if (event && 'clientX' in event) {
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }
  if (event && 'touches' in event && event.touches[0]) {
    const touch = event.touches[0];
    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
    };
  }

  return { x: pointer.x, y: pointer.y };
}

export { worldPerPixel, worldToHex };
