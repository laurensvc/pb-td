import type {
  BaseGemFamilyId,
  BuildStep,
  GemFamilyId,
  GemLevel,
  GemOffer,
  RawGemQualityOdds,
  TargetingMode,
} from './types';
import { BASE_GEM_FAMILIES } from './content';
import { mulberry32 } from './rng';

export type { BuildStep, GemOffer, RawGemQualityOdds };
export const ROCKS_PER_PHASE = 5;

const RAW_QUALITY_ODDS_BY_BUILD_LEVEL: Record<number, RawGemQualityOdds[]> = {
  1: [
    { level: 1, chance: 70 },
    { level: 2, chance: 25 },
    { level: 3, chance: 5 },
    { level: 4, chance: 0 },
    { level: 5, chance: 0 },
  ],
  2: [
    { level: 1, chance: 50 },
    { level: 2, chance: 32 },
    { level: 3, chance: 15 },
    { level: 4, chance: 3 },
    { level: 5, chance: 0 },
  ],
  3: [
    { level: 1, chance: 35 },
    { level: 2, chance: 35 },
    { level: 3, chance: 22 },
    { level: 4, chance: 7 },
    { level: 5, chance: 1 },
  ],
  4: [
    { level: 1, chance: 22 },
    { level: 2, chance: 33 },
    { level: 3, chance: 30 },
    { level: 4, chance: 12 },
    { level: 5, chance: 3 },
  ],
  5: [
    { level: 1, chance: 12 },
    { level: 2, chance: 25 },
    { level: 3, chance: 35 },
    { level: 4, chance: 20 },
    { level: 5, chance: 8 },
  ],
};

export function prospectRerollCost(rerollsThisPhase: number): number {
  const costs = [10, 20, 40, 80, 160];
  if (rerollsThisPhase < costs.length) return costs[rerollsThisPhase]!;
  return costs[costs.length - 1]! * 2 ** (rerollsThisPhase - costs.length + 1);
}

export function rawGemBuildLevel(waveIndex: number): number {
  return Math.min(5, Math.floor(waveIndex / 10) + 1);
}

export function rawGemQualityOdds(waveIndex: number): RawGemQualityOdds[] {
  return RAW_QUALITY_ODDS_BY_BUILD_LEVEL[rawGemBuildLevel(waveIndex)]!.map((entry) => ({
    ...entry,
  }));
}

function rollRawGemLevel(rng: () => number, waveIndex: number): GemLevel {
  const odds = rawGemQualityOdds(waveIndex);
  const total = odds.reduce((sum, entry) => sum + entry.chance, 0);
  let roll = rng() * total;
  for (const entry of odds) {
    roll -= entry.chance;
    if (roll < 0) return entry.level;
  }
  return odds[odds.length - 1]!.level;
}

export function generateOffers(
  runSeed: number,
  waveIndex: number,
  rerollsThisPhase: number,
  unlockedFamilies: readonly GemFamilyId[],
): GemOffer[] {
  const rng = mulberry32(runSeed + (waveIndex + 1) * 997 + rerollsThisPhase * 131);
  const families = BASE_GEM_FAMILIES.filter((f) => unlockedFamilies.includes(f));
  const pool = families.length > 0 ? families : (['kinetic', 'verdant'] as BaseGemFamilyId[]);
  const offers: GemOffer[] = [];
  for (let i = 0; i < 5; i++) {
    offers.push({
      family: pool[Math.floor(rng() * pool.length)]!,
      level: rollRawGemLevel(rng, waveIndex),
    });
  }
  return offers;
}

export function buildStepLabel(step: BuildStep): string {
  switch (step) {
    case 'rocks':
      return 'Place five raw gems';
    case 'prospect':
      return 'Commit one gem';
    case 'upgrade':
      return 'Commit one gem';
    case 'ready':
      return 'Ready to defend';
  }
}

export function buildRitualHint(step: BuildStep, rawGemsPlaced: number): string {
  switch (step) {
    case 'rocks':
      return rawGemsPlaced < ROCKS_PER_PHASE
        ? `Place all ${ROCKS_PER_PHASE} raw gems on the board (${rawGemsPlaced}/${ROCKS_PER_PHASE}).`
        : 'All raw gems placed. Switch to Prospect to commit one.';
    case 'prospect':
    case 'upgrade':
      return 'Commit one raw gem or build a detected recipe. The other four become stone blocks.';
    case 'ready':
      return 'Unused raw gems are now stones. Merge towers, then Start Wave.';
  }
}

export type BuildRitualPhase = 'place' | 'commit' | 'ready';

export function buildRitualPhase(step: BuildStep): BuildRitualPhase {
  if (step === 'rocks') return 'place';
  if (step === 'prospect' || step === 'upgrade') return 'commit';
  return 'ready';
}

export function isPlanningPhase(status: string): boolean {
  return status === 'idle' || status === 'betweenWaves';
}

export function defaultGemTargeting(): TargetingMode {
  return 'first';
}
