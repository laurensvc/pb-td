import { create } from 'zustand';
import { createSnapshot } from '../game/engine';
import { gameConfig } from '../game/config';
import type { GameSnapshot, GameState } from '../game/types';

interface UiStore {
  snapshot: GameSnapshot;
  speed: number;
  setSnapshot: (snapshot: GameSnapshot) => void;
  setSpeed: (speed: number) => void;
}

const placeholder = createSnapshot({
  config: gameConfig,
  status: 'ready',
  time: 0,
  rngSeed: 1,
  gold: gameConfig.economy.startingGold,
  lives: gameConfig.economy.startingLives,
  score: 0,
  waveIndex: 0,
  activeWaveId: null,
  enemiesToSpawn: 0,
  spawnTimer: 0,
  draft: [],
  draftQueue: [],
  draftWaveIndex: null,
  pendingGemId: null,
  stones: [],
  selectedTile: null,
  hoverTile: null,
  towers: [],
  enemies: [],
  projectiles: [],
  floatingTexts: [],
  occupied: new Int16Array(gameConfig.map.width * gameConfig.map.height),
  path: [],
  nextTowerId: 1,
  nextDraftId: 1,
  nextEnemyId: 1,
  nextProjectileId: 1,
  discoveredRecipes: new Set(),
  unlockedFamilies: new Set(['ruby', 'sapphire', 'topaz']),
} satisfies GameState);

export const useUiStore = create<UiStore>((set) => ({
  snapshot: placeholder,
  speed: 1,
  setSnapshot: (snapshot) => set({ snapshot }),
  setSpeed: (speed) => set({ speed }),
}));
