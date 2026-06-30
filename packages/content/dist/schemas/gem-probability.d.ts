import { z } from 'zod';
import { qualityTierSchema } from './common.js';
export declare const gemProbabilityLevelSchema: z.ZodObject<{
    level: z.ZodNumber;
    weights: z.ZodObject<{
        chipped: z.ZodNumber;
        flawed: z.ZodNumber;
        normal: z.ZodNumber;
        flawless: z.ZodNumber;
        perfect: z.ZodNumber;
        great: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        chipped: number;
        flawed: number;
        normal: number;
        flawless: number;
        perfect: number;
        great: number;
    }, {
        chipped: number;
        flawed: number;
        normal: number;
        flawless: number;
        perfect: number;
        great: number;
    }>;
}, "strip", z.ZodTypeAny, {
    level: number;
    weights: {
        chipped: number;
        flawed: number;
        normal: number;
        flawless: number;
        perfect: number;
        great: number;
    };
}, {
    level: number;
    weights: {
        chipped: number;
        flawed: number;
        normal: number;
        flawless: number;
        perfect: number;
        great: number;
    };
}>;
export declare const gemProbabilityTableSchema: z.ZodObject<{
    levels: z.ZodArray<z.ZodObject<{
        level: z.ZodNumber;
        weights: z.ZodObject<{
            chipped: z.ZodNumber;
            flawed: z.ZodNumber;
            normal: z.ZodNumber;
            flawless: z.ZodNumber;
            perfect: z.ZodNumber;
            great: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            chipped: number;
            flawed: number;
            normal: number;
            flawless: number;
            perfect: number;
            great: number;
        }, {
            chipped: number;
            flawed: number;
            normal: number;
            flawless: number;
            perfect: number;
            great: number;
        }>;
    }, "strip", z.ZodTypeAny, {
        level: number;
        weights: {
            chipped: number;
            flawed: number;
            normal: number;
            flawless: number;
            perfect: number;
            great: number;
        };
    }, {
        level: number;
        weights: {
            chipped: number;
            flawed: number;
            normal: number;
            flawless: number;
            perfect: number;
            great: number;
        };
    }>, "many">;
    typeRollUniform: z.ZodLiteral<true>;
}, "strip", z.ZodTypeAny, {
    levels: {
        level: number;
        weights: {
            chipped: number;
            flawed: number;
            normal: number;
            flawless: number;
            perfect: number;
            great: number;
        };
    }[];
    typeRollUniform: true;
}, {
    levels: {
        level: number;
        weights: {
            chipped: number;
            flawed: number;
            normal: number;
            flawless: number;
            perfect: number;
            great: number;
        };
    }[];
    typeRollUniform: true;
}>;
export type GemProbabilityLevel = z.infer<typeof gemProbabilityLevelSchema>;
export type GemProbabilityTable = z.infer<typeof gemProbabilityTableSchema>;
export declare function assertProbabilityWeightsSumTo100(level: GemProbabilityLevel): void;
export declare const v1ProbabilityQualities: z.infer<typeof qualityTierSchema>[];
//# sourceMappingURL=gem-probability.d.ts.map