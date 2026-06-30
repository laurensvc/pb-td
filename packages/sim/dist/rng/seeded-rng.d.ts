export interface RngState {
    seed: number;
    state: number;
}
/** Deterministic mulberry32 PRNG for gameplay rolls. */
export declare class SeededRng {
    private state;
    readonly seed: number;
    constructor(seed: number);
    /** Returns a float in [0, 1). */
    next(): number;
    pickUniform<T>(items: readonly T[]): T;
    pickWeighted<T>(items: readonly {
        item: T;
        weight: number;
    }[]): T;
    /** Derive an independent sub-stream (optional label mixes entropy). */
    fork(label?: string): SeededRng;
    getState(): RngState;
    static fromState(state: RngState): SeededRng;
}
//# sourceMappingURL=seeded-rng.d.ts.map