import Phaser from 'phaser';
import { BOARD_HEIGHT, BOARD_WIDTH, getArea, getTower } from '../game/content';
import { buildZoneCells, isInBuildZone } from '../game/pathBuild';
import type {
  EnemyState,
  GameState,
  MissileState,
  ProjectileState,
  TowerState,
  Vec2,
} from '../game/types';
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
  buildZone: 0x0e2534,
  text: '#eef7ff',
  red: 0xff5a7a,
  green: 0x7fffb2,
  shield: 0xbd9cff,
};

const ART_KEY = 'terrain-towers-enemies';

const TERRAIN_FRAMES = {
  grass: { x: 8, y: 38, width: 248, height: 146 },
  path: { x: 272, y: 42, width: 244, height: 150 },
  forest: { x: 716, y: 216, width: 244, height: 160 },
  rock: { x: 268, y: 216, width: 242, height: 162 },
  water: { x: 730, y: 42, width: 242, height: 150 },
} as const;

const TOWER_FRAMES = {
  kinetic: { frame: 'tower-archer', x: 1012, y: 33, width: 128, height: 166 },
  nature: { frame: 'tower-flame', x: 1050, y: 556, width: 118, height: 154 },
  arcane: { frame: 'tower-crystal', x: 1184, y: 360, width: 132, height: 178 },
  nova: { frame: 'tower-cannon', x: 1180, y: 222, width: 130, height: 152 },
} as const;

const ENEMY_FRAMES = {
  scout: { frame: 'enemy-scout', x: 20, y: 612, width: 74, height: 90 },
  trooper: { frame: 'enemy-trooper', x: 205, y: 612, width: 82, height: 92 },
  bulwark: { frame: 'enemy-bulwark', x: 616, y: 602, width: 106, height: 114 },
  striker: { frame: 'enemy-striker', x: 912, y: 725, width: 108, height: 82 },
  warden: { frame: 'enemy-warden', x: 220, y: 762, width: 178, height: 166 },
  vanguard: { frame: 'enemy-vanguard', x: 522, y: 742, width: 226, height: 194 },
} as const;

export class CosmicBoardScene extends Phaser.Scene {
  private board!: Phaser.GameObjects.Graphics;
  private boardOverlay!: Phaser.GameObjects.Graphics;
  private actors!: Phaser.GameObjects.Graphics;
  private fx!: Phaser.GameObjects.Graphics;
  private terrainSprites: Phaser.GameObjects.Image[] = [];
  private towerSprites = new Map<number, Phaser.GameObjects.Image>();
  private enemySprites = new Map<number, Phaser.GameObjects.Image>();
  private hoverBoardPoint: Vec2 | null = null;
  private layout: BoardLayout = { left: 0, top: 0, cell: 40, width: 640, height: 400 };

  constructor() {
    super('cosmic-board');
  }

  preload(): void {
    this.load.image(ART_KEY, '/assets/terrain-towers-enemies.png');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.board = this.add.graphics().setDepth(1);
    this.boardOverlay = this.add.graphics().setDepth(1.35);
    this.actors = this.add.graphics().setDepth(2);
    this.fx = this.add.graphics().setDepth(3);
    registerArtFrames(this.textures);
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
    this.drawActors(state);
    this.drawFx(state);
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    const state = getBridge().getState();
    const boardPoint = screenToBoard(this.layout, pointer.x, pointer.y);
    this.hoverBoardPoint = boardPoint;
    const canPlace =
      boardPoint !== null &&
      state.status !== 'running' &&
      state.selectedTowerId !== null &&
      isInBuildZone(
        boardPoint.x,
        boardPoint.y,
        getArea(state.areaId).pathNav.pathCells,
        BOARD_WIDTH,
        BOARD_HEIGHT,
      );
    this.input.manager.canvas.style.cursor = canPlace ? 'pointer' : 'crosshair';
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    const bridge = getBridge();
    const state = bridge.getState();
    const boardPoint = screenToBoard(this.layout, pointer.x, pointer.y);
    if (!boardPoint) return;
    if (
      state.status !== 'running' &&
      state.selectedTowerId &&
      isInBuildZone(
        boardPoint.x,
        boardPoint.y,
        getArea(state.areaId).pathNav.pathCells,
        BOARD_WIDTH,
        BOARD_HEIGHT,
      )
    ) {
      bridge.dispatch({
        type: 'placeTower',
        x: boardPoint.x,
        y: boardPoint.y,
        towerId: state.selectedTowerId,
      });
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
    const area = getArea(state.areaId);
    g.clear();
    overlay.clear();
    g.fillGradientStyle(0x07111e, 0x0a1020, 0x050812, 0x060a13, 1);
    g.fillRect(0, 0, this.scale.width, this.scale.height);

    g.fillStyle(0x071827, 0.96);
    g.fillRect(this.layout.left, this.layout.top, this.layout.width, this.layout.height);
    g.lineStyle(1, COLORS.grid, 0.42);
    for (let x = 0; x <= BOARD_WIDTH; x++) {
      const px = this.layout.left + x * this.layout.cell;
      g.lineBetween(px, this.layout.top, px, this.layout.top + this.layout.height);
    }
    for (let y = 0; y <= BOARD_HEIGHT; y++) {
      const py = this.layout.top + y * this.layout.cell;
      g.lineBetween(this.layout.left, py, this.layout.left + this.layout.width, py);
    }

    this.updateTerrainSprites(area.pathNav.pathCells);
    drawBuildZone(overlay, this.layout, area.pathNav.pathCells);
    drawPath(overlay, this.layout, area.path);
  }

  private drawActors(state: GameState): void {
    const g = this.actors;
    g.clear();
    this.updateTowerSprites(state.towers);
    this.updateEnemySprites(state.enemies);
    for (const enemy of state.enemies) if (enemy.alive) drawEnemyBars(g, this.layout, enemy);
    for (const projectile of state.projectiles) drawProjectile(g, this.layout, projectile);
  }

  private drawFx(state: GameState): void {
    const g = this.fx;
    g.clear();
    const selectedTower = state.selectedTowerId ? getTower(state.selectedTowerId) : null;
    if (
      selectedTower &&
      this.hoverBoardPoint &&
      state.status !== 'running' &&
      isInBuildZone(
        this.hoverBoardPoint.x,
        this.hoverBoardPoint.y,
        getArea(state.areaId).pathNav.pathCells,
        BOARD_WIDTH,
        BOARD_HEIGHT,
      )
    ) {
      const point = boardToScreen(this.layout, this.hoverBoardPoint);
      g.lineStyle(2, Phaser.Display.Color.HexStringToColor(selectedTower.color).color, 0.34);
      g.strokeCircle(point.x, point.y, selectedTower.range * this.layout.cell);
    }
    for (const missile of state.missiles) drawMissile(g, this.layout, missile);
  }

  private updateTerrainSprites(pathCells: ReadonlySet<string>): void {
    const totalCells = BOARD_WIDTH * BOARD_HEIGHT;
    while (this.terrainSprites.length < totalCells) {
      this.terrainSprites.push(
        this.add
          .image(0, 0, ART_KEY, 'terrain-grass')
          .setOrigin(0.5, 0.62)
          .setDepth(1.12)
          .setAlpha(0.9),
      );
    }

    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        const index = y * BOARD_WIDTH + x;
        const sprite = this.terrainSprites[index];
        const frame = terrainFrameForCell(x, y, pathCells);
        const point = boardToScreen(this.layout, { x, y });
        sprite
          .setFrame(frame)
          .setPosition(point.x, point.y + this.layout.cell * 0.06)
          .setDisplaySize(this.layout.cell * 1.32, this.layout.cell * 1.0)
          .setVisible(true);
      }
    }
  }

  private updateTowerSprites(towers: readonly TowerState[]): void {
    const liveIds = new Set<number>();
    for (const tower of towers) {
      liveIds.add(tower.id);
      const point = boardToScreen(this.layout, tower);
      const frame = TOWER_FRAMES[tower.towerId].frame;
      const sprite =
        this.towerSprites.get(tower.id) ??
        this.add.image(0, 0, ART_KEY, frame).setOrigin(0.5, 0.82).setDepth(2.12);
      this.towerSprites.set(tower.id, sprite);
      scaleToHeight(sprite, this.layout.cell * 1.35);
      sprite.setFrame(frame).setPosition(point.x, point.y + this.layout.cell * 0.24).setVisible(true);
    }
    hideMissingSprites(this.towerSprites, liveIds);
  }

  private updateEnemySprites(enemies: readonly EnemyState[]): void {
    const liveIds = new Set<number>();
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      liveIds.add(enemy.id);
      const point = boardToScreen(this.layout, enemy);
      const frame = ENEMY_FRAMES[enemy.definitionId].frame;
      const sprite =
        this.enemySprites.get(enemy.id) ??
        this.add.image(0, 0, ART_KEY, frame).setOrigin(0.5, 0.86).setDepth(2.18);
      this.enemySprites.set(enemy.id, sprite);
      const height = this.layout.cell * (enemy.definitionId === 'vanguard' ? 1.28 : 0.98);
      scaleToHeight(sprite, height);
      sprite.setFrame(frame).setPosition(point.x, point.y + this.layout.cell * 0.22).setVisible(true);
    }
    hideMissingSprites(this.enemySprites, liveIds);
  }
}

function registerArtFrames(textures: Phaser.Textures.TextureManager): void {
  const texture = textures.get(ART_KEY);
  for (const [name, frame] of Object.entries(TERRAIN_FRAMES)) {
    if (!texture.has(`terrain-${name}`)) {
      texture.add(`terrain-${name}`, 0, frame.x, frame.y, frame.width, frame.height);
    }
  }
  for (const tower of Object.values(TOWER_FRAMES)) {
    if (!texture.has(tower.frame)) texture.add(tower.frame, 0, tower.x, tower.y, tower.width, tower.height);
  }
  for (const enemy of Object.values(ENEMY_FRAMES)) {
    if (!texture.has(enemy.frame)) texture.add(enemy.frame, 0, enemy.x, enemy.y, enemy.width, enemy.height);
  }
}

function terrainFrameForCell(x: number, y: number, pathCells: ReadonlySet<string>): string {
  if (pathCells.has(`${x},${y}`)) return 'terrain-path';
  const hash = (x * 17 + y * 31) % 19;
  if (hash === 0) return 'terrain-water';
  if (hash <= 2) return 'terrain-forest';
  if (hash <= 4) return 'terrain-rock';
  return 'terrain-grass';
}

function scaleToHeight(sprite: Phaser.GameObjects.Image, height: number): void {
  const frame = sprite.frame;
  sprite.setDisplaySize((height * frame.width) / frame.height, height);
}

function hideMissingSprites(
  sprites: Map<number, Phaser.GameObjects.Image>,
  liveIds: ReadonlySet<number>,
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

function drawBuildZone(
  g: Phaser.GameObjects.Graphics,
  layout: BoardLayout,
  pathCells: ReadonlySet<string>,
): void {
  const cells = buildZoneCells(pathCells, BOARD_WIDTH, BOARD_HEIGHT);
  g.fillStyle(COLORS.buildZone, 0.32);
  for (const cell of cells) {
    const left = layout.left + cell.x * layout.cell;
    const top = layout.top + cell.y * layout.cell;
    g.fillRect(left, top, layout.cell, layout.cell);
  }
}

function drawPath(
  g: Phaser.GameObjects.Graphics,
  layout: BoardLayout,
  path: readonly Vec2[],
): void {
  g.lineStyle(Math.max(10, layout.cell * 0.28), COLORS.path, 0.18);
  strokePath(g, layout, path);
  g.lineStyle(Math.max(4, layout.cell * 0.1), COLORS.path, 0.74);
  strokePath(g, layout, path);
  const start = boardToScreen(layout, path[0]);
  const end = boardToScreen(layout, path[path.length - 1]);
  g.fillStyle(COLORS.green, 0.9);
  g.fillCircle(start.x, start.y, layout.cell * 0.18);
  g.fillStyle(COLORS.red, 0.9);
  g.fillCircle(end.x, end.y, layout.cell * 0.18);
}

function strokePath(
  g: Phaser.GameObjects.Graphics,
  layout: BoardLayout,
  path: readonly Vec2[],
): void {
  g.beginPath();
  const start = boardToScreen(layout, path[0]);
  g.moveTo(start.x, start.y);
  for (let index = 1; index < path.length; index++) {
    const point = boardToScreen(layout, path[index]);
    g.lineTo(point.x, point.y);
  }
  g.strokePath();
}

function drawEnemyBars(g: Phaser.GameObjects.Graphics, layout: BoardLayout, enemy: EnemyState): void {
  const point = boardToScreen(layout, enemy);
  const radius = layout.cell * (enemy.maxShield > 0 ? 0.25 : 0.21);
  if (enemy.shield > 0) {
    g.lineStyle(3, COLORS.shield, 0.86);
    g.strokeCircle(point.x, point.y, radius + layout.cell * 0.08);
  }
  g.fillStyle(0x02050a, 0.7);
  g.fillRect(point.x - layout.cell * 0.28, point.y - layout.cell * 0.42, layout.cell * 0.56, 4);
  g.fillStyle(COLORS.green, 0.95);
  g.fillRect(
    point.x - layout.cell * 0.28,
    point.y - layout.cell * 0.42,
    layout.cell * 0.56 * Math.max(0, enemy.hp / enemy.maxHp),
    4,
  );
  if (enemy.maxShield > 0) {
    g.fillStyle(COLORS.shield, 0.92);
    g.fillRect(
      point.x - layout.cell * 0.28,
      point.y - layout.cell * 0.35,
      layout.cell * 0.56 * Math.max(0, enemy.shield / enemy.maxShield),
      3,
    );
  }
}

function drawProjectile(
  g: Phaser.GameObjects.Graphics,
  layout: BoardLayout,
  projectile: ProjectileState,
): void {
  const color = Phaser.Display.Color.HexStringToColor(projectile.color).color;
  const point = boardToScreen(layout, projectile);
  g.fillStyle(color, 0.95);
  g.fillCircle(point.x, point.y, Math.max(3, layout.cell * 0.07));
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
