import { describe, expect, it } from 'vitest';
import { goldInterest, MAX_INTEREST_GOLD } from './economy';

describe('economy', () => {
  it('caps interest like classic GemTD', () => {
    expect(goldInterest(100)).toBeLessThanOrEqual(MAX_INTEREST_GOLD);
    expect(goldInterest(1000)).toBeLessThanOrEqual(MAX_INTEREST_GOLD);
    expect(goldInterest(5)).toBe(0);
    expect(goldInterest(50)).toBe(1);
  });
});
