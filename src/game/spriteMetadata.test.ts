import { describe, expect, it } from 'vitest';
import publicSpriteAtlas from '../../public/assets/sprites/sprites.json';
import { gameConfig } from './config';
import { spriteMetadata, type SpriteRect } from './spriteMetadata';

describe('sprite metadata', () => {
  it('has atlas metadata for every configured enemy', () => {
    for (const enemy of gameConfig.enemies) {
      const monster = spriteMetadata.monsters[enemy.id];
      expect(monster).toBeTruthy();
      expect(monster.animations.walk.frames.length).toBeGreaterThan(0);
    }
  });

  it('can render every configured gem or tower with metadata or canvas fallback', () => {
    for (const gem of gameConfig.gems) expect(gem.id).toBeTruthy();
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

  it('keeps the public atlas in sync: sheets, frame size, monsters, and base gem keys', () => {
    const publicMetadata = publicSpriteAtlas as {
      frameSize: number;
      sheets: (typeof spriteMetadata)['sheets'];
      monsters: (typeof spriteMetadata)['monsters'];
      gems: Record<string, unknown>;
    };
    expect(spriteMetadata.frameSize).toBe(publicMetadata.frameSize);
    expect(spriteMetadata.sheets).toEqual(publicMetadata.sheets);
    expect(spriteMetadata.monsters).toEqual(publicMetadata.monsters);
    for (const [id, meta] of Object.entries(publicMetadata.gems)) {
      expect(spriteMetadata.gems[id]).toEqual(meta);
    }
  });
});

function expectInside(frame: SpriteRect, width: number, height: number) {
  expect(frame.x).toBeGreaterThanOrEqual(0);
  expect(frame.y).toBeGreaterThanOrEqual(0);
  expect(frame.x + frame.w).toBeLessThanOrEqual(width);
  expect(frame.y + frame.h).toBeLessThanOrEqual(height);
}
