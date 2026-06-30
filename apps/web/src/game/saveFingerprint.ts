import type { SaveState } from './types';

/** Compact fingerprint for detecting persistent save changes. */
export function saveFingerprint(save: SaveState): string {
  return [
    save.stars,
    save.crowns,
    save.spentStars,
    save.totalStarsEarned,
    save.purchasedUpgradeIds.join(','),
    save.clearedAreaTiers.join(','),
    save.unlockedGemFamilies.join(','),
  ].join('|');
}
