import { z } from 'zod';
export declare const enemyArchetypeSchema: z.ZodEnum<["fast", "standard", "armored", "resistant", "flying", "boss", "splitter"]>;
export declare const splitBehaviorSchema: z.ZodObject<{
    childEnemyId: z.ZodString;
    childCount: z.ZodNumber;
    childHpFraction: z.ZodNumber;
    childSpeedMultiplier: z.ZodNumber;
    spawnSpread: z.ZodNumber;
    maxSplitDepth: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    childEnemyId: string;
    childCount: number;
    childHpFraction: number;
    childSpeedMultiplier: number;
    spawnSpread: number;
    maxSplitDepth: number;
}, {
    childEnemyId: string;
    childCount: number;
    childHpFraction: number;
    childSpeedMultiplier: number;
    spawnSpread: number;
    maxSplitDepth: number;
}>;
export declare const enemyDefinitionSchema: z.ZodObject<{
    id: z.ZodString;
    displayName: z.ZodString;
    archetype: z.ZodEnum<["fast", "standard", "armored", "resistant", "flying", "boss", "splitter"]>;
    mobility: z.ZodEnum<["ground", "flying"]>;
    stats: z.ZodObject<{
        baseHp: z.ZodNumber;
        baseSpeed: z.ZodNumber;
        armorType: z.ZodEnum<["unarmored", "light", "medium", "heavy", "fortified", "hero"]>;
        baseArmor: z.ZodNumber;
        magicResist: z.ZodNumber;
        goldReward: z.ZodNumber;
        lifeCost: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        baseHp: number;
        baseSpeed: number;
        armorType: "unarmored" | "light" | "medium" | "heavy" | "fortified" | "hero";
        baseArmor: number;
        magicResist: number;
        goldReward: number;
        lifeCost: number;
    }, {
        baseHp: number;
        baseSpeed: number;
        armorType: "unarmored" | "light" | "medium" | "heavy" | "fortified" | "hero";
        baseArmor: number;
        magicResist: number;
        goldReward: number;
        lifeCost: number;
    }>;
    resistances: z.ZodOptional<z.ZodObject<{
        poison: z.ZodOptional<z.ZodNumber>;
        slow: z.ZodOptional<z.ZodNumber>;
        stun: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        slow?: number | undefined;
        poison?: number | undefined;
        stun?: number | undefined;
    }, {
        slow?: number | undefined;
        poison?: number | undefined;
        stun?: number | undefined;
    }>>;
    flags: z.ZodOptional<z.ZodObject<{
        slowImmune: z.ZodOptional<z.ZodBoolean>;
        magicImmune: z.ZodOptional<z.ZodBoolean>;
        physicalImmune: z.ZodOptional<z.ZodBoolean>;
        rootImmune: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        slowImmune?: boolean | undefined;
        magicImmune?: boolean | undefined;
        physicalImmune?: boolean | undefined;
        rootImmune?: boolean | undefined;
    }, {
        slowImmune?: boolean | undefined;
        magicImmune?: boolean | undefined;
        physicalImmune?: boolean | undefined;
        rootImmune?: boolean | undefined;
    }>>;
    behaviors: z.ZodOptional<z.ZodObject<{
        split: z.ZodOptional<z.ZodObject<{
            childEnemyId: z.ZodString;
            childCount: z.ZodNumber;
            childHpFraction: z.ZodNumber;
            childSpeedMultiplier: z.ZodNumber;
            spawnSpread: z.ZodNumber;
            maxSplitDepth: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            childEnemyId: string;
            childCount: number;
            childHpFraction: number;
            childSpeedMultiplier: number;
            spawnSpread: number;
            maxSplitDepth: number;
        }, {
            childEnemyId: string;
            childCount: number;
            childHpFraction: number;
            childSpeedMultiplier: number;
            spawnSpread: number;
            maxSplitDepth: number;
        }>>;
        onSpawn: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        split?: {
            childEnemyId: string;
            childCount: number;
            childHpFraction: number;
            childSpeedMultiplier: number;
            spawnSpread: number;
            maxSplitDepth: number;
        } | undefined;
        onSpawn?: string[] | undefined;
    }, {
        split?: {
            childEnemyId: string;
            childCount: number;
            childHpFraction: number;
            childSpeedMultiplier: number;
            spawnSpread: number;
            maxSplitDepth: number;
        } | undefined;
        onSpawn?: string[] | undefined;
    }>>;
    visuals: z.ZodObject<{
        renderScale: z.ZodNumber;
        collisionRadius: z.ZodNumber;
        animations: z.ZodRecord<z.ZodString, z.ZodString>;
        shadowKey: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        renderScale: number;
        collisionRadius: number;
        animations: Record<string, string>;
        shadowKey?: string | undefined;
    }, {
        renderScale: number;
        collisionRadius: number;
        animations: Record<string, string>;
        shadowKey?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    displayName: string;
    archetype: "fast" | "standard" | "armored" | "resistant" | "flying" | "boss" | "splitter";
    mobility: "flying" | "ground";
    stats: {
        baseHp: number;
        baseSpeed: number;
        armorType: "unarmored" | "light" | "medium" | "heavy" | "fortified" | "hero";
        baseArmor: number;
        magicResist: number;
        goldReward: number;
        lifeCost: number;
    };
    visuals: {
        renderScale: number;
        collisionRadius: number;
        animations: Record<string, string>;
        shadowKey?: string | undefined;
    };
    resistances?: {
        slow?: number | undefined;
        poison?: number | undefined;
        stun?: number | undefined;
    } | undefined;
    flags?: {
        slowImmune?: boolean | undefined;
        magicImmune?: boolean | undefined;
        physicalImmune?: boolean | undefined;
        rootImmune?: boolean | undefined;
    } | undefined;
    behaviors?: {
        split?: {
            childEnemyId: string;
            childCount: number;
            childHpFraction: number;
            childSpeedMultiplier: number;
            spawnSpread: number;
            maxSplitDepth: number;
        } | undefined;
        onSpawn?: string[] | undefined;
    } | undefined;
}, {
    id: string;
    displayName: string;
    archetype: "fast" | "standard" | "armored" | "resistant" | "flying" | "boss" | "splitter";
    mobility: "flying" | "ground";
    stats: {
        baseHp: number;
        baseSpeed: number;
        armorType: "unarmored" | "light" | "medium" | "heavy" | "fortified" | "hero";
        baseArmor: number;
        magicResist: number;
        goldReward: number;
        lifeCost: number;
    };
    visuals: {
        renderScale: number;
        collisionRadius: number;
        animations: Record<string, string>;
        shadowKey?: string | undefined;
    };
    resistances?: {
        slow?: number | undefined;
        poison?: number | undefined;
        stun?: number | undefined;
    } | undefined;
    flags?: {
        slowImmune?: boolean | undefined;
        magicImmune?: boolean | undefined;
        physicalImmune?: boolean | undefined;
        rootImmune?: boolean | undefined;
    } | undefined;
    behaviors?: {
        split?: {
            childEnemyId: string;
            childCount: number;
            childHpFraction: number;
            childSpeedMultiplier: number;
            spawnSpread: number;
            maxSplitDepth: number;
        } | undefined;
        onSpawn?: string[] | undefined;
    } | undefined;
}>;
export type EnemyDefinition = z.infer<typeof enemyDefinitionSchema>;
//# sourceMappingURL=enemy.d.ts.map