import { describe, expect, it } from 'vitest';
import boardJson from '../data/boards/default-28x20.json';
import combinationsJson from '../data/combinations.json';
import gemsJson from '../data/gems/slice.json';
import wavesJson from '../data/waves/slice-6.json';
import { validateContentPack } from './validate';

describe('content pack', () => {
  it('validates slice data', () => {
    const result = validateContentPack({
      gems: gemsJson,
      board: boardJson,
      waves: wavesJson,
      combinations: combinationsJson,
    });
    expect(result).toEqual({ ok: true });
  });
});
