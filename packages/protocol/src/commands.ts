import { z } from 'zod';

/** Default board from `packages/content/data/boards/default-28x20.json`. */
export const BOARD_WIDTH = 28;
export const BOARD_HEIGHT = 20;

const tileXSchema = z
  .number()
  .int()
  .min(0)
  .max(BOARD_WIDTH - 1);
const tileYSchema = z
  .number()
  .int()
  .min(0)
  .max(BOARD_HEIGHT - 1);

export const tileCoordPayloadSchema = z.object({
  x: tileXSchema,
  y: tileYSchema,
});

export const placeRawGemPayloadSchema = tileCoordPayloadSchema;
export const placeRockPayloadSchema = tileCoordPayloadSchema;
export const sellRockPayloadSchema = tileCoordPayloadSchema;
export const upgradeRockPayloadSchema = tileCoordPayloadSchema;
export const pingTilePayloadSchema = tileCoordPayloadSchema;

export const claimOfferPayloadSchema = z.object({
  index: z.number().int().min(0).max(4),
});

export const commitRawGemPayloadSchema = z.object({
  rawGemId: z.number().int().positive(),
});

export const commitRawRecipePayloadSchema = z.object({
  recipeId: z.string().min(1),
});

export const mergeGemsPayloadSchema = z.object({
  sourceGemId: z.number().int().positive(),
  targetGemId: z.number().int().positive(),
});

export const sellGemPayloadSchema = z.object({
  gemId: z.number().int().positive(),
});

export const setTargetingPayloadSchema = z.object({
  gemId: z.number().int().positive(),
  mode: z.enum(['first', 'last', 'strong', 'weak']),
});

export const requestSpeedPayloadSchema = z.object({
  speed: z.union([z.literal(1), z.literal(2), z.literal(4)]),
});

export const votePausePayloadSchema = z.object({
  paused: z.boolean(),
});

export const emptyPayloadSchema = z.object({}).strict();

/** @deprecated Legacy sim merge — prefer `MERGE_GEMS`. */
export const mergeTowersPayloadSchema = z.object({
  sourceId: z.number().int().positive(),
  targetId: z.number().int().positive(),
});

/** @deprecated Legacy sim combination — prefer `COMMIT_RAW_RECIPE`. */
export const createCombinationPayloadSchema = z.object({
  recipeId: z.string().min(1),
  x: tileXSchema,
  y: tileYSchema,
  towerA: z.number().int().positive(),
  towerB: z.number().int().positive(),
});

export const commandTypeSchema = z.enum([
  'PLACE_RAW_GEM',
  'PLACE_ROCK',
  'FINISH_ROCKS',
  'CLAIM_OFFER',
  'REROLL_OFFERS',
  'COMMIT_RAW_GEM',
  'COMMIT_RAW_RECIPE',
  'MERGE_GEMS',
  'SELL_GEM',
  'SELL_ROCK',
  'UPGRADE_ROCK',
  'SET_TARGETING',
  'READY_FOR_WAVE',
  'REQUEST_SPEED',
  'VOTE_PAUSE',
  'PING_TILE',
  // Legacy aliases kept for older clients and the sim prototype.
  'REROLL_OFFER',
  'MERGE_TOWERS',
  'SELL_TOWER',
  'CREATE_COMBINATION',
]);

export type CommandType = z.infer<typeof commandTypeSchema>;

export const commandPayloadSchemas = {
  PLACE_RAW_GEM: placeRawGemPayloadSchema,
  PLACE_ROCK: placeRockPayloadSchema,
  FINISH_ROCKS: emptyPayloadSchema,
  CLAIM_OFFER: claimOfferPayloadSchema,
  REROLL_OFFERS: emptyPayloadSchema,
  COMMIT_RAW_GEM: commitRawGemPayloadSchema,
  COMMIT_RAW_RECIPE: commitRawRecipePayloadSchema,
  MERGE_GEMS: mergeGemsPayloadSchema,
  SELL_GEM: sellGemPayloadSchema,
  SELL_ROCK: sellRockPayloadSchema,
  UPGRADE_ROCK: upgradeRockPayloadSchema,
  SET_TARGETING: setTargetingPayloadSchema,
  READY_FOR_WAVE: emptyPayloadSchema,
  REQUEST_SPEED: requestSpeedPayloadSchema,
  VOTE_PAUSE: votePausePayloadSchema,
  PING_TILE: pingTilePayloadSchema,
  REROLL_OFFER: emptyPayloadSchema,
  MERGE_TOWERS: mergeTowersPayloadSchema,
  SELL_TOWER: sellGemPayloadSchema,
  CREATE_COMBINATION: createCombinationPayloadSchema,
} as const satisfies Record<CommandType, z.ZodTypeAny>;

export const commandEnvelopeSchema = z.object({
  playerId: z.string().min(1),
  roomId: z.string().min(1),
  clientSequence: z.number().int().nonnegative(),
  commandType: commandTypeSchema,
  payload: z.record(z.string(), z.unknown()).default({}),
});

export type CommandEnvelope = z.infer<typeof commandEnvelopeSchema>;

type PayloadFor<T extends CommandType> = z.infer<(typeof commandPayloadSchemas)[T]>;

export type ValidatedCommand<T extends CommandType = CommandType> = {
  playerId: string;
  roomId: string;
  clientSequence: number;
  commandType: T;
  payload: PayloadFor<T>;
};

export type ParseCommandResult =
  | { success: true; command: ValidatedCommand }
  | { success: false; error: z.ZodError };

export function parseCommandEnvelope(raw: unknown): ParseCommandResult {
  const envelopeResult = commandEnvelopeSchema.safeParse(raw);
  if (!envelopeResult.success) {
    return { success: false, error: envelopeResult.error };
  }

  const { playerId, roomId, clientSequence, commandType, payload } = envelopeResult.data;
  const payloadSchema = commandPayloadSchemas[commandType];
  const payloadResult = payloadSchema.safeParse(payload);
  if (!payloadResult.success) {
    return { success: false, error: payloadResult.error };
  }

  return {
    success: true,
    command: {
      playerId,
      roomId,
      clientSequence,
      commandType,
      payload: payloadResult.data,
    } as ValidatedCommand,
  };
}
