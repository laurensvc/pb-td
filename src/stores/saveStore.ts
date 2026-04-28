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
  return {
    ...defaultSaveState,
    ...v,
    version: 2,
    shells: v.shells ?? defaultSaveState.shells,
    bestWave: v.bestWave ?? defaultSaveState.bestWave,
    wins: v.wins ?? defaultSaveState.wins,
    discoveredRecipes: v.discoveredRecipes ?? defaultSaveState.discoveredRecipes,
    unlockedSecrets: v.unlockedSecrets ?? defaultSaveState.unlockedSecrets,
    skillInventory: v.skillInventory ?? defaultSaveState.skillInventory,
    quests: v.quests ?? defaultSaveState.quests,
    rank: v.rank ?? defaultSaveState.rank,
    settings: {
      ...defaultSaveState.settings,
      ...v.settings,
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
