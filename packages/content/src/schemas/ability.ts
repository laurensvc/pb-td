import { z } from 'zod'
import { contentIdSchema } from './common.js'

export const abilityDefinitionSchema = z.object({
  id: contentIdSchema,
  displayName: z.string().min(1),
  description: z.string().min(1),
  icon: z.string().min(1),
  params: z.record(z.string(), z.union([z.number(), z.boolean(), z.string()])),
  tags: z.array(z.enum(['defensive', 'offensive', 'movement'])),
})

export type AbilityDefinition = z.infer<typeof abilityDefinitionSchema>
