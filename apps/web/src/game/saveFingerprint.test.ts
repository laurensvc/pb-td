import { describe, expect, it } from 'vitest';
import { saveFingerprint } from './saveFingerprint';
import { createDefaultSave } from './save';

describe('saveFingerprint', () => {
  it('changes when stars are earned', () => {
    const a = createDefaultSave();
    const b = { ...createDefaultSave(), stars: 5 };
    expect(saveFingerprint(a)).not.toBe(saveFingerprint(b));
  });
});
