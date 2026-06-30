import { z } from 'zod';
export declare const abilityDefinitionSchema: z.ZodObject<{
    id: z.ZodString;
    displayName: z.ZodString;
    description: z.ZodString;
    icon: z.ZodString;
    params: z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodNumber, z.ZodBoolean, z.ZodString]>>;
    tags: z.ZodArray<z.ZodEnum<["defensive", "offensive", "movement"]>, "many">;
}, "strip", z.ZodTypeAny, {
    params: Record<string, string | number | boolean>;
    id: string;
    displayName: string;
    description: string;
    icon: string;
    tags: ("defensive" | "offensive" | "movement")[];
}, {
    params: Record<string, string | number | boolean>;
    id: string;
    displayName: string;
    description: string;
    icon: string;
    tags: ("defensive" | "offensive" | "movement")[];
}>;
export type AbilityDefinition = z.infer<typeof abilityDefinitionSchema>;
//# sourceMappingURL=ability.d.ts.map