import Phaser from 'phaser';
import { BOARD_HEIGHT, BOARD_WIDTH } from '../../game/content';
import { cellParity } from '../../game/boardParity';
import { canMergeGems } from '../../game/gems';
import { buildDetectionGems } from '../../game/detection';
import { isEnemyVisible } from '../../game/damage';
import { areAdjacentGems } from '../../game/recipes';
import type {
  BaseGemFamilyId,
  EnemyState,
  GameState,
  GemState,
  RawGemState,
} from '../../game/types';
import {
  BOSS_ENEMY_IDS,
  checkpointTextureKey,
  enemyWalkTextureKey,
  floorVariantFrame,
  gemTextureKey,
  terrainVariantIndex,
} from '../assetManifest';
import { boardToScreen, cellToScreen, type BoardLayout } from '../boardCoords';
import { COLORS, hideMissingSprites, pruneMissingSprites } from '../render/boardGraphics';

export class BoardSpriteLayer {
  private layout: BoardLayout = {
    left: 0,
    top: 0,
    tileSize: 48,
    padX: 0,
    padY: 0,
    width: 640,
    height: 400,
    mapWidth: 1344,
    mapHeight: 960,
    scrollX: 0,
    scrollY: 0,
    zoom: 1,
  };
  private viewportMask: Phaser.Display.Masks.GeometryMask | null = null;
  private terrainSprites = new Map<string, Phaser.GameObjects.Image>();
  private rockSprites = new Map<string, Phaser.GameObjects.Image>();
  private rawGemSprites = new Map<number, Phaser.GameObjects.Image>();
  private gemSprites = new Map<number, Phaser.GameObjects.Image>();
  private enemySprites = new Map<number, Phaser.GameObjects.Sprite>();
  private waypointMarkers = new Map<string, Phaser.GameObjects.Container>();

  constructor(private readonly scene: Phaser.Scene) {}

  setLayout(layout: BoardLayout): void {
    this.layout = layout;
  }

  setViewportMask(mask: Phaser.Display.Masks.GeometryMask | null): void {
    this.viewportMask = mask;
    for (const sprite of this.terrainSprites.values()) sprite.setMask(mask);
    for (const sprite of this.rockSprites.values()) sprite.setMask(mask);
    for (const sprite of this.rawGemSprites.values()) sprite.setMask(mask);
    for (const sprite of this.gemSprites.values()) sprite.setMask(mask);
    for (const sprite of this.enemySprites.values()) sprite.setMask(mask);
    for (const marker of this.waypointMarkers.values()) marker.setMask(mask);
  }

  private applyMask(sprite: Phaser.GameObjects.GameObject): void {
    if (this.viewportMask) sprite.setMask(this.viewportMask);
  }

  private trackSprite<T extends Phaser.GameObjects.GameObject>(sprite: T): T {
    this.applyMask(sprite);
    return sprite;
  }

  sync(state: GameState, overlay: Phaser.GameObjects.Graphics): void {
    this.updateHexTerrain(state.pathNav.pathCells);
    this.updateWaypointMarkers(state.pathNav);
    this.updateRockSprites(state.rocks);
    this.updateRawGemSprites(state.rawGems);
    this.updateGemSprites(state.gems, state.mergeSourceGemId, state.greatUnlocked);
    this.updateEnemySprites(state);
    this.drawEnemyBars(overlay, state.enemies);
  }

  pruneAll(fxLabels: Map<number, Phaser.GameObjects.Text>): void {
    pruneMissingSprites(this.gemSprites, new Set());
    pruneMissingSprites(this.enemySprites, new Set());
    pruneMissingSprites(this.rockSprites, new Set());
    pruneMissingSprites(this.rawGemSprites, new Set());
    for (const [key, marker] of this.waypointMarkers) {
      marker.destroy();
      this.waypointMarkers.delete(key);
    }
    pruneMissingSprites(fxLabels, new Set());
  }

  private updateHexTerrain(pathCells: ReadonlySet<string>): void {
    const liveKeys = new Set<string>();
    const tileW = this.layout.tileSize;
    const tileH = this.layout.tileSize;
    for (let r = 0; r < BOARD_HEIGHT; r++) {
      for (let q = 0; q < BOARD_WIDTH; q++) {
        const key = `${q},${r}`;
        liveKeys.add(key);
        const onPath = pathCells.has(key);
        const isGemCell = cellParity(q, r) === 'gem';
        const variant = terrainVariantIndex(q, r);
        const useVariants = this.scene.textures.exists('floor-variants');
        const texture = onPath
          ? 'hex-path-floor'
          : isGemCell
            ? 'hex-gem-floor'
            : useVariants
              ? 'floor-variants'
              : 'hex-rock-floor';
        const frame = !onPath && !isGemCell && useVariants ? floorVariantFrame(variant) : undefined;
        const point = cellToScreen(this.layout, { x: q, y: r });
        const sprite =
          this.terrainSprites.get(key) ??
          this.trackSprite(
            this.scene.add.image(0, 0, texture, frame).setOrigin(0.5, 0.5).setDepth(0.8),
          );
        this.terrainSprites.set(key, sprite);
        if (frame !== undefined) {
          sprite.setTexture(texture, frame);
        } else {
          sprite.setTexture(texture);
        }
        sprite.setPosition(point.x, point.y).setDisplaySize(tileW, tileH).setVisible(true);
      }
    }
    hideMissingSprites(this.terrainSprites, liveKeys);
  }

  private updateWaypointMarkers(pathNav: GameState['pathNav']): void {
    const liveKeys = new Set<string>();
    const lastIndex = pathNav.checkpoints.length - 1;
    const markerDepth = 1.85;
    const size = this.layout.tileSize * 0.78;

    for (let i = 0; i < pathNav.checkpoints.length; i++) {
      const cp = pathNav.checkpoints[i]!;
      const key = `${cp.x},${cp.y}`;
      liveKeys.add(key);
      const point = cellToScreen(this.layout, cp);
      const isStart = i === 0;
      const isFinish = i === lastIndex;

      let container = this.waypointMarkers.get(key);
      if (!container) {
        container = this.trackSprite(this.scene.add.container(0, 0).setDepth(markerDepth));
        this.waypointMarkers.set(key, container);
      }

      container.removeAll(true);

      if (isStart) {
        const portal = this.scene.add
          .image(0, 0, 'spawn-portal')
          .setOrigin(0.5, 0.72)
          .setDisplaySize(size * 1.75, size * 1.75);
        container.add(portal);
      } else if (isFinish) {
        const nexus = this.scene.add
          .image(0, 0, 'goal-nexus')
          .setOrigin(0.5, 0.72)
          .setDisplaySize(size * 1.75, size * 1.75);
        container.add(nexus);
      } else {
        const marker = this.scene.add
          .image(0, 0, checkpointTextureKey(i as 1 | 2 | 3 | 4 | 5))
          .setOrigin(0.5, 0.72)
          .setDisplaySize(size * 1.45, size * 1.45);
        container.add(marker);
      }

      container.setPosition(point.x, point.y).setVisible(true);
    }

    for (const [key, marker] of this.waypointMarkers) {
      if (!liveKeys.has(key)) marker.setVisible(false);
    }
  }

  private updateRockSprites(rocks: GameState['rocks']): void {
    const liveKeys = new Set<string>();
    for (const rock of rocks) {
      const key = `${rock.x},${rock.y}`;
      liveKeys.add(key);
      const point = cellToScreen(this.layout, rock);
      const sprite =
        this.rockSprites.get(key) ??
        this.trackSprite(
          this.scene.add.image(0, 0, 'board-rock').setOrigin(0.5, 0.72).setDepth(2.05),
        );
      this.rockSprites.set(key, sprite);
      sprite
        .setPosition(point.x, point.y + this.layout.tileSize * 0.12)
        .setDisplaySize(this.layout.tileSize * 1.7, this.layout.tileSize * 1.7)
        .setVisible(true);
    }
    pruneMissingSprites(this.rockSprites, liveKeys);
  }

  private updateGemSprites(
    gems: readonly GemState[],
    mergeSourceId: number | null,
    greatUnlocked: readonly BaseGemFamilyId[],
  ): void {
    const liveIds = new Set<number>();
    const source = mergeSourceId !== null ? gems.find((g) => g.id === mergeSourceId) : undefined;
    for (const gem of gems) {
      liveIds.add(gem.id);
      const point = boardToScreen(this.layout, gem);
      const texKey = gemTextureKey(gem.family, gem.level);
      const sprite =
        this.gemSprites.get(gem.id) ??
        this.trackSprite(this.scene.add.image(0, 0, texKey).setOrigin(0.5, 0.78).setDepth(2.12));
      this.gemSprites.set(gem.id, sprite);
      const size = this.layout.tileSize * (1.35 + gem.level * 0.05);
      const pulse = 1 + Math.sin(this.scene.time.now / 180) * 0.04;
      sprite
        .setTexture(texKey)
        .setPosition(point.x, point.y + this.layout.tileSize * 0.08)
        .setDisplaySize(size * pulse, size * pulse)
        .setVisible(true);
      if (gem.id === mergeSourceId) {
        sprite.setTint(0xfff4a3);
      } else if (
        source &&
        canMergeGems(source, gem, greatUnlocked) &&
        areAdjacentGems(source.x, source.y, gem.x, gem.y)
      ) {
        sprite.setTint(0xa8ffd0);
      } else {
        sprite.clearTint();
      }
    }
    pruneMissingSprites(this.gemSprites, liveIds);
  }

  private updateRawGemSprites(rawGems: readonly RawGemState[]): void {
    const liveIds = new Set<number>();
    for (const raw of rawGems) {
      liveIds.add(raw.id);
      const point = cellToScreen(this.layout, raw);
      const texKey = gemTextureKey(raw.family, raw.level);
      const sprite =
        this.rawGemSprites.get(raw.id) ??
        this.trackSprite(this.scene.add.image(0, 0, texKey).setOrigin(0.5, 0.78).setDepth(2.1));
      this.rawGemSprites.set(raw.id, sprite);
      const size = this.layout.tileSize * (1.2 + raw.level * 0.04);
      sprite
        .setTexture(texKey)
        .setPosition(point.x, point.y + this.layout.tileSize * 0.08)
        .setDisplaySize(size, size)
        .setAlpha(0.72)
        .setTint(0xdbeafe)
        .setVisible(true);
    }
    pruneMissingSprites(this.rawGemSprites, liveIds);
  }

  private updateEnemySprites(state: GameState): void {
    const enemies = state.enemies;
    const detectionGems = buildDetectionGems(state);
    const liveIds = new Set<number>();
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      liveIds.add(enemy.id);
      const point = boardToScreen(this.layout, enemy);
      const texKey = enemyWalkTextureKey(enemy.definitionId);
      const animKey = `${texKey}-anim`;
      const isBoss = BOSS_ENEMY_IDS.includes(enemy.definitionId);
      const sprite =
        this.enemySprites.get(enemy.id) ??
        this.trackSprite(
          this.scene.add.sprite(0, 0, texKey, 0).setOrigin(0.5, 0.82).setDepth(2.18),
        );
      this.enemySprites.set(enemy.id, sprite);
      const size = this.layout.tileSize * (isBoss ? 2.5 : 1.75);
      sprite
        .setPosition(point.x, point.y + this.layout.tileSize * 0.15)
        .setDisplaySize(size, size)
        .setVisible(true);
      if (this.scene.anims.exists(animKey)) {
        if (!sprite.anims.isPlaying || sprite.anims.currentAnim?.key !== animKey) {
          sprite.play(animKey);
        }
      }

      sprite.clearTint();
      sprite.setAlpha(1);
      const slowed = enemy.slowUntil > state.time;
      const stealthed =
        enemy.invisible &&
        !isEnemyVisible(enemy.revealedUntil, state.time, 0.5, enemy, detectionGems, true);
      if (slowed) sprite.setTint(0x88ccff);
      else if (enemy.flying) sprite.setTint(0xc4f0ff);
      if (stealthed) sprite.setAlpha(0.35);
    }
    pruneMissingSprites(this.enemySprites, liveIds);
  }

  private drawEnemyBars(
    overlay: Phaser.GameObjects.Graphics,
    enemies: readonly EnemyState[],
  ): void {
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const point = boardToScreen(this.layout, enemy);
      const isBoss = BOSS_ENEMY_IDS.includes(enemy.definitionId);
      const barW = this.layout.tileSize * (isBoss ? 1.2 : 0.85);
      overlay.fillStyle(0x02050a, 0.7);
      overlay.fillRect(point.x - barW / 2, point.y - this.layout.tileSize * 0.75, barW, 4);
      overlay.fillStyle(COLORS.green, 0.95);
      overlay.fillRect(
        point.x - barW / 2,
        point.y - this.layout.tileSize * 0.75,
        barW * Math.max(0, enemy.hp / enemy.maxHp),
        4,
      );
      if (enemy.maxShield > 0) {
        overlay.fillStyle(COLORS.shield, 0.92);
        overlay.fillRect(
          point.x - barW / 2,
          point.y - this.layout.tileSize * 0.62,
          barW * Math.max(0, enemy.shield / enemy.maxShield),
          3,
        );
      }
    }
  }
}
