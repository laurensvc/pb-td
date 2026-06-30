import { z } from 'zod'
import { armorTypeSchema, contentIdSchema } from './common.js'

export const enemyArchetypeSchema = z.enum([
  'fast',
  'standard',
  'armored',
  'resistant',
  'flying',
  'boss',
  'splitter',
])

export const splitBehaviorSchema = z.object({
  childEnemyId: contentIdSchema,
  childCount: z.number().int().positive(),
  childHpFraction: z.number().positive().max(1),
  childSpeedMultiplier: z.number().positive(),
  spawnSpread: z.number().nonnegative(),
  maxSplitDepth: z.number().int().nonnegative(),
})

export const enemyDefinitionSchema = z.object({
  id: contentIdSchema,
  displayName: z.string().min(1),
  archetype: enemyArchetypeSchema,
  mobility: z.enum(['ground', 'flying']),
  stats: z.object({
    baseHp: z.number().positive(),
    baseSpeed: z.number().positive(),
    armorType: armorTypeSchema,
    baseArmor: z.number(),
    magicResist: z.number().min(0).max(100),
    goldReward: z.number().nonnegative(),
    lifeCost: z.number().int().positive(),
  }),
  resistances: z
    .object({
      poison: z.number().min(0).max(100).optional(),
      slow: z.number().min(0).max(100).optional(),
      stun: z.number().min(0).max(100).optional(),
    })
    .optional(),
  flags: z
    .object({
      slowImmune: z.boolean().optional(),
      magicImmune: z.boolean().optional(),
      physicalImmune: z.boolean().optional(),
      rootImmune: z.boolean().optional(),
    })
    .optional(),
  behaviors: z
    .object({
      split: splitBehaviorSchema.optional(),
      onSpawn: z.array(contentIdSchema).optional(),
    })
    .optional(),
  visuals: z.object({
    renderScale: z.number().positive(),
    collisionRadius: z.number().positive(),
    animations: z.record(z.string(), z.string().min(1)),
    shadowKey: z.string().min(1).optional(),
  }),
})

export type EnemyDefinition = z.infer<typeof enemyDefinitionSchema>
