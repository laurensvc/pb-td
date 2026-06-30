import type { GameState, SaveState, TierId } from './types';
export interface CreateGameOptions {
    runSeed?: number;
}
export declare function createGame(save?: SaveState, options?: CreateGameOptions): GameState;
export declare function replaceState(target: GameState, source: GameState): void;
export declare function beginBuildPhase(state: GameState): void;
export declare function createAttempt(save: SaveState, areaId: string, tierId: TierId, runSeed?: number): GameState;
