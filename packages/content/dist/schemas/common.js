import { z } from 'zod';
export const contentIdSchema = z.string().min(1);
export const gridCoordSchema = z.object({
    gx: z.number().int().nonnegative(),
    gy: z.number().int().nonnegative(),
});
export const gridRectSchema = z.object({
    gx: z.number().int().nonnegative(),
    gy: z.number().int().nonnegative(),
    w: z.number().int().positive(),
    h: z.number().int().positive(),
});
export const gemTypeSchema = z.enum([
    'amethyst',
    'aquamarine',
    'diamond',
    'emerald',
    'opal',
    'ruby',
    'sapphire',
    'topaz',
]);
export const qualityTierSchema = z.enum([
    'chipped',
    'flawed',
    'normal',
    'flawless',
    'perfect',
    'great',
]);
export const v1QualityTierSchema = z.enum(['chipped', 'flawed', 'normal']);
export const attackTypeSchema = z.enum(['normal', 'pierce', 'siege', 'magic', 'chaos', 'pure']);
export const armorTypeSchema = z.enum([
    'unarmored',
    'light',
    'medium',
    'heavy',
    'fortified',
    'hero',
]);
