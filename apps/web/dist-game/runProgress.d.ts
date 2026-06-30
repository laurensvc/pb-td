import type { FxEvent, GameState, QuestState } from './types';
export declare function pushFx(state: GameState, kind: FxEvent['kind'], x: number, y: number, text: string): void;
export declare function trackQuestProgress(state: GameState, templateId: QuestState['templateId'], amount: number): void;
export declare function tickTransientFx(state: GameState, dt: number): void;
