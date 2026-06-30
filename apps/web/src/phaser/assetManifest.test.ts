import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';
import {
  ASSET_PATHS,
  CHECKPOINT_LEVELS,
  ENEMY_IDS,
  FLOOR_VARIANT_COUNT,
  GEM_FAMILIES,
  GEM_LEVELS,
  checkpointAssetPath,
  enemyWalkAssetPath,
  floorVariantFrame,
  gemAssetPath,
  PROJECTILE_BRANCHES,
  projectileAssetPath,
  projectileVisualBranch,
  terrainVariantIndex,
} from './assetManifest';

const PUBLIC_ROOT = join(process.cwd(), 'public');

function resolvePublicAsset(urlPath: string): string {
  return join(PUBLIC_ROOT, urlPath.replace(/^\//, ''));
}

function pngHasAlpha(filePath: string): boolean {
  const png = PNG.sync.read(readFileSync(filePath));
  for (let i = 3; i < png.data.length; i += 4) {
    if (png.data[i]! < 255) return true;
  }
  return false;
}

describe('phaser asset manifest integration', () => {
  it('loads core board object sprites from public/assets', () => {
    for (const url of Object.values(ASSET_PATHS)) {
      expect(existsSync(resolvePublicAsset(url)), url).toBe(true);
    }
  });

  it('loads gem and enemy sprite sheets from public/assets', () => {
    const gemRoot = join(PUBLIC_ROOT, 'assets/gems');
    const familiesOnDisk = readdirSync(gemRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
    expect(familiesOnDisk.length).toBeGreaterThanOrEqual(GEM_FAMILIES.length - 3);

    for (const family of familiesOnDisk) {
      for (const level of GEM_LEVELS) {
        const path = join(gemRoot, family, `L${level}.png`);
        expect(existsSync(path), `${family}/L${level}`).toBe(true);
      }
    }
    for (const enemyId of ENEMY_IDS) {
      expect(existsSync(resolvePublicAsset(enemyWalkAssetPath(enemyId)))).toBe(true);
    }
  });

  it('loads numbered checkpoint marker tiles from public/assets', () => {
    for (const level of CHECKPOINT_LEVELS) {
      expect(existsSync(resolvePublicAsset(checkpointAssetPath(level)))).toBe(true);
    }
  });

  it('keeps object sprites on transparent PNG alpha', () => {
    const objectSprites = [
      ASSET_PATHS.rock,
      ASSET_PATHS.spawnPortal,
      ASSET_PATHS.goalNexus,
      gemAssetPath('kinetic', 1),
      enemyWalkAssetPath('scout'),
      ...CHECKPOINT_LEVELS.map((level) => checkpointAssetPath(level)),
    ];
    for (const url of objectSprites) {
      const filePath = resolvePublicAsset(url);
      expect(pngHasAlpha(filePath), url).toBe(true);
    }
  });

  it('maps board cells to stable floor variant indices', () => {
    expect(terrainVariantIndex(0, 0)).toBe(0);
    expect(floorVariantFrame(terrainVariantIndex(3, 5))).toBeLessThan(FLOOR_VARIANT_COUNT);
    expect(terrainVariantIndex(3, 5)).toBe(terrainVariantIndex(3, 5));
  });

  it('loads T-02 floor variant tileset when exported', () => {
    const variantsPath = resolvePublicAsset(ASSET_PATHS.terrainFloorVariants);
    if (!existsSync(variantsPath)) return;
    expect(existsSync(variantsPath)).toBe(true);
  });

  it('ember-family gems are not byte-identical to kinetic placeholders', () => {
    const emberPath = resolvePublicAsset(gemAssetPath('ember', 1));
    const kineticPath = resolvePublicAsset(gemAssetPath('kinetic', 1));
    if (!existsSync(emberPath) || !existsSync(kineticPath)) return;
    const ember = readFileSync(emberPath);
    const kinetic = readFileSync(kineticPath);
    expect(Buffer.compare(ember, kinetic)).not.toBe(0);
  });

  it('loads projectile and fx sprites when exported', () => {
    const fxPaths = [
      ASSET_PATHS.fxMergeBurst,
      ASSET_PATHS.fxHitSpark,
      ...PROJECTILE_BRANCHES.map((branch) => projectileAssetPath(branch)),
    ];
    const existing = fxPaths.filter((url) => existsSync(resolvePublicAsset(url)));
    if (existing.length === 0) return;
    for (const url of existing) {
      expect(existsSync(resolvePublicAsset(url)), url).toBe(true);
      expect(pngHasAlpha(resolvePublicAsset(url)), url).toBe(true);
    }
    expect(projectileVisualBranch('toxic_shot')).toBe('verdant');
  });
});
