import { z } from 'zod';
export declare const contentIdSchema: z.ZodString;
export declare const gridCoordSchema: z.ZodObject<{
    gx: z.ZodNumber;
    gy: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    gx: number;
    gy: number;
}, {
    gx: number;
    gy: number;
}>;
export declare const gridRectSchema: z.ZodObject<{
    gx: z.ZodNumber;
    gy: z.ZodNumber;
    w: z.ZodNumber;
    h: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    gx: number;
    gy: number;
    w: number;
    h: number;
}, {
    gx: number;
    gy: number;
    w: number;
    h: number;
}>;
export type GridCoord = z.infer<typeof gridCoordSchema>;
export type GridRect = z.infer<typeof gridRectSchema>;
export declare const gemTypeSchema: z.ZodEnum<["amethyst", "aquamarine", "diamond", "emerald", "opal", "ruby", "sapphire", "topaz"]>;
export declare const qualityTierSchema: z.ZodEnum<["chipped", "flawed", "normal", "flawless", "perfect", "great"]>;
export declare const v1QualityTierSchema: z.ZodEnum<["chipped", "flawed", "normal"]>;
export declare const attackTypeSchema: z.ZodEnum<["normal", "pierce", "siege", "magic", "chaos", "pure"]>;
export declare const armorTypeSchema: z.ZodEnum<["unarmored", "light", "medium", "heavy", "fortified", "hero"]>;
export type ContentId = z.infer<typeof contentIdSchema>;
export type GemType = z.infer<typeof gemTypeSchema>;
export type QualityTier = z.infer<typeof qualityTierSchema>;
export type V1QualityTier = z.infer<typeof v1QualityTierSchema>;
export type AttackType = z.infer<typeof attackTypeSchema>;
export type ArmorType = z.infer<typeof armorTypeSchema>;
//# sourceMappingURL=common.d.ts.map