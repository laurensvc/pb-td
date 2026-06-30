import { areaDefinitions, areaTierKey } from './content';
const SAVE_KEY = 'gem-td-save-v1';
export const defaultSaveState = {
    version: 1,
    unlockedGemFamilies: ['kinetic', 'verdant', 'arcane', 'nova', 'prism', 'ember'],
    clearedAreaTiers: [],
};
export function createDefaultSave() {
    return cloneSave(defaultSaveState);
}
export function loadSave(storage = getStorage()) {
    if (!storage)
        return createDefaultSave();
    const raw = storage.getItem(SAVE_KEY);
    if (!raw)
        return createDefaultSave();
    try {
        return normalizeSave(JSON.parse(raw));
    }
    catch {
        return createDefaultSave();
    }
}
export function persistSave(save, storage = getStorage()) {
    if (!storage)
        return;
    storage.setItem(SAVE_KEY, JSON.stringify(cloneSave(save)));
}
export function cloneSave(save) {
    return {
        ...save,
        unlockedGemFamilies: [...save.unlockedGemFamilies],
        clearedAreaTiers: [...save.clearedAreaTiers],
    };
}
export function normalizeSave(partial) {
    const legacyTowers = partial.unlockedTowerIds;
    const legacyLoadout = partial.selectedLoadout;
    const unlocked = uniqueFamilies(partial.unlockedGemFamilies ??
        legacyTowers ??
        legacyLoadout ??
        defaultSaveState.unlockedGemFamilies);
    return {
        version: 1,
        unlockedGemFamilies: unlocked.length > 0 ? unlocked : [...defaultSaveState.unlockedGemFamilies],
        clearedAreaTiers: uniqueStrings(partial.clearedAreaTiers ?? []).filter((key) => areaDefinitions.some((area) => Object.keys(area.tiers).some((tierId) => areaTierKey(area.id, tierId) === key))),
    };
}
function uniqueStrings(values) {
    return Array.from(new Set(values));
}
function uniqueFamilies(values) {
    const mapped = values.map((v) => (v === 'nature' ? 'verdant' : v));
    return Array.from(new Set(mapped));
}
function getStorage() {
    if (typeof globalThis !== 'object' || !('localStorage' in globalThis)) {
        return undefined;
    }
    return globalThis.localStorage;
}
