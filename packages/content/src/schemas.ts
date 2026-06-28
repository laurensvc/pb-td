import { z } from 'zod';

export const gemFamilySchema = z.enum([
  'flame',
  'tide',
  'gale',
  'stone',
  'thorn',
  'radiant',
  'umbral',
  'arcane',
]);

export const gemTierSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

export const gemDefinitionSchema = z.object({
  id: z.string(),
  family: gemFamilySchema,
  tier: gemTierSchema,
  displayName: z.string(),
  damage: z.number().int().nonnegative(),
  attacksPerSecond: z.number().positive(),
  rangeTiles: z.number().positive(),
  targeting: z.array(z.string()),
  damageTags: z.array(z.string()),
  effects: z.array(z.string()).default([]),
  mergeResultId: z.string().optional(),
});

export const boardLayoutSchema = z.object({
  id: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  spawn: z.object({ x: z.number().int().nonnegative(), y: z.number().int().nonnegative() }),
  exit: z.object({ x: z.number().int().nonnegative(), y: z.number().int().nonnegative() }),
  blocked: z.array(z.tuple([z.number().int(), z.number().int()])),
});

export const waveSegmentSchema = z.object({
  enemyId: z.string(),
  count: z.number().int().positive(),
  intervalTicks: z.number().int().nonnegative().optional(),
});

export const waveDefinitionSchema = z.object({
  wave: z.number().int().positive(),
  segments: z.array(waveSegmentSchema),
  bossId: z.string().optional(),
  preview: z.string().optional(),
});

export const waveScheduleSchema = z.object({
  id: z.string(),
  totalWaves: z.number().int().positive(),
  waves: z.array(waveDefinitionSchema),
});

export const combinationRecipeSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  familyA: gemFamilySchema,
  familyB: gemFamilySchema,
  minTier: gemTierSchema,
  goldCost: z.number().int().nonnegative(),
  dustCost: z.number().int().nonnegative().default(0),
  resultTierRule: z.enum(['lower_input']),
});

export type GemFamily = z.infer<typeof gemFamilySchema>;
export type GemTier = z.infer<typeof gemTierSchema>;
export type GemDefinition = z.infer<typeof gemDefinitionSchema>;
export type BoardLayout = z.infer<typeof boardLayoutSchema>;
export type WaveSchedule = z.infer<typeof waveScheduleSchema>;
export type CombinationRecipe = z.infer<typeof combinationRecipeSchema>;
