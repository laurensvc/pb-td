import { create } from 'zustand';
import { createGame, createSnapshot } from '../game/engine';
import { gameConfig } from '../game/config';
import type { GameSnapshot } from '../game/types';

interface UiStore {
  snapshot: GameSnapshot;
  speed: number;
  setSnapshot: (snapshot: GameSnapshot) => void;
  setSpeed: (speed: number) => void;
}

const placeholder = createSnapshot(createGame(gameConfig));

export const useUiStore = create<UiStore>((set) => ({
  snapshot: placeholder,
  speed: 1,
  setSnapshot: (snapshot) => set({ snapshot }),
  setSpeed: (speed) => set({ speed }),
}));
