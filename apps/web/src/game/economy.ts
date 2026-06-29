/** GemTD-style run economy helpers. */

export const INTEREST_RATE = 0.02;
export const INTEREST_STEP = 10;
export const QUEST_REROLL_COST = 25;

export function waveIncome(waveNumber: number): number {
  return 10 + Math.floor(waveNumber * 2.5);
}

export function goldInterest(bankedGold: number): number {
  if (bankedGold < INTEREST_STEP) return 0;
  const steps = Math.floor(bankedGold / INTEREST_STEP);
  return Math.floor(steps * INTEREST_STEP * INTEREST_RATE);
}
