export interface RngState {
  seed: number
  state: number
}

/** Deterministic mulberry32 PRNG for gameplay rolls. */
export class SeededRng {
  private state: number
  readonly seed: number

  constructor(seed: number) {
    this.seed = seed >>> 0
    this.state = this.seed
  }

  /** Returns a float in [0, 1). */
  next(): number {
    let t = (this.state += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  pickUniform<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new Error('pickUniform: empty array')
    }
    const index = Math.floor(this.next() * items.length)
    return items[Math.min(index, items.length - 1)]!
  }

  pickWeighted<T>(items: readonly { item: T; weight: number }[]): T {
    const total = items.reduce((sum, entry) => sum + entry.weight, 0)
    if (total <= 0) {
      throw new Error('pickWeighted: zero total weight')
    }
    let roll = this.next() * total
    for (const entry of items) {
      roll -= entry.weight
      if (roll < 0) return entry.item
    }
    return items[items.length - 1]!.item
  }

  /** Derive an independent sub-stream (optional label mixes entropy). */
  fork(label?: string): SeededRng {
    let mix = this.next() * 0xffffffff
    if (label) {
      for (let i = 0; i < label.length; i++) {
        mix = (mix ^ (label.charCodeAt(i) * (i + 1))) >>> 0
      }
    }
    return new SeededRng(mix >>> 0)
  }

  getState(): RngState {
    return { seed: this.seed, state: this.state >>> 0 }
  }

  static fromState(state: RngState): SeededRng {
    const rng = new SeededRng(state.seed)
    rng.state = state.state >>> 0
    return rng
  }
}
