import Phaser from 'phaser';
import type { GameState } from '../../game/types';
import { boardToScreen, type BoardLayout } from '../boardCoords';
import { fxTextureKey, projectileTextureKey, projectileVisualBranch } from '../assetManifest';
import { hideMissingSprites, pruneMissingSprites } from '../render/boardGraphics';

export class FxSpriteLayer {
  private projectileSprites = new Map<number, Phaser.GameObjects.Image>();
  private burstSprites = new Map<number, Phaser.GameObjects.Image>();
  private viewportMask: Phaser.Display.Masks.GeometryMask | null = null;

  constructor(private readonly scene: Phaser.Scene) {}

  setViewportMask(mask: Phaser.Display.Masks.GeometryMask | null): void {
    this.viewportMask = mask;
    for (const sprite of this.projectileSprites.values()) sprite.setMask(mask);
    for (const sprite of this.burstSprites.values()) sprite.setMask(mask);
  }

  private trackSprite<T extends Phaser.GameObjects.Image>(sprite: T): T {
    if (this.viewportMask) sprite.setMask(this.viewportMask);
    return sprite;
  }

  sync(state: GameState, layout: BoardLayout): void {
    this.syncProjectiles(state, layout);
    this.syncBurstFx(state, layout);
  }

  pruneAll(): void {
    pruneMissingSprites(this.projectileSprites, new Set());
    pruneMissingSprites(this.burstSprites, new Set());
  }

  private syncProjectiles(state: GameState, layout: BoardLayout): void {
    const liveIds = new Set<number>();
    const size = Math.max(12, layout.tileSize * 0.28);

    for (const projectile of state.projectiles) {
      if (!projectile.active) continue;
      liveIds.add(projectile.id);
      const branch = projectileVisualBranch(projectile.family);
      const texture = projectileTextureKey(branch);
      if (!this.scene.textures.exists(texture)) continue;

      const point = boardToScreen(layout, projectile);
      let sprite = this.projectileSprites.get(projectile.id);
      if (!sprite) {
        sprite = this.trackSprite(
          this.scene.add.image(0, 0, texture).setOrigin(0.5, 0.5).setDepth(3.2),
        );
        this.projectileSprites.set(projectile.id, sprite);
      }

      const target = state.enemies.find((enemy) => enemy.id === projectile.targetId);
      const angle =
        target !== undefined ? Math.atan2(target.y - projectile.y, target.x - projectile.x) : 0;

      sprite
        .setTexture(texture)
        .setPosition(point.x, point.y)
        .setDisplaySize(size, size)
        .setRotation(angle)
        .setVisible(true);
    }

    hideMissingSprites(this.projectileSprites, liveIds);
  }

  private syncBurstFx(state: GameState, layout: BoardLayout): void {
    const liveIds = new Set<number>();
    const mergeKey = fxTextureKey('merge-burst');
    const hasMergeBurst = this.scene.textures.exists(mergeKey);
    const burstSize = layout.tileSize * 1.1;

    for (const fx of state.fxEvents) {
      if (fx.kind !== 'merge' || !hasMergeBurst) continue;
      liveIds.add(fx.id);
      const point = boardToScreen(layout, { x: fx.x, y: fx.y });
      const alpha = Math.min(1, fx.life / 0.35);
      let sprite = this.burstSprites.get(fx.id);
      if (!sprite) {
        sprite = this.trackSprite(
          this.scene.add.image(0, 0, mergeKey).setOrigin(0.5, 0.5).setDepth(4.1),
        );
        this.burstSprites.set(fx.id, sprite);
      }
      sprite
        .setPosition(point.x, point.y)
        .setDisplaySize(burstSize * (1.1 - alpha * 0.25), burstSize * (1.1 - alpha * 0.25))
        .setAlpha(alpha)
        .setVisible(alpha > 0.05);
    }

    hideMissingSprites(this.burstSprites, liveIds);
  }
}
