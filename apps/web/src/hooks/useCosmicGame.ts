import { useCallback, useMemo, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import { persistSave, loadSave } from '../game/save';
import {
  createGame,
  createSnapshot,
  dispatchGameAction,
  tickGame,
} from '../game/engine';
import type { GameAction, GameState, Snapshot } from '../game/types';
import type { PhaserBridge } from '../phaser/bridge';

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
  const [snapshot, setSnapshot] = useState<Snapshot>(() => createSnapshot(initialGame));

  const publish = useCallback(() => {
    persistSave(game.current.save);
    setSnapshot(createSnapshot(game.current));
  }, []);

  const dispatch = useCallback(
    (action: GameAction) => {
      dispatchGameAction(game.current, action);
      publish();
    },
    [publish],
  );

  const bridge = useMemo<PhaserBridge>(
    () => ({
      getState: () => game.current,
      dispatch,
      step: (dt: number) => {
        tickGame(game.current, dt);
        lastPublish.current += dt;
        if (lastPublish.current >= 0.08) {
          lastPublish.current = 0;
          publish();
        }
      },
    }),
    [dispatch, publish],
  );

  return { game, snapshot, bridge, dispatch };
}
