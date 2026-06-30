import { describe, expect, it } from 'vitest';
import {
  projectileAssetPath,
  projectileTextureKey,
  projectileVisualBranch,
  PROJECTILE_BRANCHES,
} from './assetManifest';

describe('projectile asset manifest', () => {
  it('maps base and hybrid gem families to projectile branches', () => {
    expect(projectileVisualBranch('kinetic')).toBe('kinetic');
    expect(projectileVisualBranch('toxic_shot')).toBe('verdant');
    expect(projectileVisualBranch('plasma_mortar')).toBe('nova');
    expect(projectileVisualBranch('ember_lance')).toBe('kinetic');
  });

  it('defines texture keys and paths for each projectile branch', () => {
    for (const branch of PROJECTILE_BRANCHES) {
      expect(projectileTextureKey(branch)).toBe(`projectile-${branch}`);
      expect(projectileAssetPath(branch)).toBe(`/assets/fx/projectiles/${branch}.png`);
    }
  });
});
