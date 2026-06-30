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
  tileSize: number;
  padX: number;
  padY: number;
  /** Visible board viewport width (canvas pixels). */
  width: number;
  /** Visible board viewport height (canvas pixels). */
  height: number;
  /** Full map pixel width at current zoom. */
  mapWidth: number;
  /** Full map pixel height at current zoom. */
  mapHeight: number;
  /** Horizontal scroll into the map (0 = west edge). */
  scrollX: number;
  /** Vertical scroll into the map (0 = north edge). */
  scrollY: number;
  /** Camera zoom multiplier (1 = default readable tile size). */
  zoom: number;
}

/** Base tile size — with zoom 1, cells are 48px (comfortable click target). */
export const DEFAULT_TILE_SIZE = 48;
export const MIN_BOARD_ZOOM = 0.7;
export const MAX_BOARD_ZOOM = 1.4;
export const DEFAULT_BOARD_ZOOM = 1;

/** Right sidebar width + margin (matches .game-panel in styles.css). */
export const PANEL_RESERVE = 392;
/** Top HUD height + margin (matches .game-hud overlay). */
export const HUD_RESERVE = 72;

/** Pixels per second for arrow / WASD panning. */
export const BOARD_PAN_SPEED = 480;

export function effectiveTileSize(layout: Pick<BoardLayout, 'tileSize' | 'zoom'>): number {
  return layout.tileSize * layout.zoom;
}

export function computeLayout(width: number, height: number): BoardLayout {
  const reservedTop = width >= 980 ? HUD_RESERVE : 56;
  const reservedRight = width >= 980 ? PANEL_RESERVE : 0;
  const viewportWidth = Math.max(320, width - reservedRight - 32);
  const viewportHeight = Math.max(280, height - reservedTop - reservedBottom(width));
  const tileSize = DEFAULT_TILE_SIZE;
  const zoom = DEFAULT_BOARD_ZOOM;
  const mapBounds = boardPixelBounds(BOARD_WIDTH, BOARD_HEIGHT, tileSize * zoom);

  return {
    left: 16,
    top: reservedTop,
    tileSize,
    padX: mapBounds.padX,
    padY: mapBounds.padY,
    width: viewportWidth,
    height: viewportHeight,
    mapWidth: mapBounds.width,
    mapHeight: mapBounds.height,
    scrollX: 0,
    scrollY: 0,
    zoom,
  };
}

export function layoutWithZoom(layout: BoardLayout, zoom: number): BoardLayout {
  const clampedZoom = Math.min(MAX_BOARD_ZOOM, Math.max(MIN_BOARD_ZOOM, zoom));
  const mapBounds = boardPixelBounds(BOARD_WIDTH, BOARD_HEIGHT, layout.tileSize * clampedZoom);
  return {
    ...layout,
    zoom: clampedZoom,
    mapWidth: mapBounds.width,
    mapHeight: mapBounds.height,
  };
}

export function clampBoardScroll(
  layout: Pick<BoardLayout, 'width' | 'height' | 'mapWidth' | 'mapHeight'>,
  scrollX: number,
  scrollY: number,
): { scrollX: number; scrollY: number } {
  const maxScrollX = Math.max(0, layout.mapWidth - layout.width);
  const maxScrollY = Math.max(0, layout.mapHeight - layout.height);
  return {
    scrollX: Math.min(maxScrollX, Math.max(0, scrollX)),
    scrollY: Math.min(maxScrollY, Math.max(0, scrollY)),
  };
}

export function withBoardScroll(
  layout: BoardLayout,
  scrollX: number,
  scrollY: number,
): BoardLayout {
  const clamped = clampBoardScroll(layout, scrollX, scrollY);
  return { ...layout, ...clamped };
}

/** Zoom toward a screen anchor while keeping the map point under the cursor stable. */
export function zoomBoardAt(
  layout: BoardLayout,
  scrollX: number,
  scrollY: number,
  nextZoom: number,
  anchorX: number,
  anchorY: number,
): { scrollX: number; scrollY: number; zoom: number } {
  const zoom = Math.min(MAX_BOARD_ZOOM, Math.max(MIN_BOARD_ZOOM, nextZoom));
  const oldTs = effectiveTileSize(layout);
  const newTs = layout.tileSize * zoom;
  const viewX = anchorX - layout.left - layout.padX;
  const viewY = anchorY - layout.top - layout.padY;
  const mapU = (viewX + scrollX) / oldTs;
  const mapV = (viewY + scrollY) / oldTs;
  return {
    zoom,
    scrollX: mapU * newTs - viewX,
    scrollY: mapV * newTs - viewY,
  };
}

function reservedBottom(width: number): number {
  return width >= 980 ? 24 : 18;
}

function mapLocalFromScreen(layout: BoardLayout, px: number, py: number): Vec2 {
  return {
    x: px - layout.left - layout.padX + layout.scrollX,
    y: py - layout.top - layout.padY + layout.scrollY,
  };
}

/** Map canvas pixel position to grid cell (snapped). */
export function screenToCell(layout: BoardLayout, px: number, py: number): Vec2 | null {
  const local = mapLocalFromScreen(layout, px, py);
  const ts = effectiveTileSize(layout);
  const cell = pixelToHex(local.x, local.y, ts);
  if (cell.x < 0 || cell.y < 0 || cell.x >= BOARD_WIDTH || cell.y >= BOARD_HEIGHT) return null;
  return cell;
}

/** True when a canvas point lies inside the board viewport. */
export function isPointInBoardViewport(layout: BoardLayout, px: number, py: number): boolean {
  return (
    px >= layout.left &&
    px < layout.left + layout.width &&
    py >= layout.top &&
    py < layout.top + layout.height
  );
}

/** Map canvas pixels to continuous world coordinates. */
export function screenToBoard(layout: BoardLayout, px: number, py: number): Vec2 | null {
  const cell = screenToCell(layout, px, py);
  if (!cell) return null;
  return hexWorldCenter(cell.x, cell.y);
}

/** Grid cell -> canvas pixel center. */
export function cellToScreen(layout: BoardLayout, cell: Vec2): Vec2 {
  const ts = effectiveTileSize(layout);
  const local = hexPixelCenter(cell.x, cell.y, ts);
  return {
    x: layout.left + layout.padX + local.x - layout.scrollX,
    y: layout.top + layout.padY + local.y - layout.scrollY,
  };
}

/** Continuous world position -> canvas pixels. */
export function boardToScreen(layout: BoardLayout, point: Vec2): Vec2 {
  const ts = effectiveTileSize(layout);
  return {
    x: layout.left + layout.padX + point.x * ts - layout.scrollX,
    y: layout.top + layout.padY + point.y * ts - layout.scrollY,
  };
}

export function cellCenter(cell: Vec2): Vec2 {
  return hexWorldCenter(cell.x, cell.y);
}

/** World-space range (tile steps) -> pixel radius for overlays. */
export function rangeToPixels(layout: BoardLayout, range: number): number {
  return range * effectiveTileSize(layout);
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
