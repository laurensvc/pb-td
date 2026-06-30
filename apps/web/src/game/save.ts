import { areaDefinitions, areaTierKey } from './content';
import type { GemFamilyId, SaveState } from './types';

const SAVE_KEY = 'gem-td-save-v1';

export const defaultSaveState: SaveState = {
  version: 1,
  unlockedGemFamilies: ['kinetic', 'verdant', 'arcane', 'nova', 'prism', 'ember'],
  clearedAreaTiers: [],
};

export function createDefaultSave(): SaveState {
  return cloneSave(defaultSaveState);
}

export function loadSave(storage: Storage | undefined = getStorage()): SaveState {
  if (!storage) return createDefaultSave();
  const raw = storage.getItem(SAVE_KEY);
  if (!raw) return createDefaultSave();
  try {
    return normalizeSave(JSON.parse(raw) as Partial<SaveState> & Record<string, unknown>);
  } catch {
    return createDefaultSave();
  }
}

export function persistSave(save: SaveState, storage: Storage | undefined = getStorage()): void {
  if (!storage) return;
  storage.setItem(SAVE_KEY, JSON.stringify(cloneSave(save)));
}

export function cloneSave(save: SaveState): SaveState {
  return {
    ...save,
    unlockedGemFamilies: [...save.unlockedGemFamilies],
    clearedAreaTiers: [...save.clearedAreaTiers],
  };
}

export function normalizeSave(partial: Partial<SaveState> & Record<string, unknown>): SaveState {
  const legacyTowers = partial.unlockedTowerIds as GemFamilyId[] | undefined;
  const legacyLoadout = partial.selectedLoadout as GemFamilyId[] | undefined;
  const unlocked = uniqueFamilies(
    partial.unlockedGemFamilies ??
      legacyTowers ??
      legacyLoadout ??
      defaultSaveState.unlockedGemFamilies,
  );

  return {
    version: 1,
    unlockedGemFamilies:
      unlocked.length > 0 ? unlocked : [...defaultSaveState.unlockedGemFamilies],
    clearedAreaTiers: uniqueStrings(partial.clearedAreaTiers ?? []).filter((key) =>
      areaDefinitions.some((area) =>
        (Object.keys(area.tiers) as string[]).some(
          (tierId) => areaTierKey(area.id, tierId as never) === key,
        ),
      ),
    ),
  };
}

function uniqueStrings(values: readonly string[]): string[] {
  return Array.from(new Set(values));
}

function uniqueFamilies(values: readonly string[]): GemFamilyId[] {
  const mapped = values.map((v) => (v === 'nature' ? 'verdant' : v)) as GemFamilyId[];
  return Array.from(new Set(mapped));
}

function getStorage(): Storage | undefined {
  return typeof window === 'undefined' ? undefined : window.localStorage;
}
