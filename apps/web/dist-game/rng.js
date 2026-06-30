/** Deterministic PRNG (mulberry32) for seeded combat and offers. */
export function mulberry32(seed) {
    let s = seed | 0;
    return () => {
        s = (s + 0x6d2b79f5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
export function nextCombatRoll(state) {
    const rng = mulberry32(state.runSeed + state.combatRollNonce * 7919);
    state.combatRollNonce += 1;
    return rng();
}
