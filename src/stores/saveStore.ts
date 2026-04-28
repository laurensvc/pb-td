import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { defaultSaveState } from '../game/engine';
import type { SaveState } from '../game/types';

interface SaveStore {
  save: SaveState;
  setSave: (save: SaveState) => void;
  resetSave: () => void;
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
      version: 1,
    },
  ),
);
