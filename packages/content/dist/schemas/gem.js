import { z } from 'zod';
import { attackTypeSchema, contentIdSchema, gemTypeSchema, qualityTierSchema } from './common.js';
export const towerCombatStatsSchema = z.object({
    range: z.number().positive(),
    baseDamage: z.number().nonnegative(),
    attackInterval: z.number().positive(),
    projectileSpeed: z.number().positive().optional(),
    targets: z.number().int().positive().default(1),
    critChance: z.number().min(0).max(1).optional(),
    critMultiplier: z.number().positive().optional(),
    primaryAttackType: attackTypeSchema.default('normal'),
});
export const towerAbilitySchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('pierce'),
        armorReduction: z.number(),
    }),
    z.object({
        type: z.literal('corrupt'),
        armorReduction: z.number(),
    }),
    z.object({
        type: z.literal('slow'),
        speedReduction: z.number(),
        duration: z.number().positive().optional(),
    }),
    z.object({
        type: z.literal('poison'),
        dps: z.number().nonnegative(),
        duration: z.number().positive(),
    }),
    z.object({
        type: z.literal('cleave'),
        percent: z.number().min(0).max(100),
        radius: z.number().positive(),
        damageType: z.literal('pure'),
    }),
    z.object({
        type: z.literal('split_shot'),
        targets: z.number().int().positive(),
    }),
    z.object({
        type: z.literal('burn'),
        dps: z.number().nonnegative(),
        radius: z.number().positive(),
    }),
    z.object({
        type: z.literal('anti_fly'),
        armorReduction: z.number(),
        speedReduction: z.number(),
        mrReduction: z.number().optional(),
    }),
    z.object({
        type: z.literal('stun'),
        chance: z.number().min(0).max(1),
        duration: z.number().positive(),
    }),
    z.object({
        type: z.literal('chain_lightning'),
        chance: z.number().min(0).max(1),
        jumps: z.number().int().positive(),
        damage: z.number().nonnegative(),
    }),
    z.object({
        type: z.literal('aura_attack_speed'),
        bonus: z.number(),
        radius: z.number().positive(),
        stackGroup: z.string().min(1),
    }),
    z.object({
        type: z.literal('aura_range'),
        bonus: z.number(),
        radius: z.number().positive(),
    }),
    z.object({
        type: z.literal('inspire'),
        damagePercent: z.number(),
        radius: z.number().positive(),
    }),
    z.object({
        type: z.literal('monkey_king_bar'),
        radius: z.number().positive(),
    }),
    z.object({
        type: z.literal('decadent'),
        armorReduction: z.number(),
        mrReduction: z.number(),
        radius: z.number().positive(),
        ignoreMagicImmune: z.boolean().optional(),
    }),
]);
export const gemDefinitionSchema = z.object({
    id: contentIdSchema,
    type: gemTypeSchema,
    quality: qualityTierSchema,
    displayName: z.string().min(1),
    combat: towerCombatStatsSchema,
    abilities: z.array(towerAbilitySchema),
    projectileKey: z.string().min(1).optional(),
    assetKey: z.string().min(1),
    footprint: z.literal(2),
    blocksPath: z.literal(true),
});
export const towerDefinitionSchema = z.object({
    id: contentIdSchema,
    displayName: z.string().min(1),
    classification: z.enum(['basic', 'intermediate', 'advanced', 'top', 'secret']),
    combat: towerCombatStatsSchema,
    abilities: z.array(towerAbilitySchema),
    projectileKey: z.string().min(1).optional(),
    assetKey: z.string().min(1),
    recipeId: contentIdSchema.optional(),
    footprint: z.literal(2),
    blocksPath: z.literal(true).default(true),
});
