import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { defaultSaveState } from '../game/engine';
import type { SaveState } from '../game/types';

interface SaveStore {
  save: SaveState;
  setSave: (save: SaveState) => void;
  resetSave: () => void;
}

function mergePersistedSave(value: Partial<SaveState> | undefined): SaveState {
  const v = value ?? {};
  const { shells: _legacyShells, ...rest } = v as Partial<SaveState> & { shells?: number };
  void _legacyShells;
  return {
    ...defaultSaveState,
    ...rest,
    version: 2,
    bestWave: rest.bestWave ?? defaultSaveState.bestWave,
    wins: rest.wins ?? defaultSaveState.wins,
    discoveredRecipes: rest.discoveredRecipes ?? defaultSaveState.discoveredRecipes,
    unlockedSecrets: rest.unlockedSecrets ?? defaultSaveState.unlockedSecrets,
    skillInventory: rest.skillInventory ?? defaultSaveState.skillInventory,
    quests: rest.quests ?? defaultSaveState.quests,
    rank: rest.rank ?? defaultSaveState.rank,
    settings: {
      ...defaultSaveState.settings,
      ...rest.settings,
    },
  };
}

export const useSaveStore = create<SaveStore>()(
  persist(
    (set) => ({
      save: defaultSaveState,
      setSave: (save) => set({ save }),
      resetSave: () => set({ save: defaultSaveState }),
    }),
    {
      name: 'prism-bastion-save-v1',
      /** Bump when migrate must normalize stored `save` (e.g. repair partial/corrupt shapes). */
      version: 3,
      /** Persist only `save`; migrate receives that object wrapped as `{ state: { save } }` → here `persisted` is `{ save?: … }`. */
      partialize: (state) => ({ save: state.save }),
      migrate: (persisted) => {
        const root = (persisted ?? {}) as { save?: Partial<SaveState> };
        return { save: mergePersistedSave(root.save) };
      },
    },
  ),
);
