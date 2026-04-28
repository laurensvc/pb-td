import { useEffect, useRef } from 'react';
import { getRenderView, renderGame, screenToTile } from '../game/render';
import type { GameController } from '../hooks/useGameController';

interface GameCanvasProps {
  controller: GameController;
}

export function GameCanvas({ controller }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewRef = useRef(getFallbackView());

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
    <div className="forge-panel min-h-0 flex-1 overflow-hidden rounded-md p-2">
      <canvas
        ref={canvasRef}
        className="h-full min-h-[520px] w-full cursor-crosshair rounded bg-[#15120f]"
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
          const tile = screenToTile(
            viewRef.current,
            controller.game.current,
            event.clientX,
            event.clientY,
            canvas.getBoundingClientRect(),
          );
          if (!tile) return;
          if (controller.game.current.pendingGemId) {
            controller.dispatch({ type: 'placePendingGem', x: tile.x, y: tile.y });
          } else if (controller.game.current.draft.length === 5) {
            controller.dispatch({ type: 'keepDraftCandidate', x: tile.x, y: tile.y });
          } else {
            controller.dispatch({ type: 'selectTile', x: tile.x, y: tile.y });
          }
        }}
      />
    </div>
  );
}

function getFallbackView() {
  return { width: 1, height: 1, cellSize: 1, offsetX: 0, offsetY: 0 };
}
