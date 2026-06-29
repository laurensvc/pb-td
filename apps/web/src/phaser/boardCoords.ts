import { BOARD_HEIGHT, BOARD_WIDTH } from '../game/content';
import type { Vec2 } from '../game/types';

export interface BoardLayout {
  left: number;
  top: number;
  cell: number;
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
  const cell = Math.floor(Math.min(availableWidth / BOARD_WIDTH, availableHeight / BOARD_HEIGHT));
  return {
    left: Math.max(16, Math.floor((availableWidth - cell * BOARD_WIDTH) / 2)),
    top: reservedTop + Math.max(0, Math.floor((availableHeight - cell * BOARD_HEIGHT) / 2)),
    cell,
    width: cell * BOARD_WIDTH,
    height: cell * BOARD_HEIGHT,
  };
}

function reservedBottom(width: number): number {
  return width >= 980 ? 24 : 18;
}

/** Map canvas pixel position to integer board cell. */
export function screenToCell(layout: BoardLayout, px: number, py: number): Vec2 | null {
  if (
    px < layout.left ||
    py < layout.top ||
    px >= layout.left + layout.width ||
    py >= layout.top + layout.height
  ) {
    return null;
  }
  const x = Math.floor((px - layout.left) / layout.cell);
  const y = Math.floor((py - layout.top) / layout.cell);
  if (x < 0 || y < 0 || x >= BOARD_WIDTH || y >= BOARD_HEIGHT) return null;
  return { x, y };
}

/** Map canvas pixels to continuous board coordinates (cell units, origin top-left). */
export function screenToBoard(layout: BoardLayout, px: number, py: number): Vec2 | null {
  if (
    px < layout.left ||
    py < layout.top ||
    px >= layout.left + layout.width ||
    py >= layout.top + layout.height
  ) {
    return null;
  }
  return {
    x: (px - layout.left) / layout.cell,
    y: (py - layout.top) / layout.cell,
  };
}

/** Integer cell index -> canvas pixel center. */
export function cellToScreen(layout: BoardLayout, cell: Vec2): Vec2 {
  return {
    x: layout.left + (cell.x + 0.5) * layout.cell,
    y: layout.top + (cell.y + 0.5) * layout.cell,
  };
}

/** Continuous board position (e.g. 2.5 = cell center) -> canvas pixels. */
export function boardToScreen(layout: BoardLayout, point: Vec2): Vec2 {
  return {
    x: layout.left + point.x * layout.cell,
    y: layout.top + point.y * layout.cell,
  };
}

export function cellTopLeft(layout: BoardLayout, cell: Vec2): Vec2 {
  return {
    x: layout.left + cell.x * layout.cell,
    y: layout.top + cell.y * layout.cell,
  };
}

export function cellCenter(cell: Vec2): Vec2 {
  return { x: cell.x + 0.5, y: cell.y + 0.5 };
}

/** Convert Phaser pointer to canvas pixel coordinates (handles CSS scaling). */
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
