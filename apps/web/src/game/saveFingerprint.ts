import type { SaveState } from './types';

/** Compact fingerprint for detecting persistent save changes. */
export function saveFingerprint(save: SaveState): string {
  return [
    save.clearedAreaTiers.join(','),
    save.unlockedGemFamilies.join(','),
  ].join('|');
}
