import { z } from 'zod';
import { contentIdSchema } from './common.js';
export const recipeInputSchema = z.discriminatedUnion('kind', [
    z.object({
        kind: z.literal('gem'),
        gemId: contentIdSchema,
    }),
    z.object({
        kind: z.literal('tower'),
        towerId: contentIdSchema,
    }),
]);
export const recipeDefinitionSchema = z.object({
    id: contentIdSchema,
    displayName: z.string().min(1),
    tier: z.enum(['basic', 'intermediate', 'advanced', 'top', 'secret']),
    inputs: z.array(recipeInputSchema).length(3),
    outputTowerId: contentIdSchema,
    instantCombineInSingleRound: z.boolean(),
});
