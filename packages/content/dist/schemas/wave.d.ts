import { z } from 'zod';
export declare const waveEntrySchema: z.ZodObject<{
    enemyId: z.ZodString;
    count: z.ZodNumber;
    hpMultiplier: z.ZodOptional<z.ZodNumber>;
    speedMultiplier: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    enemyId: string;
    count: number;
    hpMultiplier?: number | undefined;
    speedMultiplier?: number | undefined;
}, {
    enemyId: string;
    count: number;
    hpMultiplier?: number | undefined;
    speedMultiplier?: number | undefined;
}>;
export declare const waveSpawnConfigSchema: z.ZodObject<{
    entries: z.ZodArray<z.ZodObject<{
        enemyId: z.ZodString;
        count: z.ZodNumber;
        hpMultiplier: z.ZodOptional<z.ZodNumber>;
        speedMultiplier: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        enemyId: string;
        count: number;
        hpMultiplier?: number | undefined;
        speedMultiplier?: number | undefined;
    }, {
        enemyId: string;
        count: number;
        hpMultiplier?: number | undefined;
        speedMultiplier?: number | undefined;
    }>, "many">;
    spawnIntervalMs: z.ZodNumber;
    groupDelayMs: z.ZodNumber;
    concurrent: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    entries: {
        enemyId: string;
        count: number;
        hpMultiplier?: number | undefined;
        speedMultiplier?: number | undefined;
    }[];
    spawnIntervalMs: number;
    groupDelayMs: number;
    concurrent: boolean;
}, {
    entries: {
        enemyId: string;
        count: number;
        hpMultiplier?: number | undefined;
        speedMultiplier?: number | undefined;
    }[];
    spawnIntervalMs: number;
    groupDelayMs: number;
    concurrent: boolean;
}>;
export declare const waveDefinitionSchema: z.ZodObject<{
    waveNumber: z.ZodNumber;
    displayName: z.ZodString;
    announcement: z.ZodString;
    spawn: z.ZodObject<{
        entries: z.ZodArray<z.ZodObject<{
            enemyId: z.ZodString;
            count: z.ZodNumber;
            hpMultiplier: z.ZodOptional<z.ZodNumber>;
            speedMultiplier: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            enemyId: string;
            count: number;
            hpMultiplier?: number | undefined;
            speedMultiplier?: number | undefined;
        }, {
            enemyId: string;
            count: number;
            hpMultiplier?: number | undefined;
            speedMultiplier?: number | undefined;
        }>, "many">;
        spawnIntervalMs: z.ZodNumber;
        groupDelayMs: z.ZodNumber;
        concurrent: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        entries: {
            enemyId: string;
            count: number;
            hpMultiplier?: number | undefined;
            speedMultiplier?: number | undefined;
        }[];
        spawnIntervalMs: number;
        groupDelayMs: number;
        concurrent: boolean;
    }, {
        entries: {
            enemyId: string;
            count: number;
            hpMultiplier?: number | undefined;
            speedMultiplier?: number | undefined;
        }[];
        spawnIntervalMs: number;
        groupDelayMs: number;
        concurrent: boolean;
    }>;
    defaultEnemyId: z.ZodString;
    abilities: z.ZodArray<z.ZodString, "many">;
    modifiers: z.ZodOptional<z.ZodObject<{
        hpMultiplier: z.ZodOptional<z.ZodNumber>;
        speedMultiplier: z.ZodOptional<z.ZodNumber>;
        armorBonus: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        hpMultiplier?: number | undefined;
        speedMultiplier?: number | undefined;
        armorBonus?: number | undefined;
    }, {
        hpMultiplier?: number | undefined;
        speedMultiplier?: number | undefined;
        armorBonus?: number | undefined;
    }>>;
    isBoss: z.ZodBoolean;
    isFlying: z.ZodBoolean;
    clearCount: z.ZodNumber;
    rewardGold: z.ZodNumber;
    threatLevel: z.ZodUnion<[z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>, z.ZodLiteral<4>, z.ZodLiteral<5>]>;
}, "strip", z.ZodTypeAny, {
    displayName: string;
    abilities: string[];
    waveNumber: number;
    announcement: string;
    spawn: {
        entries: {
            enemyId: string;
            count: number;
            hpMultiplier?: number | undefined;
            speedMultiplier?: number | undefined;
        }[];
        spawnIntervalMs: number;
        groupDelayMs: number;
        concurrent: boolean;
    };
    defaultEnemyId: string;
    isBoss: boolean;
    isFlying: boolean;
    clearCount: number;
    rewardGold: number;
    threatLevel: 1 | 2 | 3 | 4 | 5;
    modifiers?: {
        hpMultiplier?: number | undefined;
        speedMultiplier?: number | undefined;
        armorBonus?: number | undefined;
    } | undefined;
}, {
    displayName: string;
    abilities: string[];
    waveNumber: number;
    announcement: string;
    spawn: {
        entries: {
            enemyId: string;
            count: number;
            hpMultiplier?: number | undefined;
            speedMultiplier?: number | undefined;
        }[];
        spawnIntervalMs: number;
        groupDelayMs: number;
        concurrent: boolean;
    };
    defaultEnemyId: string;
    isBoss: boolean;
    isFlying: boolean;
    clearCount: number;
    rewardGold: number;
    threatLevel: 1 | 2 | 3 | 4 | 5;
    modifiers?: {
        hpMultiplier?: number | undefined;
        speedMultiplier?: number | undefined;
        armorBonus?: number | undefined;
    } | undefined;
}>;
export type WaveDefinition = z.infer<typeof waveDefinitionSchema>;
//# sourceMappingURL=wave.d.ts.map