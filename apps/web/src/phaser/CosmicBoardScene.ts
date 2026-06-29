import Phaser from 'phaser';
import { BOARD_HEIGHT, BOARD_WIDTH, gemDefinitions } from '../game/content';
import { cellParity } from '../game/boardParity';
import { canPlaceGemAt, canPlaceRockAt } from '../game/engine';
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
  TERRAIN_FRAMES,
  enemyWalkAssetPath,
  enemyWalkTextureKey,
  gemAssetPath,
  gemTextureKey,
} from './assetManifest';
import { getBridge } from './bridge';

interface BoardLayout {
  left: number;
  top: number;
  cell: number;
  width: number;
  height: number;
}

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
  private terrainSprites: Phaser.GameObjects.Image[] = [];
  private rockSprites = new Map<string, Phaser.GameObjects.Image>();
  private gemSprites = new Map<number, Phaser.GameObjects.Image>();
  private enemySprites = new Map<number, Phaser.GameObjects.Sprite>();
  private markerSprites: {
    spawn?: Phaser.GameObjects.Image;
    goal?: Phaser.GameObjects.Image;
  } = {};
  private hoverBoardPoint: Vec2 | null = null;
  private layout: BoardLayout = { left: 0, top: 0, cell: 40, width: 640, height: 400 };
  private assetsReady = false;

  constructor() {
    super('cosmic-board');
  }

  preload(): void {
    this.load.image('terrain-void', ASSET_PATHS.terrainVoid);
    this.load.image('terrain-gem', ASSET_PATHS.terrainGem);
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
    this.registerTerrainFrames();
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

  private registerTerrainFrames(): void {
    registerTilesetFrames(this.textures, 'terrain-void', 'void');
    registerTilesetFrames(this.textures, 'terrain-gem', 'gem');
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

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    const state = getBridge().getState();
    const boardPoint = screenToBoard(this.layout, pointer.x, pointer.y);
    this.hoverBoardPoint = boardPoint;
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
    const boardPoint = screenToBoard(this.layout, pointer.x, pointer.y);
    if (!boardPoint) return;

    if (pointer.rightButtonDown() && state.status !== 'running') {
      handleRightClick(bridge, state, boardPoint);
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
      const gem = findGemAtCell(state, boardPoint);
      if (gem) {
        if (state.mergeSourceGemId === null) {
          bridge.dispatch({ type: 'selectMergeSource', gemId: gem.id });
        } else if (state.mergeSourceGemId !== gem.id) {
          bridge.dispatch({ type: 'mergeGems', targetGemId: gem.id });
        }
      }
      return;
    }
    bridge.dispatch({ type: 'fireMissile', x: boardPoint.x, y: boardPoint.y });
  }

  private clearHover(): void {
    this.hoverBoardPoint = null;
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
    g.lineStyle(1, COLORS.grid, 0.35);
    for (let x = 0; x <= BOARD_WIDTH; x++) {
      const px = this.layout.left + x * this.layout.cell;
      g.lineBetween(px, this.layout.top, px, this.layout.top + this.layout.height);
    }
    for (let y = 0; y <= BOARD_HEIGHT; y++) {
      const py = this.layout.top + y * this.layout.cell;
      g.lineBetween(this.layout.left, py, this.layout.left + this.layout.width, py);
    }

    if (this.assetsReady) {
      this.updateTerrainSprites(state.pathNav.pathCells);
      drawPathOverlay(overlay, this.layout, state.pathNav);
      drawPlacementPreview(overlay, this.layout, state, this.hoverBoardPoint);
    }
  }

  private drawSprites(state: GameState): void {
    if (!this.assetsReady) return;
    this.updateMarkers(state.pathNav);
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
      g.fillCircle(point.x, point.y, Math.max(3, this.layout.cell * 0.07));
    }
    if (
      this.hoverBoardPoint &&
      state.status !== 'running' &&
      state.placementMode === 'gem' &&
      state.selectedInventoryGemId !== null &&
      canPlaceGemAt(state, this.hoverBoardPoint.x, this.hoverBoardPoint.y)
    ) {
      const inv = state.inventory.find((item) => item.id === state.selectedInventoryGemId);
      if (inv) {
        const stats = gemDefinitions[inv.family];
        const point = boardToScreen(this.layout, this.hoverBoardPoint);
        const color = Phaser.Display.Color.HexStringToColor(stats.color).color;
        g.lineStyle(2, color, 0.34);
        const range = stats.baseRange + (inv.level - 1) * 0.12;
        g.strokeCircle(point.x, point.y, range * this.layout.cell);
      }
    }
    for (const missile of state.missiles) drawMissile(g, this.layout, missile);
    for (const fx of state.fxEvents) drawFxPopup(g, this.layout, fx);
  }

  private updateTerrainSprites(pathCells: ReadonlySet<string>): void {
    const totalCells = BOARD_WIDTH * BOARD_HEIGHT;
    while (this.terrainSprites.length < totalCells) {
      this.terrainSprites.push(
        this.add.image(0, 0, 'terrain-void', TERRAIN_FRAMES.rockCell).setDepth(1.1).setAlpha(0.95),
      );
    }

    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        const index = y * BOARD_WIDTH + x;
        const sprite = this.terrainSprites[index];
        const isGemCell = cellParity(x, y) === 'gem';
        const frame = isGemCell ? TERRAIN_FRAMES.gemCell : TERRAIN_FRAMES.rockCell;
        const textureKey = isGemCell ? 'terrain-gem' : 'terrain-void';
        const point = boardToScreen(this.layout, { x, y });
        sprite
          .setTexture(textureKey, frame)
          .setPosition(point.x, point.y)
          .setDisplaySize(this.layout.cell, this.layout.cell)
          .setVisible(true);
        if (pathCells.has(`${x},${y}`)) {
          sprite.setTint(0xb8ecff);
          sprite.setAlpha(0.88);
        } else {
          sprite.clearTint();
          sprite.setAlpha(0.95);
        }
      }
    }
  }

  private updateMarkers(pathNav: GameState['pathNav']): void {
    const spawnPoint = boardToScreen(this.layout, pathNav.spawnCell);
    const goalPoint = boardToScreen(this.layout, pathNav.goalCell);
    this.markerSprites.spawn ??= this.add
      .image(spawnPoint.x, spawnPoint.y, 'spawn-portal')
      .setDepth(1.5);
    this.markerSprites.goal ??= this.add.image(goalPoint.x, goalPoint.y, 'goal-nexus').setDepth(1.5);
    const markerSize = this.layout.cell * 0.55;
    this.markerSprites.spawn
      .setPosition(spawnPoint.x, spawnPoint.y)
      .setDisplaySize(markerSize, markerSize)
      .setVisible(true);
    this.markerSprites.goal
      .setPosition(goalPoint.x, goalPoint.y)
      .setDisplaySize(markerSize, markerSize)
      .setVisible(true);
  }

  private updateRockSprites(rocks: GameState['rocks']): void {
    const liveKeys = new Set<string>();
    for (const rock of rocks) {
      const key = `${rock.x},${rock.y}`;
      liveKeys.add(key);
      const point = boardToScreen(this.layout, rock);
      const sprite =
        this.rockSprites.get(key) ??
        this.add.image(0, 0, 'cosmic-rock').setOrigin(0.5, 0.72).setDepth(2.05);
      this.rockSprites.set(key, sprite);
      sprite
        .setPosition(point.x, point.y + this.layout.cell * 0.08)
        .setDisplaySize(this.layout.cell * 0.95, this.layout.cell * 0.95)
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
      const size = this.layout.cell * (0.85 + gem.level * 0.04);
      const pulse = 1 + Math.sin(this.time.now / 180) * 0.04;
      sprite
        .setTexture(texKey)
        .setPosition(point.x, point.y + this.layout.cell * 0.1)
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
      const size = this.layout.cell * (isBoss ? 1.35 : 0.95);
      sprite
        .setPosition(point.x, point.y + this.layout.cell * 0.12)
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
      const barW = this.layout.cell * (isBoss ? 0.7 : 0.5);
      g.fillStyle(0x02050a, 0.7);
      g.fillRect(point.x - barW / 2, point.y - this.layout.cell * 0.42, barW, 4);
      g.fillStyle(COLORS.green, 0.95);
      g.fillRect(
        point.x - barW / 2,
        point.y - this.layout.cell * 0.42,
        barW * Math.max(0, enemy.hp / enemy.maxHp),
        4,
      );
      if (enemy.maxShield > 0) {
        g.fillStyle(COLORS.shield, 0.92);
        g.fillRect(
          point.x - barW / 2,
          point.y - this.layout.cell * 0.35,
          barW * Math.max(0, enemy.shield / enemy.maxShield),
          3,
        );
      }
    }
  }
}

function registerTilesetFrames(
  textures: Phaser.Textures.TextureManager,
  textureKey: string,
  prefix: string,
): void {
  if (!textures.exists(textureKey)) return;
  const texture = textures.get(textureKey);
  const cols = 4;
  const rows = 4;
  const tile = 32;
  for (let i = 0; i < cols * rows; i++) {
    const frameName = `${prefix}-${i}`;
    if (texture.has(frameName)) continue;
    const x = (i % cols) * tile;
    const y = Math.floor(i / cols) * tile;
    texture.add(frameName, 0, x, y, tile, tile);
  }
}

function handleRightClick(
  bridge: ReturnType<typeof getBridge>,
  state: GameState,
  boardPoint: Vec2,
): void {
  const cell = { x: Math.floor(boardPoint.x), y: Math.floor(boardPoint.y) };
  const rock = state.rocks.find((r) => r.x === cell.x && r.y === cell.y);
  if (rock) {
    bridge.dispatch({ type: 'sellRock', x: cell.x, y: cell.y });
    return;
  }
  const gem = findGemAtCell(state, boardPoint);
  if (gem) {
    if (state.placementMode === 'gem') {
      bridge.dispatch({ type: 'pickUpGem', gemId: gem.id });
    } else {
      bridge.dispatch({ type: 'sellGem', gemId: gem.id });
    }
  }
}

function findGemAtCell(state: GameState, boardPoint: Vec2): GemState | undefined {
  const cx = Math.floor(boardPoint.x);
  const cy = Math.floor(boardPoint.y);
  return state.gems.find((g) => Math.floor(g.x) === cx && Math.floor(g.y) === cy);
}

function hideMissingSprites<T extends string | number>(
  sprites: Map<T, Phaser.GameObjects.Image | Phaser.GameObjects.Sprite>,
  liveIds: ReadonlySet<T>,
): void {
  for (const [id, sprite] of sprites) {
    if (!liveIds.has(id)) sprite.setVisible(false);
  }
}

function computeLayout(width: number, height: number): BoardLayout {
  const reservedTop = width >= 980 ? 28 : 18;
  const reservedBottom = width >= 980 ? 24 : 18;
  const reservedRight = width >= 980 ? 430 : 0;
  const availableWidth = Math.max(320, width - reservedRight - 32);
  const availableHeight = Math.max(280, height - reservedTop - reservedBottom);
  const cell = Math.floor(Math.min(availableWidth / BOARD_WIDTH, availableHeight / BOARD_HEIGHT));
  return {
    left: Math.max(16, Math.floor((availableWidth - cell * BOARD_WIDTH) / 2)),
    top: reservedTop + Math.max(0, Math.floor((availableHeight - cell * BOARD_HEIGHT) / 2)),
    cell,
    width: cell * BOARD_WIDTH,
    height: cell * BOARD_HEIGHT,
  };
}

function drawPathOverlay(
  g: Phaser.GameObjects.Graphics,
  layout: BoardLayout,
  pathNav: GameState['pathNav'],
): void {
  g.fillStyle(COLORS.path, 0.1);
  for (const key of pathNav.pathCells) {
    const [x, y] = key.split(',').map(Number);
    g.fillRect(layout.left + x * layout.cell, layout.top + y * layout.cell, layout.cell, layout.cell);
  }
}

function drawPlacementPreview(
  g: Phaser.GameObjects.Graphics,
  layout: BoardLayout,
  state: GameState,
  hover: Vec2 | null,
): void {
  if (!hover || state.status === 'running') return;
  const cell = { x: Math.floor(hover.x), y: Math.floor(hover.y) };
  const px = layout.left + cell.x * layout.cell;
  const py = layout.top + cell.y * layout.cell;
  if (state.placementMode === 'rock' && canPlaceRockAt(state, hover.x, hover.y)) {
    g.fillStyle(COLORS.green, 0.25);
    g.fillRect(px, py, layout.cell, layout.cell);
    g.lineStyle(2, COLORS.green, 0.8);
    g.strokeRect(px + 2, py + 2, layout.cell - 4, layout.cell - 4);
  }
  if (state.placementMode === 'gem' && canPlaceGemAt(state, hover.x, hover.y)) {
    g.fillStyle(COLORS.green, 0.2);
    g.fillRect(px, py, layout.cell, layout.cell);
    g.lineStyle(2, COLORS.green, 0.7);
    g.strokeRect(px + 2, py + 2, layout.cell - 4, layout.cell - 4);
  }
}

function drawMissile(
  g: Phaser.GameObjects.Graphics,
  layout: BoardLayout,
  missile: MissileState,
): void {
  const point = boardToScreen(layout, missile);
  const radius = missile.radius * layout.cell;
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
  g.fillCircle(point.x, point.y - layout.cell * 0.2, layout.cell * 0.35);
  g.lineStyle(2, color, alpha * 0.85);
  g.strokeCircle(point.x, point.y - layout.cell * 0.2, layout.cell * 0.22);
}

function boardToScreen(layout: BoardLayout, point: Vec2): Vec2 {
  return {
    x: layout.left + (point.x + 0.5) * layout.cell,
    y: layout.top + (point.y + 0.5) * layout.cell,
  };
}

function screenToBoard(layout: BoardLayout, x: number, y: number): Vec2 | null {
  if (
    x < layout.left ||
    y < layout.top ||
    x > layout.left + layout.width ||
    y > layout.top + layout.height
  ) {
    return null;
  }
  return {
    x: (x - layout.left) / layout.cell - 0.5,
    y: (y - layout.top) / layout.cell - 0.5,
  };
}
