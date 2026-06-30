/** GemTD-style run economy helpers. */

export const INTEREST_RATE = 0.02;
export const INTEREST_STEP = 10;
export const MAX_INTEREST_GOLD = 50;
export const QUEST_REROLL_COST = 25;
export const CRYSTAL_DUST_PER_WAVE = 1;

export function waveIncome(waveNumber: number): number {
  return 10 + Math.floor(waveNumber * 2.5);
}

/** Classic GemTD-style interest: 2% per 10g banked, capped. */
export function goldInterest(bankedGold: number): number {
  if (bankedGold < INTEREST_STEP) return 0;
  const steps = Math.floor(bankedGold / INTEREST_STEP);
  const raw = Math.floor(steps * INTEREST_STEP * INTEREST_RATE);
  return Math.min(raw, MAX_INTEREST_GOLD);
}
