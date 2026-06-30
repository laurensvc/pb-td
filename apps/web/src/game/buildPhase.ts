import type { BaseGemFamilyId, BuildStep, GemFamilyId, GemLevel, GemOffer, TargetingMode } from './types';

export type { BuildStep, GemOffer };
export const ROCKS_PER_PHASE = 5;

const BASE_FAMILIES: BaseGemFamilyId[] = ['kinetic', 'verdant', 'arcane', 'nova', 'prism', 'ember'];

export function prospectRerollCost(rerollsThisPhase: number): number {
  const costs = [10, 20, 40, 80, 160];
  if (rerollsThisPhase < costs.length) return costs[rerollsThisPhase]!;
  return costs[costs.length - 1]! * 2 ** (rerollsThisPhase - costs.length + 1);
}

import { mulberry32 } from './rng';

export function generateOffers(
  runSeed: number,
  waveIndex: number,
  rerollsThisPhase: number,
  unlockedFamilies: readonly GemFamilyId[],
): GemOffer[] {
  const rng = mulberry32(runSeed + (waveIndex + 1) * 997 + rerollsThisPhase * 131);
  const families = BASE_FAMILIES.filter((f) => unlockedFamilies.includes(f));
  const pool = families.length > 0 ? families : (['kinetic', 'verdant'] as BaseGemFamilyId[]);
  const levels: GemLevel[] = [1, 1, 2, 2, 3];
  const offers: GemOffer[] = [];
  for (let i = 0; i < 5; i++) {
    offers.push({
      family: pool[Math.floor(rng() * pool.length)]!,
      level: levels[Math.floor(rng() * levels.length)]!,
    });
  }
  return offers;
}

export function buildStepLabel(step: BuildStep): string {
  switch (step) {
    case 'rocks':
      return 'Place rocks';
    case 'prospect':
      return 'Prospect';
    case 'upgrade':
      return 'Upgrade rock';
    case 'ready':
      return 'Ready';
  }
}

export function isPlanningPhase(status: string): boolean {
  return status === 'idle' || status === 'betweenWaves';
}

export function defaultGemTargeting(): TargetingMode {
  return 'first';
}
