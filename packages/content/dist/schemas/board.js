import { z } from 'zod';
import { contentIdSchema, gridCoordSchema, gridRectSchema } from './common.js';
export const waypointNodeSchema = z.object({
    id: contentIdSchema,
    grid: gridCoordSchema,
    padSize: z.number().int().positive(),
    landmarkKey: z.string().min(1),
});
export const routeLegSchema = z.object({
    from: contentIdSchema,
    to: contentIdSchema,
});
export const boardRouteSchema = z.object({
    id: contentIdSchema,
    groundLegs: z.array(routeLegSchema).min(1),
    flyingNodes: z.array(contentIdSchema).min(2),
});
export const boardDefinitionSchema = z.object({
    id: contentIdSchema,
    displayName: z.string().min(1),
    tileSize: z.literal(32),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    terrain: z.object({
        baseTileKey: z.string().min(1),
        decorKeys: z.array(z.string()).optional(),
    }),
    landmarks: z.array(waypointNodeSchema).min(2),
    routes: z.array(boardRouteSchema).min(1),
    defaultRouteId: contentIdSchema,
    zones: z.object({
        unbuildable: z.array(gridRectSchema),
        forcedWalkable: z.array(gridRectSchema),
        goalApproachLane: z.array(gridRectSchema),
        diagonalBypass: z.array(gridRectSchema),
    }),
    camera: z.object({
        startFocus: contentIdSchema,
        bounds: z.tuple([
            z.number(),
            z.number(),
            z.number(),
            z.number(),
        ]),
    }),
});
