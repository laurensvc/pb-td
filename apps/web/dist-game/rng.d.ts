/** Deterministic PRNG (mulberry32) for seeded combat and offers. */
export declare function mulberry32(seed: number): () => number;
export declare function nextCombatRoll(state: {
    runSeed: number;
    combatRollNonce: number;
}): number;
