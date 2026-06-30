import { describe, expect, it } from 'vitest';
import { saveFingerprint } from './saveFingerprint';
import { createDefaultSave } from './save';

describe('saveFingerprint', () => {
  it('changes when non-power save progress changes', () => {
    const a = createDefaultSave();
    const b = { ...createDefaultSave(), clearedAreaTiers: ['a1:normal'] };
    expect(saveFingerprint(a)).not.toBe(saveFingerprint(b));
  });
});
