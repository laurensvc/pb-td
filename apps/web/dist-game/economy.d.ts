/** GemTD-style run economy helpers. */
export declare const INTEREST_RATE = 0.02;
export declare const INTEREST_STEP = 10;
export declare const MAX_INTEREST_GOLD = 50;
export declare const QUEST_REROLL_COST = 25;
export declare const CRYSTAL_DUST_PER_WAVE = 1;
export declare function waveIncome(waveNumber: number): number;
/** Classic GemTD-style interest: 2% per 10g banked, capped. */
export declare function goldInterest(bankedGold: number): number;
