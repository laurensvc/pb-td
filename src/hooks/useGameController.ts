import { useCallback, useEffect, useMemo, useRef } from 'react';
import { gameConfig } from '../game/config';
import {
  commitProgressToSave,
  createGame,
  createSnapshot,
  dispatchGameAction,
  tickGame,
} from '../game/engine';
import type { GameAction, GameState } from '../game/types';
import { useSaveStore } from '../stores/saveStore';
import { useUiStore } from '../stores/uiStore';

export interface GameController {
  game: React.MutableRefObject<GameState>;
  dispatch: (action: GameAction) => void;
}

export function useGameController(): GameController {
  const save = useSaveStore((state) => state.save);
  const setSave = useSaveStore((state) => state.setSave);
  const setSnapshot = useUiStore((state) => state.setSnapshot);
  const speedRef = useRef(useUiStore.getState().speed);
  const gameRef = useRef(createGame(gameConfig, save));
  const terminalStatusRef = useRef<string | null>(null);
  const requiredClearSavedRef = useRef(gameRef.current.stats.completedRequiredWaves);

  useEffect(() => {
    const unsubscribe = useUiStore.subscribe((state) => {
      speedRef.current = state.speed;
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    setSnapshot(createSnapshot(gameRef.current));
  }, [setSnapshot]);

  const dispatch = useCallback(
    (action: GameAction) => {
      dispatchGameAction(gameRef.current, action);
      setSnapshot(createSnapshot(gameRef.current));
    },
    [setSnapshot],
  );

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    let snapshotTimer = 0;
    const fixedStep = 1 / 60;
    let accumulator = 0;

    const loop = (now: number) => {
      const rawDt = Math.min(0.08, (now - last) / 1000);
      last = now;
      accumulator += rawDt * speedRef.current;
      while (accumulator >= fixedStep) {
        tickGame(gameRef.current, fixedStep);
        accumulator -= fixedStep;
      }
      snapshotTimer += rawDt;
      if (snapshotTimer > 0.12) {
        const game = gameRef.current;
        setSnapshot(createSnapshot(game));
        if (!game.stats.completedRequiredWaves) requiredClearSavedRef.current = false;
        if (game.stats.completedRequiredWaves && !requiredClearSavedRef.current) {
          requiredClearSavedRef.current = true;
          setSave(commitProgressToSave(game, useSaveStore.getState().save));
        }
        if (
          (game.status === 'won' || (game.status === 'lost' && !game.stats.completedRequiredWaves)) &&
          terminalStatusRef.current !== game.status
        ) {
          terminalStatusRef.current = game.status;
          setSave(commitProgressToSave(game, useSaveStore.getState().save));
        }
        snapshotTimer = 0;
      }
      frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [setSave, setSnapshot]);

  return useMemo(() => ({ game: gameRef, dispatch }), [dispatch]);
}
