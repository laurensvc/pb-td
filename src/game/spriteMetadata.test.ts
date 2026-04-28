import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gameConfig } from './config';
import { spriteMetadata, type SpriteRect } from './spriteMetadata';

describe('sprite metadata', () => {
  it('covers every configured enemy', () => {
    for (const enemy of gameConfig.enemies) {
      expect(spriteMetadata.monsters[enemy.id], enemy.id).toBeDefined();
    }
  });

  it('covers every configured gem', () => {
    for (const gem of gameConfig.gems) {
      expect(spriteMetadata.gems[gem.id], gem.id).toBeDefined();
    }
  });

  it('keeps all frame rectangles inside their sheets', () => {
    for (const monster of Object.values(spriteMetadata.monsters)) {
      const sheet = spriteMetadata.sheets[monster.sheet];
      for (const animation of Object.values(monster.animations)) {
        for (const frame of animation.frames) expectInside(frame, sheet.width, sheet.height);
      }
    }
    for (const gem of Object.values(spriteMetadata.gems)) {
      const sheet = spriteMetadata.sheets[gem.sheet];
      expectInside(gem.frame, sheet.width, sheet.height);
    }
  });

  it('matches the public sprite metadata json', () => {
    const publicMetadata = JSON.parse(
      readFileSync(join(process.cwd(), 'public', 'assets', 'sprites', 'sprites.json'), 'utf8'),
    );
    expect(publicMetadata).toEqual(spriteMetadata);
  });
});

function expectInside(frame: SpriteRect, width: number, height: number) {
  expect(frame.x).toBeGreaterThanOrEqual(0);
  expect(frame.y).toBeGreaterThanOrEqual(0);
  expect(frame.x + frame.w).toBeLessThanOrEqual(width);
  expect(frame.y + frame.h).toBeLessThanOrEqual(height);
}
