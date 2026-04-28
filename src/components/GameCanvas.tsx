import { useEffect, useRef } from 'react';
import { getRenderView, renderGame, screenToEnemyId, screenToTile } from '../game/render';
import type { GameController } from '../hooks/useGameController';

interface GameCanvasProps {
  controller: GameController;
}

export function GameCanvas({ controller }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewRef = useRef(getFallbackView());

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
        className="h-full min-h-[520px] w-full cursor-crosshair bg-[#0d0d0b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-arcade-yellow"
        role="application"
        aria-label="PB TD game board"
        onPointerMove={(event) => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const tile = screenToTile(
            viewRef.current,
            controller.game.current,
            event.clientX,
            event.clientY,
            canvas.getBoundingClientRect(),
          );
          if (tile) controller.dispatch({ type: 'hoverTile', x: tile.x, y: tile.y });
          else controller.dispatch({ type: 'clearHover' });
        }}
        onPointerLeave={() => controller.dispatch({ type: 'clearHover' })}
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
          if (tile && game.pendingGemId) {
            controller.dispatch({ type: 'placePendingGem', x: tile.x, y: tile.y });
          } else if (tile && game.draft.length === 5) {
            controller.dispatch({ type: 'keepDraftCandidate', x: tile.x, y: tile.y });
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
