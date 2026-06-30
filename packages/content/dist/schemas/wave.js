import { z } from 'zod';
import { contentIdSchema } from './common.js';
export const waveEntrySchema = z.object({
    enemyId: contentIdSchema,
    count: z.number().int().positive(),
    hpMultiplier: z.number().positive().optional(),
    speedMultiplier: z.number().positive().optional(),
});
export const waveSpawnConfigSchema = z.object({
    entries: z.array(waveEntrySchema).min(1),
    spawnIntervalMs: z.number().int().nonnegative(),
    groupDelayMs: z.number().int().nonnegative(),
    concurrent: z.boolean(),
});
export const waveDefinitionSchema = z.object({
    waveNumber: z.number().int().positive(),
    displayName: z.string().min(1),
    announcement: z.string().min(1),
    spawn: waveSpawnConfigSchema,
    defaultEnemyId: contentIdSchema,
    abilities: z.array(contentIdSchema),
    modifiers: z
        .object({
        hpMultiplier: z.number().positive().optional(),
        speedMultiplier: z.number().positive().optional(),
        armorBonus: z.number().optional(),
    })
        .optional(),
    isBoss: z.boolean(),
    isFlying: z.boolean(),
    clearCount: z.number().int().positive(),
    rewardGold: z.number().int().nonnegative(),
    threatLevel: z.union([
        z.literal(1),
        z.literal(2),
        z.literal(3),
        z.literal(4),
        z.literal(5),
    ]),
});
