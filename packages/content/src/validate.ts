import {
  boardLayoutSchema,
  combinationRecipeSchema,
  gemDefinitionSchema,
  waveScheduleSchema,
} from './schemas';

export function validateContentPack(data: {
  gems: unknown[];
  board: unknown;
  waves: unknown;
  combinations: unknown[];
}): { ok: true } | { ok: false; errors: string[] } {
  const errors: string[] = [];

  for (const gem of data.gems) {
    const r = gemDefinitionSchema.safeParse(gem);
    if (!r.success) errors.push(`gem: ${r.error.message}`);
  }

  const board = boardLayoutSchema.safeParse(data.board);
  if (!board.success) errors.push(`board: ${board.error.message}`);

  const waves = waveScheduleSchema.safeParse(data.waves);
  if (!waves.success) errors.push(`waves: ${waves.error.message}`);

  for (const combo of data.combinations) {
    const r = combinationRecipeSchema.safeParse(combo);
    if (!r.success) errors.push(`combination: ${r.error.message}`);
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}
