import { useCallback, useMemo, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import { persistSave, loadSave } from '../game/save';
import { saveFingerprint } from '../game/saveFingerprint';
import {
  createGame,
  createSnapshot,
  dispatchGameAction,
  previewRockPath,
  tickGame,
} from '../game/engine';
import type { GameAction, GameState, Snapshot } from '../game/types';
import type { PhaserBridge } from '../phaser/bridge';

const PUBLISH_INTERVAL_S = 0.08;

interface ClientUiState {
  toast: string | null;
  rockPathDelta: number | null;
}

function mergeSnapshot(state: GameState, clientUi: ClientUiState): Snapshot {
  return {
    ...createSnapshot(state),
    toast: clientUi.toast,
    rockPathDelta: clientUi.rockPathDelta,
  };
}

export interface CosmicGameController {
  game: MutableRefObject<GameState>;
  snapshot: Snapshot;
  bridge: PhaserBridge;
  dispatch: (action: GameAction) => void;
}

export function useCosmicGame(): CosmicGameController {
  const [initialGame] = useState<GameState>(() => createGame(loadSave()));
  const game = useRef<GameState>(initialGame);
  const clientUi = useRef<ClientUiState>({ toast: null, rockPathDelta: null });
  const lastPublish = useRef(0);
  const lastSaveFingerprint = useRef(saveFingerprint(initialGame.save));
  const uiDirty = useRef(true);
  const [snapshot, setSnapshot] = useState<Snapshot>(() =>
    mergeSnapshot(initialGame, { toast: null, rockPathDelta: null }),
  );

  const publish = useCallback((options?: { persist?: boolean }) => {
    const ui = clientUi.current;
    const next = mergeSnapshot(game.current, ui);
    ui.toast = null;
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
      const feedback = dispatchGameAction(game.current, action);
      if (feedback.toast) {
        clientUi.current.toast = feedback.toast;
      }
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
        clientUi.current.rockPathDelta = previewRockPath(game.current, x, y);
        uiDirty.current = true;
      },
      clearRockPathPreview: () => {
        clientUi.current.rockPathDelta = null;
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
