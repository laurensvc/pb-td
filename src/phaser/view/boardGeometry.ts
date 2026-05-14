import type { EnemyState, GameState, GridPoint, RenderViewState } from '../../game/types';

export interface BoardBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PhaserBoardLayout extends RenderViewState {
  boardX: number;
  boardY: number;
  boardWidth: number;
  boardHeight: number;
}

export function computeBoardLayout(state: GameState, bounds: BoardBounds): PhaserBoardLayout {
  const map = state.config.map;
  const cellSize = Math.max(
    1,
    Math.floor(Math.min(bounds.width / map.width, bounds.height / map.height)),
  );
  const width = Math.max(1, Math.floor(bounds.width));
  const height = Math.max(1, Math.floor(bounds.height));
  const boardWidth = cellSize * map.width;
  const boardHeight = cellSize * map.height;
  return {
    width,
    height,
    cellSize,
    offsetX: Math.floor(bounds.x + (width - boardWidth) / 2),
    offsetY: Math.floor(bounds.y + (height - boardHeight) / 2),
    boardX: Math.floor(bounds.x),
    boardY: Math.floor(bounds.y),
    boardWidth,
    boardHeight,
  };
}

export function pointToTile(
  layout: PhaserBoardLayout,
  state: GameState,
  pointerX: number,
  pointerY: number,
): GridPoint | null {
  const tileX = Math.floor((pointerX - layout.offsetX) / layout.cellSize);
  const tileY = Math.floor((pointerY - layout.offsetY) / layout.cellSize);
  if (tileX < 0 || tileY < 0 || tileX >= state.config.map.width || tileY >= state.config.map.height)
    return null;
  return { x: tileX, y: tileY };
}

export function pointToEnemyId(
  layout: PhaserBoardLayout,
  enemies: readonly EnemyState[],
  pointerX: number,
  pointerY: number,
): number | null {
  const x = (pointerX - layout.offsetX) / layout.cellSize;
  const y = (pointerY - layout.offsetY) / layout.cellSize;
  const hitRadiusSq = 0.42 * 0.42;
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    if (!enemy.alive) continue;
    const dx = enemy.x + 0.5 - x;
    const dy = enemy.y + 0.5 - y;
    if (dx * dx + dy * dy <= hitRadiusSq) return enemy.id;
  }
  return null;
}

export function tileCenter(
  layout: PhaserBoardLayout,
  x: number,
  y: number,
): { x: number; y: number } {
  return {
    x: layout.offsetX + x * layout.cellSize + layout.cellSize / 2,
    y: layout.offsetY + y * layout.cellSize + layout.cellSize / 2,
  };
}
