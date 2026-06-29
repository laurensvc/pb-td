import boardJson from '../data/boards/default-28x20.json';
import combinationsJson from '../data/combinations.json';
import gemsJson from '../data/gems/slice.json';
import wavesSliceJson from '../data/waves/slice-6.json';
import {
  boardLayoutSchema,
  combinationRecipeSchema,
  gemDefinitionSchema,
  waveScheduleSchema,
  type BoardLayout,
  type CombinationRecipe,
  type GemDefinition,
  type WaveSchedule,
} from './schemas';

export const defaultBoard: BoardLayout = boardLayoutSchema.parse(boardJson);
export const sliceGems: GemDefinition[] = gemsJson.map((g) => gemDefinitionSchema.parse(g));
export const sliceWaves: WaveSchedule = waveScheduleSchema.parse(wavesSliceJson);
export const combinations: CombinationRecipe[] = combinationsJson.map((c) =>
  combinationRecipeSchema.parse(c),
);

export const gemsById = new Map(sliceGems.map((g) => [g.id, g]));

export function getGemId(family: string, tier: number): string {
  return `${family}-t${tier}`;
}

export { validateContentPack } from './validate';
export type {
  GemFamily,
  GemTier,
  GemDefinition,
  BoardLayout,
  WaveSchedule,
  CombinationRecipe,
} from './schemas';
export {
  gemFamilySchema,
  gemTierSchema,
  gemDefinitionSchema,
  boardLayoutSchema,
  waveScheduleSchema,
  combinationRecipeSchema,
} from './schemas';
