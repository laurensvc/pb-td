import { z } from 'zod';
export declare const armorDamageMatrixSchema: z.ZodObject<{
    multipliers: z.ZodRecord<z.ZodEnum<["normal", "pierce", "siege", "magic", "chaos", "pure"]>, z.ZodRecord<z.ZodEnum<["unarmored", "light", "medium", "heavy", "fortified", "hero"]>, z.ZodNumber>>;
    armorValue: z.ZodObject<{
        positiveFactor: z.ZodLiteral<0.06>;
        negativeBase: z.ZodLiteral<2>;
        negativeFactor: z.ZodLiteral<0.94>;
        minPositiveMultiplier: z.ZodLiteral<0.06>;
        minArmorFloor: z.ZodLiteral<-50>;
    }, "strip", z.ZodTypeAny, {
        positiveFactor: 0.06;
        negativeBase: 2;
        negativeFactor: 0.94;
        minPositiveMultiplier: 0.06;
        minArmorFloor: -50;
    }, {
        positiveFactor: 0.06;
        negativeBase: 2;
        negativeFactor: 0.94;
        minPositiveMultiplier: 0.06;
        minArmorFloor: -50;
    }>;
    magicResist: z.ZodObject<{
        min: z.ZodLiteral<0>;
        max: z.ZodLiteral<100>;
    }, "strip", z.ZodTypeAny, {
        min: 0;
        max: 100;
    }, {
        min: 0;
        max: 100;
    }>;
    bypassAttackTypes: z.ZodArray<z.ZodEnum<["normal", "pierce", "siege", "magic", "chaos", "pure"]>, "many">;
}, "strip", z.ZodTypeAny, {
    magicResist: {
        min: 0;
        max: 100;
    };
    multipliers: Partial<Record<"normal" | "pierce" | "siege" | "magic" | "chaos" | "pure", Partial<Record<"unarmored" | "light" | "medium" | "heavy" | "fortified" | "hero", number>>>>;
    armorValue: {
        positiveFactor: 0.06;
        negativeBase: 2;
        negativeFactor: 0.94;
        minPositiveMultiplier: 0.06;
        minArmorFloor: -50;
    };
    bypassAttackTypes: ("normal" | "pierce" | "siege" | "magic" | "chaos" | "pure")[];
}, {
    magicResist: {
        min: 0;
        max: 100;
    };
    multipliers: Partial<Record<"normal" | "pierce" | "siege" | "magic" | "chaos" | "pure", Partial<Record<"unarmored" | "light" | "medium" | "heavy" | "fortified" | "hero", number>>>>;
    armorValue: {
        positiveFactor: 0.06;
        negativeBase: 2;
        negativeFactor: 0.94;
        minPositiveMultiplier: 0.06;
        minArmorFloor: -50;
    };
    bypassAttackTypes: ("normal" | "pierce" | "siege" | "magic" | "chaos" | "pure")[];
}>;
export type ArmorDamageMatrix = z.infer<typeof armorDamageMatrixSchema>;
//# sourceMappingURL=armor-damage-matrix.d.ts.map