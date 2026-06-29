import { areaDefinitions, areaTierKey, upgrades } from './content';
import type { GemFamilyId, SaveState } from './types';

const SAVE_KEY = 'cosmic-siege-save-v2';

export const defaultSaveState: SaveState = {
  version: 2,
  stars: 0,
  crowns: 0,
  spentStars: 0,
  totalStarsEarned: 0,
  unlockedGemFamilies: ['kinetic', 'verdant'],
  purchasedUpgradeIds: [],
  clearedAreaTiers: [],
};

export function createDefaultSave(): SaveState {
  return cloneSave(defaultSaveState);
}

export function loadSave(storage: Storage | undefined = getStorage()): SaveState {
  if (!storage) return createDefaultSave();
  const raw = storage.getItem(SAVE_KEY) ?? storage.getItem('cosmic-siege-save-v1');
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
    purchasedUpgradeIds: [...save.purchasedUpgradeIds],
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
    version: 2,
    stars: Math.max(0, Math.floor(partial.stars ?? 0)),
    crowns: Math.max(0, Math.floor(partial.crowns ?? 0)),
    spentStars: Math.max(0, Math.floor(partial.spentStars ?? 0)),
    totalStarsEarned: Math.max(0, Math.floor(partial.totalStarsEarned ?? 0)),
    unlockedGemFamilies: unlocked.length > 0 ? unlocked : ['kinetic', 'verdant'],
    purchasedUpgradeIds: uniqueStrings(partial.purchasedUpgradeIds ?? []).filter((upgradeId) =>
      upgrades.some((upgrade) => upgrade.id === upgradeId),
    ),
    clearedAreaTiers: uniqueStrings(partial.clearedAreaTiers ?? []).filter((key) =>
      areaDefinitions.some((area) =>
        (Object.keys(area.tiers) as string[]).some(
          (tierId) => areaTierKey(area.id, tierId as never) === key,
        ),
      ),
    ),
  };
}

export function getRespecCost(save: SaveState): number {
  if (save.spentStars <= 0) return 0;
  return Math.max(25, Math.ceil(save.spentStars * 0.1));
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
