import { z } from 'zod';

export const commandTypeSchema = z.enum([
  'PLACE_ROCK',
  'SELL_ROCK',
  'UPGRADE_ROCK',
  'SELL_TOWER',
  'CLAIM_OFFER',
  'REROLL_OFFER',
  'MERGE_TOWERS',
  'CREATE_COMBINATION',
  'SET_TARGETING',
  'READY_FOR_WAVE',
  'REQUEST_SPEED',
  'VOTE_PAUSE',
  'PING_TILE',
]);

export const commandEnvelopeSchema = z.object({
  playerId: z.string(),
  roomId: z.string(),
  clientSequence: z.number().int().nonnegative(),
  commandType: commandTypeSchema,
  payload: z.record(z.string(), z.unknown()),
});

export const placeRockPayloadSchema = z.object({ x: z.number().int(), y: z.number().int() });

export type CommandType = z.infer<typeof commandTypeSchema>;
export type CommandEnvelope = z.infer<typeof commandEnvelopeSchema>;
