import { z } from 'zod';
import { qualityTierSchema } from './common.js';
export const gemProbabilityLevelSchema = z.object({
    level: z.number().int().positive(),
    weights: z.object({
        chipped: z.number().nonnegative(),
        flawed: z.number().nonnegative(),
        normal: z.number().nonnegative(),
        flawless: z.number().nonnegative(),
        perfect: z.number().nonnegative(),
        great: z.number().nonnegative(),
    }),
});
export const gemProbabilityTableSchema = z.object({
    levels: z.array(gemProbabilityLevelSchema).min(1),
    typeRollUniform: z.literal(true),
});
export function assertProbabilityWeightsSumTo100(level) {
    const sum = Object.values(level.weights).reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 100) > 0.001) {
        throw new Error(`Gem probability level ${level.level} weights sum to ${sum}, expected 100`);
    }
}
export const v1ProbabilityQualities = [
    'chipped',
    'flawed',
    'normal',
];
