import { useEffect, useRef, useState } from 'react';
import { canPlaceWithoutBlocking } from '../game/pathfinding';
import { getRenderView, renderGame, screenToEnemyId, screenToTile } from '../game/render';
import type { GameState, GridPoint } from '../game/types';
import type { GameController } from '../hooks/useGameController';

interface GameCanvasProps {
  controller: GameController;
}

export function GameCanvas({ controller }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewRef = useRef(getFallbackView());
  const [cursor, setCursor] = useState('crosshair');

  // `controller.game` is a stable ref from useGameController; effect runs once per mount (not on each render).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let frame = 0;
    const render = () => {
      viewRef.current = getRenderView(canvas, controller.game.current);
      renderGame(ctx, controller.game.current, viewRef.current);
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  }, [controller.game]);

  return (
    <div className="pixel-panel pixel-board min-h-0 flex-1 overflow-hidden p-2">
      <canvas
        ref={canvasRef}
        className="h-full min-h-[520px] w-full bg-[#050b10] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-tactical-cyan"
        style={{ cursor }}
        role="application"
        aria-label="PB TD game board"
        onPointerMove={(event) => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const game = controller.game.current;
          const rect = canvas.getBoundingClientRect();
          const tile = screenToTile(viewRef.current, game, event.clientX, event.clientY, rect);
          const targetId = screenToEnemyId(
            viewRef.current,
            game,
            event.clientX,
            event.clientY,
            rect,
          );
          if (tile) controller.dispatch({ type: 'hoverTile', x: tile.x, y: tile.y });
          else controller.dispatch({ type: 'clearHover' });
          setCanvasCursor(setCursor, getCursorForHover(game, tile, targetId));
        }}
        onPointerLeave={() => {
          controller.dispatch({ type: 'clearHover' });
          setCanvasCursor(setCursor, 'crosshair');
        }}
        onClick={(event) => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const game = controller.game.current;
          const rect = canvas.getBoundingClientRect();
          const targetId = screenToEnemyId(
            viewRef.current,
            game,
            event.clientX,
            event.clientY,
            rect,
          );
          const tile = screenToTile(viewRef.current, game, event.clientX, event.clientY, rect);
          if (tile && game.buildMode === 'mazeBlock') {
            controller.dispatch({ type: 'placeMazeBlock', x: tile.x, y: tile.y });
          } else if (tile && game.buildMode === 'shopTower') {
            controller.dispatch({ type: 'placeShopTower', x: tile.x, y: tile.y });
          } else if (targetId && game.selectedTile && selectedTileHasTower(game)) {
            controller.dispatch({
              type: 'setTowerTarget',
              x: game.selectedTile.x,
              y: game.selectedTile.y,
              targetId,
            });
          } else if (tile) {
            controller.dispatch({ type: 'selectTile', x: tile.x, y: tile.y });
          } else {
            controller.dispatch({ type: 'clearHover' });
          }
        }}
      />
    </div>
  );
}

function getFallbackView() {
  return { width: 1, height: 1, cellSize: 1, offsetX: 0, offsetY: 0 };
}

function selectedTileHasTower(game: GameController['game']['current']): boolean {
  const selected = game.selectedTile;
  if (!selected) return false;
  for (let i = 0; i < game.towers.length; i++) {
    const tower = game.towers[i];
    if (tower.x === selected.x && tower.y === selected.y) return true;
  }
  return false;
}

function setCanvasCursor(setCursor: (cursor: string) => void, nextCursor: string): void {
  setCursor(nextCursor);
}

function getCursorForHover(
  game: GameState,
  tile: GridPoint | null,
  targetId: number | null,
): string {
  if (game.buildMode === 'mazeBlock') {
    if (!tile) return 'default';
    return canPlaceMazeBlockAt(game, tile) ? 'pointer' : 'not-allowed';
  }

  if (game.buildMode === 'shopTower') {
    if (!tile) return 'default';
    return canPlaceShopTowerAt(game, tile) ? 'pointer' : 'not-allowed';
  }

  if (targetId && selectedTileHasTower(game)) return 'pointer';
  if (tile && (tileHasTower(game, tile) || tileHasStone(game, tile))) return 'pointer';
  return tile ? 'crosshair' : 'default';
}

function canPlaceMazeBlockAt(game: GameState, tile: GridPoint): boolean {
  if (!canBuildBetweenWaves(game) || game.bankedMazeBlocks <= 0) return false;
  return canPlaceWithoutBlocking(
    game.config.map,
    game.occupied,
    tile.x,
    tile.y,
    getActiveEnemyCells(game),
  );
}

function canPlaceShopTowerAt(game: GameState, tile: GridPoint): boolean {
  if (!canBuildBetweenWaves(game) || !game.selectedShopGemId || tileHasTower(game, tile))
    return false;
  const item = game.config.towerShop.find((shopItem) => shopItem.gemId === game.selectedShopGemId);
  if (!item || game.gold < item.cost) return false;
  if (tileHasStone(game, tile)) return true;
  return canPlaceWithoutBlocking(
    game.config.map,
    game.occupied,
    tile.x,
    tile.y,
    getActiveEnemyCells(game),
  );
}

function canBuildBetweenWaves(game: GameState): boolean {
  return (
    game.phase === 'build' &&
    !game.activeWaveId &&
    game.status !== 'running' &&
    game.status !== 'paused' &&
    game.status !== 'lost'
  );
}

function tileHasTower(game: GameState, tile: GridPoint): boolean {
  for (let i = 0; i < game.towers.length; i++) {
    const tower = game.towers[i];
    if (tower.x === tile.x && tower.y === tile.y) return true;
  }
  return false;
}

function tileHasStone(game: GameState, tile: GridPoint): boolean {
  for (let i = 0; i < game.stones.length; i++) {
    const stone = game.stones[i];
    if (stone.x === tile.x && stone.y === tile.y) return true;
  }
  return false;
}

function getActiveEnemyCells(game: GameState): GridPoint[] {
  const cells: GridPoint[] = [];
  for (let i = 0; i < game.enemies.length; i++) {
    const enemy = game.enemies[i];
    if (enemy.alive) cells.push({ x: Math.round(enemy.x), y: Math.round(enemy.y) });
  }
  return cells;
}
