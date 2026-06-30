import Phaser from 'phaser';
import { BOARD_HEIGHT, BOARD_WIDTH, gemDefinitions } from '../game/content';
import { cellParity } from '../game/boardParity';
import { canPlaceGemAt, canPlaceRockAt } from '../game/engine';
import { hexPixelCorners, worldToHex } from '../game/hexGrid';
import type {
  EnemyState,
  FxEvent,
  GameState,
  GemState,
  MissileState,
  Vec2,
} from '../game/types';
import {
  ASSET_PATHS,
  BOSS_ENEMY_IDS,
  ENEMY_FRAME_SIZE,
  ENEMY_IDS,
  ENEMY_WALK_FRAMES,
  GEM_FAMILIES,
  GEM_LEVELS,
  enemyWalkAssetPath,
  enemyWalkTextureKey,
  gemAssetPath,
  gemTextureKey,
} from './assetManifest';
import { getBridge } from './bridge';
import {
  boardToScreen,
  cellCenter,
  cellToScreen,
  computeLayout,
  pointerToCanvas,
  rangeToPixels,
  screenToBoard,
  screenToCell,
  type BoardLayout,
} from './boardCoords';

const COLORS = {
  bg: 0x050812,
  grid: 0x19324a,
  path: 0x35d0ff,
  green: 0x7fffb2,
  red: 0xff5a7a,
  shield: 0xbd9cff,
};

export class CosmicBoardScene extends Phaser.Scene {
  private board!: Phaser.GameObjects.Graphics;
  private boardOverlay!: Phaser.GameObjects.Graphics;
  private fx!: Phaser.GameObjects.Graphics;
  private terrainSprites = new Map<string, Phaser.GameObjects.Image>();
  private rockSprites = new Map<string, Phaser.GameObjects.Image>();
  private gemSprites = new Map<number, Phaser.GameObjects.Image>();
  private enemySprites = new Map<number, Phaser.GameObjects.Sprite>();
  private waypointMarkers = new Map<string, Phaser.GameObjects.Container>();
  private hoverCell: Vec2 | null = null;
  private layout: BoardLayout = {
    left: 0,
    top: 0,
    hexRadius: 22,
    padX: 0,
    padY: 0,
    width: 640,
    height: 400,
  };
  private assetsReady = false;

  constructor() {
    super('cosmic-board');
  }

  preload(): void {
    this.load.image('hex-rock-floor', ASSET_PATHS.terrainVoid);
    this.load.image('hex-gem-floor', ASSET_PATHS.terrainGem);
    this.load.image('hex-path-floor', ASSET_PATHS.terrainPath);
    this.load.image('cosmic-rock', ASSET_PATHS.rock);
    this.load.image('spawn-portal', ASSET_PATHS.spawnPortal);
    this.load.image('goal-nexus', ASSET_PATHS.goalNexus);

    for (const family of GEM_FAMILIES) {
      for (const level of GEM_LEVELS) {
        this.load.image(gemTextureKey(family, level), gemAssetPath(family, level));
      }
    }

    for (const enemyId of ENEMY_IDS) {
      const key = enemyWalkTextureKey(enemyId);
      this.load.spritesheet(key, enemyWalkAssetPath(enemyId), {
        frameWidth: ENEMY_FRAME_SIZE,
        frameHeight: ENEMY_FRAME_SIZE,
      });
    }
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.registerAnimations();
    this.board = this.add.graphics().setDepth(1);
    this.boardOverlay = this.add.graphics().setDepth(1.35);
    this.fx = this.add.graphics().setDepth(4);
    this.assetsReady = true;
    this.input.on('pointerdown', this.handlePointerDown, this);
    this.input.on('pointermove', this.handlePointerMove, this);
    this.input.on('gameout', this.clearHover, this);
  }

  update(_time: number, delta: number): void {
    const bridge = getBridge();
    bridge.step(delta / 1000);
    const state = bridge.getState();
    this.layout = computeLayout(this.scale.width, this.scale.height);
    this.drawBoard(state);
    this.drawSprites(state);
    this.drawFx(state);
  }

  private registerAnimations(): void {
    for (const enemyId of ENEMY_IDS) {
      const key = enemyWalkTextureKey(enemyId);
      if (this.anims.exists(`${key}-anim`)) continue;
      if (!this.textures.exists(key)) continue;
      this.anims.create({
        key: `${key}-anim`,
        frames: this.anims.generateFrameNumbers(key, { start: 0, end: ENEMY_WALK_FRAMES - 1 }),
        frameRate: BOSS_ENEMY_IDS.includes(enemyId) ? 6 : 9,
        repeat: -1,
      });
    }
  }

  private pointerCanvasPoint(pointer: Phaser.Input.Pointer): Vec2 {
    return pointerToCanvas(pointer, this.game.canvas, this.scale.width, this.scale.height);
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    const state = getBridge().getState();
    const canvasPoint = this.pointerCanvasPoint(pointer);
    this.hoverCell = screenToCell(this.layout, canvasPoint.x, canvasPoint.y);
    const boardPoint = this.hoverCell ? cellCenter(this.hoverCell) : null;
    const canPlace =
      boardPoint !== null &&
      state.status !== 'running' &&
      (state.placementMode === 'rock'
        ? canPlaceRockAt(state, boardPoint.x, boardPoint.y)
        : state.placementMode === 'gem' && canPlaceGemAt(state, boardPoint.x, boardPoint.y));
    this.input.manager.canvas.style.cursor = canPlace ? 'pointer' : 'crosshair';
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    const bridge = getBridge();
    const state = bridge.getState();
    const canvasPoint = this.pointerCanvasPoint(pointer);
    const cell = screenToCell(this.layout, canvasPoint.x, canvasPoint.y);
    if (!cell) return;
    const boardPoint = cellCenter(cell);

    if (pointer.rightButtonDown() && state.status !== 'running') {
      handleRightClick(bridge, state, cell);
      return;
    }

    if (state.status !== 'running' && state.placementMode === 'rock') {
      if (canPlaceRockAt(state, boardPoint.x, boardPoint.y)) {
        bridge.dispatch({ type: 'placeRock', x: boardPoint.x, y: boardPoint.y });
      }
      return;
    }
    if (state.status !== 'running' && state.placementMode === 'gem') {
      if (canPlaceGemAt(state, boardPoint.x, boardPoint.y)) {
        bridge.dispatch({ type: 'placeGem', x: boardPoint.x, y: boardPoint.y });
      }
      return;
    }
    if (state.status !== 'running' && state.placementMode === 'merge') {
      const gem = findGemAtCell(state, cell);
      if (gem) {
        if (state.mergeSourceGemId === null) {
          bridge.dispatch({ type: 'selectMergeSource', gemId: gem.id });
        } else if (state.mergeSourceGemId !== gem.id) {
          bridge.dispatch({ type: 'mergeGems', targetGemId: gem.id });
        }
      }
      return;
    }
    const missilePoint = screenToBoard(this.layout, canvasPoint.x, canvasPoint.y);
    if (missilePoint) {
      bridge.dispatch({ type: 'fireMissile', x: missilePoint.x, y: missilePoint.y });
    }
  }

  private clearHover(): void {
    this.hoverCell = null;
    this.input.manager.canvas.style.cursor = 'default';
  }

  private drawBoard(state: GameState): void {
    const g = this.board;
    const overlay = this.boardOverlay;
    g.clear();
    overlay.clear();
    g.fillGradientStyle(0x07111e, 0x0a1020, 0x050812, 0x060a13, 1);
    g.fillRect(0, 0, this.scale.width, this.scale.height);
    g.fillStyle(0x071827, 0.96);
    g.fillRect(this.layout.left, this.layout.top, this.layout.width, this.layout.height);

    if (this.assetsReady) {
      this.updateHexTerrain(state.pathNav.pathCells);
      drawCheckpointRoute(overlay, this.layout, state.pathNav.checkpoints);
      drawPathOverlay(overlay, this.layout, state.pathNav);
      drawPlacementPreview(overlay, this.layout, state, this.hoverCell);
    }
  }

  private updateHexTerrain(pathCells: ReadonlySet<string>): void {
    const liveKeys = new Set<string>();
    const tileW = this.layout.hexRadius * Math.sqrt(3);
    const tileH = this.layout.hexRadius * 2;
    for (let r = 0; r < BOARD_HEIGHT; r++) {
      for (let q = 0; q < BOARD_WIDTH; q++) {
        const key = `${q},${r}`;
        liveKeys.add(key);
        const onPath = pathCells.has(key);
        const isGemCell = cellParity(q, r) === 'gem';
        const texture = onPath ? 'hex-path-floor' : isGemCell ? 'hex-gem-floor' : 'hex-rock-floor';
        const point = cellToScreen(this.layout, { x: q, y: r });
        const sprite =
          this.terrainSprites.get(key) ??
          this.add.image(0, 0, texture).setOrigin(0.5, 0.5).setDepth(0.8);
        this.terrainSprites.set(key, sprite);
        sprite
          .setTexture(texture)
          .setPosition(point.x, point.y)
          .setDisplaySize(tileW, tileH)
          .setVisible(true);
      }
    }
    hideMissingSprites(this.terrainSprites, liveKeys);
  }

  private drawSprites(state: GameState): void {
    if (!this.assetsReady) return;
    this.updateWaypointMarkers(state.pathNav);
    this.updateRockSprites(state.rocks);
    this.updateGemSprites(state.gems, state.mergeSourceGemId);
    this.updateEnemySprites(state.enemies);
    this.drawEnemyBars(state.enemies);
  }

  private drawFx(state: GameState): void {
    const g = this.fx;
    g.clear();
    for (const projectile of state.projectiles) {
      if (!projectile.active) continue;
      const color = Phaser.Display.Color.HexStringToColor(projectile.color).color;
      const point = boardToScreen(this.layout, projectile);
      g.fillStyle(color, 0.95);
      g.fillCircle(point.x, point.y, Math.max(3, this.layout.hexRadius * 0.12));
    }
    if (
      this.hoverCell &&
      state.status !== 'running' &&
      state.placementMode === 'gem' &&
      state.selectedInventoryGemId !== null
    ) {
      const boardPoint = cellCenter(this.hoverCell);
      if (canPlaceGemAt(state, boardPoint.x, boardPoint.y)) {
        const inv = state.inventory.find((item) => item.id === state.selectedInventoryGemId);
        if (inv) {
          const stats = gemDefinitions[inv.family];
          const point = cellToScreen(this.layout, this.hoverCell);
          const color = Phaser.Display.Color.HexStringToColor(stats.color).color;
          g.lineStyle(2, color, 0.34);
          const range = stats.baseRange + (inv.level - 1) * 0.12;
          g.strokeCircle(point.x, point.y, rangeToPixels(this.layout, range));
        }
      }
    }
    for (const missile of state.missiles) drawMissile(g, this.layout, missile);
    for (const fx of state.fxEvents) drawFxPopup(g, this.layout, fx);
  }

  private updateWaypointMarkers(pathNav: GameState['pathNav']): void {
    const liveKeys = new Set<string>();
    const lastIndex = pathNav.checkpoints.length - 1;
    const size = this.layout.hexRadius * 0.78;

    for (let i = 0; i < pathNav.checkpoints.length; i++) {
      const cp = pathNav.checkpoints[i]!;
      const key = `${cp.x},${cp.y}`;
      liveKeys.add(key);
      const point = cellToScreen(this.layout, cp);

      let container = this.waypointMarkers.get(key);
      if (!container) {
        const ring = this.add.graphics();
        const label = this.add
          .text(0, 0, '', {
            fontFamily: 'Chakra Petch, monospace',
            fontSize: `${Math.max(11, Math.floor(this.layout.hexRadius * 0.55))}px`,
            color: '#ffffff',
            fontStyle: 'bold',
          })
          .setOrigin(0.5);
        container = this.add.container(0, 0, [ring, label]).setDepth(1.55);
        this.waypointMarkers.set(key, container);
      }

      const isStart = i === 0;
      const isFinish = i === lastIndex;
      const labelText = isStart ? 'S' : isFinish ? 'F' : String(i);
      const color = isFinish ? COLORS.red : isStart ? COLORS.green : 0xffd166;

      const ring = container.list[0] as Phaser.GameObjects.Graphics;
      ring.clear();
      ring.fillStyle(color, isStart || isFinish ? 0.28 : 0.18);
      ring.lineStyle(2, color, 0.95);
      ring.fillCircle(0, 0, size * 0.42);
      ring.strokeCircle(0, 0, size * 0.42);

      const text = container.list[1] as Phaser.GameObjects.Text;
      text.setText(labelText);
      text.setColor(isFinish ? '#ffd0da' : isStart ? '#d7ffe8' : '#fff1c2');

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
        this.add.image(0, 0, 'cosmic-rock').setOrigin(0.5, 0.72).setDepth(2.05);
      this.rockSprites.set(key, sprite);
      sprite
        .setPosition(point.x, point.y + this.layout.hexRadius * 0.12)
        .setDisplaySize(this.layout.hexRadius * 1.7, this.layout.hexRadius * 1.7)
        .setVisible(true);
    }
    hideMissingSprites(this.rockSprites, liveKeys);
  }

  private updateGemSprites(gems: readonly GemState[], mergeSourceId: number | null): void {
    const liveIds = new Set<number>();
    for (const gem of gems) {
      liveIds.add(gem.id);
      const point = boardToScreen(this.layout, gem);
      const texKey = gemTextureKey(gem.family, gem.level);
      const sprite =
        this.gemSprites.get(gem.id) ??
        this.add.image(0, 0, texKey).setOrigin(0.5, 0.78).setDepth(2.12);
      this.gemSprites.set(gem.id, sprite);
      const size = this.layout.hexRadius * (1.35 + gem.level * 0.05);
      const pulse = 1 + Math.sin(this.time.now / 180) * 0.04;
      sprite
        .setTexture(texKey)
        .setPosition(point.x, point.y + this.layout.hexRadius * 0.08)
        .setDisplaySize(size * pulse, size * pulse)
        .setVisible(true);
      if (gem.id === mergeSourceId) {
        sprite.setTint(0xfff4a3);
      } else {
        sprite.clearTint();
      }
    }
    hideMissingSprites(this.gemSprites, liveIds);
  }

  private updateEnemySprites(enemies: readonly EnemyState[]): void {
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
        this.add.sprite(0, 0, texKey, 0).setOrigin(0.5, 0.82).setDepth(2.18);
      this.enemySprites.set(enemy.id, sprite);
      const size = this.layout.hexRadius * (isBoss ? 2.5 : 1.75);
      sprite
        .setPosition(point.x, point.y + this.layout.hexRadius * 0.15)
        .setDisplaySize(size, size)
        .setVisible(true);
      if (this.anims.exists(animKey)) {
        if (!sprite.anims.isPlaying || sprite.anims.currentAnim?.key !== animKey) {
          sprite.play(animKey);
        }
      }
      if (enemy.slowUntil > 0) sprite.setTint(0x88ccff);
      else if (enemy.invisible) sprite.setAlpha(0.35);
      else if (enemy.flying) sprite.setTint(0xc4f0ff);
      else {
        sprite.clearTint();
        sprite.setAlpha(1);
      }
    }
    hideMissingSprites(this.enemySprites, liveIds);
  }

  private drawEnemyBars(enemies: readonly EnemyState[]): void {
    const g = this.boardOverlay;
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const point = boardToScreen(this.layout, enemy);
      const isBoss = BOSS_ENEMY_IDS.includes(enemy.definitionId);
      const barW = this.layout.hexRadius * (isBoss ? 1.2 : 0.85);
      g.fillStyle(0x02050a, 0.7);
      g.fillRect(point.x - barW / 2, point.y - this.layout.hexRadius * 0.75, barW, 4);
      g.fillStyle(COLORS.green, 0.95);
      g.fillRect(
        point.x - barW / 2,
        point.y - this.layout.hexRadius * 0.75,
        barW * Math.max(0, enemy.hp / enemy.maxHp),
        4,
      );
      if (enemy.maxShield > 0) {
        g.fillStyle(COLORS.shield, 0.92);
        g.fillRect(
          point.x - barW / 2,
          point.y - this.layout.hexRadius * 0.62,
          barW * Math.max(0, enemy.shield / enemy.maxShield),
          3,
        );
      }
    }
  }
}


function handleRightClick(
  bridge: ReturnType<typeof getBridge>,
  state: GameState,
  cell: Vec2,
): void {
  const rock = state.rocks.find((r) => r.x === cell.x && r.y === cell.y);
  if (rock) {
    const center = cellCenter(cell);
    bridge.dispatch({ type: 'sellRock', x: center.x, y: center.y });
    return;
  }
  const gem = findGemAtCell(state, cell);
  if (gem) {
    if (state.placementMode === 'gem') {
      bridge.dispatch({ type: 'pickUpGem', gemId: gem.id });
    } else {
      bridge.dispatch({ type: 'sellGem', gemId: gem.id });
    }
  }
}

function findGemAtCell(state: GameState, cell: Vec2): GemState | undefined {
  return state.gems.find((g) => {
    const gemCell = worldToHex(g.x, g.y);
    return gemCell.x === cell.x && gemCell.y === cell.y;
  });
}

function hideMissingSprites<T extends string | number>(
  sprites: Map<T, Phaser.GameObjects.Image | Phaser.GameObjects.Sprite>,
  liveIds: ReadonlySet<T>,
): void {
  for (const [id, sprite] of sprites) {
    if (!liveIds.has(id)) sprite.setVisible(false);
  }
}

function hexScreenCorners(layout: BoardLayout, cell: Vec2): Vec2[] {
  return hexPixelCorners(cell.x, cell.y, layout.hexRadius).map((corner) => ({
    x: layout.left + layout.padX + corner.x,
    y: layout.top + layout.padY + corner.y,
  }));
}

function drawHexShape(
  g: Phaser.GameObjects.Graphics,
  corners: Vec2[],
  fill: number,
  fillAlpha: number,
  stroke?: number,
  strokeAlpha = 0.35,
): void {
  g.fillStyle(fill, fillAlpha);
  g.beginPath();
  g.moveTo(corners[0]!.x, corners[0]!.y);
  for (let i = 1; i < corners.length; i++) g.lineTo(corners[i]!.x, corners[i]!.y);
  g.closePath();
  g.fillPath();
  if (stroke !== undefined) {
    g.lineStyle(1, stroke, strokeAlpha);
    g.strokePath();
  }
}


function drawCheckpointRoute(
  g: Phaser.GameObjects.Graphics,
  layout: BoardLayout,
  checkpoints: readonly Vec2[],
): void {
  if (checkpoints.length < 2) return;
  g.lineStyle(3, COLORS.path, 0.28);
  for (let i = 0; i < checkpoints.length - 1; i++) {
    const a = cellToScreen(layout, checkpoints[i]!);
    const b = cellToScreen(layout, checkpoints[i + 1]!);
    g.beginPath();
    g.moveTo(a.x, a.y);
    g.lineTo(b.x, b.y);
    g.strokePath();
  }
  for (const cp of checkpoints) {
    const point = cellToScreen(layout, cp);
    g.fillStyle(COLORS.path, 0.55);
    g.fillCircle(point.x, point.y, Math.max(4, layout.hexRadius * 0.08));
  }
}

function drawPathOverlay(
  g: Phaser.GameObjects.Graphics,
  layout: BoardLayout,
  pathNav: GameState['pathNav'],
): void {
  for (const key of pathNav.pathCells) {
    const [x, y] = key.split(',').map(Number);
    drawHexShape(g, hexScreenCorners(layout, { x, y }), COLORS.path, 0.08, undefined);
  }
}

function drawPlacementPreview(
  g: Phaser.GameObjects.Graphics,
  layout: BoardLayout,
  state: GameState,
  hoverCell: Vec2 | null,
): void {
  if (!hoverCell || state.status === 'running') return;
  const boardPoint = cellCenter(hoverCell);
  const corners = hexScreenCorners(layout, hoverCell);
  if (state.placementMode === 'rock' && canPlaceRockAt(state, boardPoint.x, boardPoint.y)) {
    drawHexShape(g, corners, COLORS.green, 0.25, COLORS.green, 0.85);
  }
  if (state.placementMode === 'gem' && canPlaceGemAt(state, boardPoint.x, boardPoint.y)) {
    drawHexShape(g, corners, COLORS.green, 0.18, COLORS.green, 0.75);
  }
}

function drawMissile(
  g: Phaser.GameObjects.Graphics,
  layout: BoardLayout,
  missile: MissileState,
): void {
  const point = boardToScreen(layout, missile);
  const radius = rangeToPixels(layout, missile.radius);
  if (missile.active) {
    g.lineStyle(2, 0xfff4a3, 0.75);
    g.strokeCircle(point.x, point.y, Math.max(6, radius * (1 - missile.impactIn / 0.24)));
    return;
  }
  g.fillStyle(0xfff4a3, Math.max(0, missile.life / 0.42) * 0.18);
  g.fillCircle(point.x, point.y, radius);
  g.lineStyle(3, 0xffcf6b, Math.max(0, missile.life / 0.42) * 0.8);
  g.strokeCircle(point.x, point.y, radius);
}

function drawFxPopup(g: Phaser.GameObjects.Graphics, layout: BoardLayout, fx: FxEvent): void {
  const point = boardToScreen(layout, { x: fx.x, y: fx.y });
  const alpha = Math.min(1, fx.life);
  const color =
    fx.kind === 'merge' ? 0xfff4a3 : fx.kind === 'quest' ? 0xc084fc : 0x7fffb2;
  g.fillStyle(color, alpha * 0.25);
  g.fillCircle(point.x, point.y - layout.hexRadius * 0.25, layout.hexRadius * 0.45);
  g.lineStyle(2, color, alpha * 0.85);
  g.strokeCircle(point.x, point.y - layout.hexRadius * 0.25, layout.hexRadius * 0.28);
}
