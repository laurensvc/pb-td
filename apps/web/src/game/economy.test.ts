import { describe, expect, it } from 'vitest';
import { goldInterest, waveIncome } from './economy';

describe('economy', () => {
  it('grants wave income that scales with wave number', () => {
    expect(waveIncome(1)).toBe(12);
    expect(waveIncome(10)).toBeGreaterThan(waveIncome(1));
  });

  it('applies 2% interest per 10 gold banked', () => {
    expect(goldInterest(9)).toBe(0);
    expect(goldInterest(50)).toBe(1);
    expect(goldInterest(100)).toBe(2);
  });
});
