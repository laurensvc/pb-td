import type { SaveState } from './types';
/** Compact fingerprint for detecting persistent save changes. */
export declare function saveFingerprint(save: SaveState): string;
