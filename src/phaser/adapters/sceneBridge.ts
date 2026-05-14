import type { MutableRefObject } from 'react';
import type { GameAction, GameSnapshot, GameState, SaveState } from '../../game/types';

export interface PhaserSceneBridge {
  game: MutableRefObject<GameState>;
  dispatch: (action: GameAction) => void;
  getSnapshot: () => GameSnapshot;
  getSave: () => SaveState;
  getSpeed: () => number;
  setSpeed: (speed: number) => void;
  resetSave: () => void;
}

let activeBridge: PhaserSceneBridge | null = null;

export function installSceneBridge(bridge: PhaserSceneBridge): void {
  activeBridge = bridge;
}

export function clearSceneBridge(bridge: PhaserSceneBridge): void {
  if (activeBridge === bridge) activeBridge = null;
}

export function getSceneBridge(): PhaserSceneBridge {
  if (!activeBridge) throw new Error('Phaser scene bridge has not been installed.');
  return activeBridge;
}

export function dispatchThroughBridge(
  bridge: Pick<PhaserSceneBridge, 'dispatch'>,
  action: GameAction,
): void {
  bridge.dispatch(action);
}
