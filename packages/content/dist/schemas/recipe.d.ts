import { z } from 'zod';
export declare const recipeInputSchema: z.ZodDiscriminatedUnion<"kind", [z.ZodObject<{
    kind: z.ZodLiteral<"gem">;
    gemId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    kind: "gem";
    gemId: string;
}, {
    kind: "gem";
    gemId: string;
}>, z.ZodObject<{
    kind: z.ZodLiteral<"tower">;
    towerId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    kind: "tower";
    towerId: string;
}, {
    kind: "tower";
    towerId: string;
}>]>;
export declare const recipeDefinitionSchema: z.ZodObject<{
    id: z.ZodString;
    displayName: z.ZodString;
    tier: z.ZodEnum<["basic", "intermediate", "advanced", "top", "secret"]>;
    inputs: z.ZodArray<z.ZodDiscriminatedUnion<"kind", [z.ZodObject<{
        kind: z.ZodLiteral<"gem">;
        gemId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        kind: "gem";
        gemId: string;
    }, {
        kind: "gem";
        gemId: string;
    }>, z.ZodObject<{
        kind: z.ZodLiteral<"tower">;
        towerId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        kind: "tower";
        towerId: string;
    }, {
        kind: "tower";
        towerId: string;
    }>]>, "many">;
    outputTowerId: z.ZodString;
    instantCombineInSingleRound: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    id: string;
    displayName: string;
    tier: "basic" | "intermediate" | "advanced" | "top" | "secret";
    inputs: ({
        kind: "gem";
        gemId: string;
    } | {
        kind: "tower";
        towerId: string;
    })[];
    outputTowerId: string;
    instantCombineInSingleRound: boolean;
}, {
    id: string;
    displayName: string;
    tier: "basic" | "intermediate" | "advanced" | "top" | "secret";
    inputs: ({
        kind: "gem";
        gemId: string;
    } | {
        kind: "tower";
        towerId: string;
    })[];
    outputTowerId: string;
    instantCombineInSingleRound: boolean;
}>;
export type RecipeInput = z.infer<typeof recipeInputSchema>;
export type RecipeDefinition = z.infer<typeof recipeDefinitionSchema>;
//# sourceMappingURL=recipe.d.ts.map