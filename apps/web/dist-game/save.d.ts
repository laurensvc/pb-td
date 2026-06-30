import type { SaveState } from './types';
export declare const defaultSaveState: SaveState;
export declare function createDefaultSave(): SaveState;
export declare function loadSave(storage?: Storage | undefined): SaveState;
export declare function persistSave(save: SaveState, storage?: Storage | undefined): void;
export declare function cloneSave(save: SaveState): SaveState;
export declare function normalizeSave(partial: Partial<SaveState> & Record<string, unknown>): SaveState;
