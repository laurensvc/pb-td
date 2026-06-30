import { z } from 'zod'
import { attackTypeSchema, armorTypeSchema } from './common.js'

export const armorDamageMatrixSchema = z.object({
  multipliers: z.record(attackTypeSchema, z.record(armorTypeSchema, z.number().nonnegative())),
  armorValue: z.object({
    positiveFactor: z.literal(0.06),
    negativeBase: z.literal(2),
    negativeFactor: z.literal(0.94),
    minPositiveMultiplier: z.literal(0.06),
    minArmorFloor: z.literal(-50),
  }),
  magicResist: z.object({
    min: z.literal(0),
    max: z.literal(100),
  }),
  bypassAttackTypes: z.array(attackTypeSchema),
})

export type ArmorDamageMatrix = z.infer<typeof armorDamageMatrixSchema>
