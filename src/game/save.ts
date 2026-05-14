import { LOADOUT_LIMIT, areaDefinitions, areaTierKey, upgrades } from './content';
import type { SaveState, TowerId } from './types';

const SAVE_KEY = 'cosmic-siege-save-v1';

export const defaultSaveState: SaveState = {
  version: 1,
  stars: 0,
  crowns: 0,
  spentStars: 0,
  totalStarsEarned: 0,
  unlockedTowerIds: ['kinetic'],
  purchasedUpgradeIds: [],
  clearedAreaTiers: [],
  selectedLoadout: ['kinetic'],
};

export function createDefaultSave(): SaveState {
  return cloneSave(defaultSaveState);
}

export function loadSave(storage: Storage | undefined = getStorage()): SaveState {
  if (!storage) return createDefaultSave();
  const raw = storage.getItem(SAVE_KEY);
  if (!raw) return createDefaultSave();
  try {
    return normalizeSave(JSON.parse(raw) as Partial<SaveState>);
  } catch {
    return createDefaultSave();
  }
}

export function persistSave(save: SaveState, storage: Storage | undefined = getStorage()): void {
  if (!storage) return;
  storage.setItem(SAVE_KEY, JSON.stringify(normalizeSave(save)));
}

export function cloneSave(save: SaveState): SaveState {
  return {
    ...save,
    unlockedTowerIds: [...save.unlockedTowerIds],
    purchasedUpgradeIds: [...save.purchasedUpgradeIds],
    clearedAreaTiers: [...save.clearedAreaTiers],
    selectedLoadout: [...save.selectedLoadout],
  };
}

export function normalizeSave(partial: Partial<SaveState>): SaveState {
  const unlocked = uniqueTowers(partial.unlockedTowerIds ?? defaultSaveState.unlockedTowerIds);
  const loadout = uniqueTowers(partial.selectedLoadout ?? defaultSaveState.selectedLoadout)
    .filter((towerId) => unlocked.includes(towerId))
    .slice(0, LOADOUT_LIMIT);
  return {
    version: 1,
    stars: Math.max(0, Math.floor(partial.stars ?? 0)),
    crowns: Math.max(0, Math.floor(partial.crowns ?? 0)),
    spentStars: Math.max(0, Math.floor(partial.spentStars ?? 0)),
    totalStarsEarned: Math.max(0, Math.floor(partial.totalStarsEarned ?? 0)),
    unlockedTowerIds: unlocked.length > 0 ? unlocked : ['kinetic'],
    purchasedUpgradeIds: uniqueStrings(partial.purchasedUpgradeIds ?? []).filter((upgradeId) =>
      upgrades.some((upgrade) => upgrade.id === upgradeId),
    ),
    clearedAreaTiers: uniqueStrings(partial.clearedAreaTiers ?? []).filter((key) =>
      areaDefinitions.some((area) =>
        (Object.keys(area.tiers) as string[]).some((tierId) => areaTierKey(area.id, tierId as never) === key),
      ),
    ),
    selectedLoadout: loadout.length > 0 ? loadout : ['kinetic'],
  };
}

export function getRespecCost(save: SaveState): number {
  if (save.spentStars <= 0) return 0;
  return Math.max(25, Math.ceil(save.spentStars * 0.1));
}

function uniqueStrings(values: readonly string[]): string[] {
  return Array.from(new Set(values));
}

function uniqueTowers(values: readonly TowerId[]): TowerId[] {
  return Array.from(new Set(values));
}

function getStorage(): Storage | undefined {
  return typeof window === 'undefined' ? undefined : window.localStorage;
}
