/** Compact fingerprint for detecting persistent save changes. */
export function saveFingerprint(save) {
    return [
        save.clearedAreaTiers.join(','),
        save.unlockedGemFamilies.join(','),
    ].join('|');
}
