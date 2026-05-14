import { describe, expect, it, vi } from 'vitest';
import { gameConfig } from '../../game/config';
import { createGame, createSnapshot, defaultSaveState } from '../../game/engine';
import {
  clearSceneBridge,
  dispatchThroughBridge,
  getSceneBridge,
  installSceneBridge,
  type PhaserSceneBridge,
} from './sceneBridge';

describe('Phaser scene bridge', () => {
  it('installs, exposes, and clears the active bridge', () => {
    const bridge = makeBridge();
    installSceneBridge(bridge);

    expect(getSceneBridge()).toBe(bridge);

    clearSceneBridge(bridge);
    expect(() => getSceneBridge()).toThrow('Phaser scene bridge has not been installed.');
  });

  it('dispatches game actions through the bridge boundary', () => {
    const dispatch = vi.fn();

    dispatchThroughBridge({ dispatch }, { type: 'selectTile', x: 3, y: 4 });

    expect(dispatch).toHaveBeenCalledWith({ type: 'selectTile', x: 3, y: 4 });
  });
});

function makeBridge(): PhaserSceneBridge {
  const game = { current: createGame(gameConfig) };
  return {
    game,
    dispatch: vi.fn(),
    getSnapshot: () => createSnapshot(game.current),
    getSave: () => defaultSaveState,
    getSpeed: () => 1,
    setSpeed: vi.fn(),
    resetSave: vi.fn(),
  };
}
