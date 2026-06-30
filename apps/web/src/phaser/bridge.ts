import type { GameAction, GameState } from '../game/types';

export interface PhaserBridge {
  getState: () => GameState;
  dispatch: (action: GameAction) => void;
  /** Hover preview — does not persist save or commit actions. */
  previewRockPath: (x: number, y: number) => void;
  clearRockPathPreview: () => void;
  step: (dt: number) => void;
}

let bridge: PhaserBridge | null = null;

export function installBridge(nextBridge: PhaserBridge): void {
  bridge = nextBridge;
}

export function clearBridge(nextBridge: PhaserBridge): void {
  if (bridge === nextBridge) bridge = null;
}

export function tryGetBridge(): PhaserBridge | null {
  return bridge;
}

export function getBridge(): PhaserBridge {
  if (!bridge) throw new Error('Phaser bridge has not been installed.');
  return bridge;
}
