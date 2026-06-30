import { useCallback, useMemo, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import { persistSave, loadSave } from '../game/save';
import { saveFingerprint } from '../game/saveFingerprint';
import {
  clearRockPathPreview,
  consumeTransientUi,
  createGame,
  createSnapshot,
  dispatchGameAction,
  previewRockPath,
  tickGame,
} from '../game/engine';
import type { GameAction, GameState, Snapshot } from '../game/types';
import type { PhaserBridge } from '../phaser/bridge';

const PUBLISH_INTERVAL_S = 0.08;

export interface CosmicGameController {
  game: MutableRefObject<GameState>;
  snapshot: Snapshot;
  bridge: PhaserBridge;
  dispatch: (action: GameAction) => void;
}

export function useCosmicGame(): CosmicGameController {
  const [initialGame] = useState<GameState>(() => createGame(loadSave()));
  const game = useRef<GameState>(initialGame);
  const lastPublish = useRef(0);
  const lastSaveFingerprint = useRef(saveFingerprint(initialGame.save));
  const uiDirty = useRef(true);
  const [snapshot, setSnapshot] = useState<Snapshot>(() => createSnapshot(initialGame));

  const publish = useCallback((options?: { persist?: boolean }) => {
    const next = createSnapshot(game.current);
    consumeTransientUi(game.current);
    setSnapshot(next);
    uiDirty.current = false;

    if (options?.persist === false) return;
    const fp = saveFingerprint(game.current.save);
    if (fp !== lastSaveFingerprint.current) {
      persistSave(game.current.save);
      lastSaveFingerprint.current = fp;
    }
  }, []);

  const dispatch = useCallback(
    (action: GameAction) => {
      dispatchGameAction(game.current, action);
      uiDirty.current = true;
      publish();
    },
    [publish],
  );

  const bridge = useMemo<PhaserBridge>(
    () => ({
      getState: () => game.current,
      dispatch,
      previewRockPath: (x: number, y: number) => {
        previewRockPath(game.current, x, y);
        uiDirty.current = true;
      },
      clearRockPathPreview: () => {
        clearRockPathPreview(game.current);
        uiDirty.current = true;
      },
      step: (dt: number) => {
        const state = game.current;
        const speed = state.status === 'running' ? state.gameSpeed : 1;
        tickGame(state, dt * speed);
        lastPublish.current += dt;

        const shouldPublish =
          uiDirty.current ||
          state.status === 'running' ||
          state.missiles.some((m) => m.active && m.impactIn > 0) ||
          state.fxEvents.length > 0;

        if (shouldPublish && lastPublish.current >= PUBLISH_INTERVAL_S) {
          lastPublish.current = 0;
          const persist =
            state.status === 'running' ||
            state.status === 'lost' ||
            state.status === 'cleared';
          publish({ persist });
        }
      },
    }),
    [dispatch, publish],
  );

  return { game, snapshot, bridge, dispatch };
}
