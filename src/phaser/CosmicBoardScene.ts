import Phaser from 'phaser';
import { BOARD_HEIGHT, BOARD_WIDTH, gemDefinitions } from '../game/content';
import { cellParity } from '../game/boardParity';
import { canPlaceGemAt, canPlaceRockAt } from '../game/engine';
import type {
  EnemyState,
  GameState,
  GemFamilyId,
  GemLevel,
  GemState,
  MissileState,
  ProjectileState,
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
  rockCell: 0x0a1828,
  gemCell: 0x12283a,
  text: '#eef7ff',
  red: 0xff5a7a,
  green: 0x7fffb2,
  shield: 0xbd9cff,
};

const GEM_SHAPES: Record<GemFamilyId, 'diamond' | 'hex' | 'circle' | 'square' | 'star'> = {
  kinetic: 'diamond',
  verdant: 'hex',
  arcane: 'circle',
  nova: 'square',
  prism: 'star',
};

export class CosmicBoardScene extends Phaser.Scene {
  private board!: Phaser.GameObjects.Graphics;
  private boardOverlay!: Phaser.GameObjects.Graphics;
  private actors!: Phaser.GameObjects.Graphics;
  private fx!: Phaser.GameObjects.Graphics;
  private hoverBoardPoint: Vec2 | null = null;
  private layout: BoardLayout = { left: 0, top: 0, cell: 40, width: 640, height: 400 };

  constructor() {
    super('cosmic-board');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.board = this.add.graphics().setDepth(1);
    this.boardOverlay = this.add.graphics().setDepth(1.35);
    this.actors = this.add.graphics().setDepth(2);
    this.fx = this.add.graphics().setDepth(3);
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
    g.lineStyle(1, COLORS.grid, 0.42);
    for (let x = 0; x <= BOARD_WIDTH; x++) {
      const px = this.layout.left + x * this.layout.cell;
      g.lineBetween(px, this.layout.top, px, this.layout.top + this.layout.height);
    }
    for (let y = 0; y <= BOARD_HEIGHT; y++) {
      const py = this.layout.top + y * this.layout.cell;
      g.lineBetween(this.layout.left, py, this.layout.left + this.layout.width, py);
    }

    drawCheckerboard(overlay, this.layout);
    drawPathCells(overlay, this.layout, state.pathNav);
    drawRocks(overlay, this.layout, state.rocks);
    drawPlacementPreview(overlay, this.layout, state, this.hoverBoardPoint);
  }

  private drawActors(state: GameState): void {
    const g = this.actors;
    g.clear();
    for (const gem of state.gems) {
      drawGem(g, this.layout, gem, gem.id === state.mergeSourceGemId);
    }
    for (const enemy of state.enemies) {
      if (enemy.alive) drawEnemy(g, this.layout, enemy);
    }
    for (const enemy of state.enemies) {
      if (enemy.alive) drawEnemyBars(g, this.layout, enemy);
    }
    for (const projectile of state.projectiles) {
      drawProjectile(g, this.layout, projectile);
    }
  }

  private drawFx(state: GameState): void {
    const g = this.fx;
    g.clear();
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
  if (gem) bridge.dispatch({ type: 'sellGem', gemId: gem.id });
}

function findGemAtCell(state: GameState, boardPoint: Vec2): GemState | undefined {
  const cx = Math.floor(boardPoint.x);
  const cy = Math.floor(boardPoint.y);
  return state.gems.find((g) => Math.floor(g.x) === cx && Math.floor(g.y) === cy);
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

function drawCheckerboard(g: Phaser.GameObjects.Graphics, layout: BoardLayout): void {
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      const isRockCell = cellParity(x, y) === 'rock';
      g.fillStyle(isRockCell ? COLORS.rockCell : COLORS.gemCell, 0.55);
      g.fillRect(
        layout.left + x * layout.cell,
        layout.top + y * layout.cell,
        layout.cell,
        layout.cell,
      );
    }
  }
}

function drawPathCells(
  g: Phaser.GameObjects.Graphics,
  layout: BoardLayout,
  pathNav: GameState['pathNav'],
): void {
  g.fillStyle(COLORS.path, 0.12);
  for (const key of pathNav.pathCells) {
    const [x, y] = key.split(',').map(Number);
    g.fillRect(
      layout.left + x * layout.cell,
      layout.top + y * layout.cell,
      layout.cell,
      layout.cell,
    );
  }
  const start = boardToScreen(layout, pathNav.spawnCell);
  const end = boardToScreen(layout, pathNav.goalCell);
  g.fillStyle(COLORS.green, 0.9);
  g.fillCircle(start.x, start.y, layout.cell * 0.2);
  g.lineStyle(2, COLORS.green, 0.5);
  g.strokeCircle(start.x, start.y, layout.cell * 0.28);
  g.fillStyle(COLORS.red, 0.9);
  g.fillCircle(end.x, end.y, layout.cell * 0.2);
  g.lineStyle(2, COLORS.red, 0.5);
  g.strokeCircle(end.x, end.y, layout.cell * 0.28);
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

function drawRocks(
  g: Phaser.GameObjects.Graphics,
  layout: BoardLayout,
  rocks: GameState['rocks'],
): void {
  for (const rock of rocks) {
    const point = boardToScreen(layout, rock);
    const size = layout.cell * 0.42;
    g.lineStyle(3, 0x94a3b8, 0.95);
    g.strokeCircle(point.x, point.y, size);
    g.fillStyle(0x4a5568, 0.98);
    g.fillCircle(point.x, point.y, size * 0.92);
    g.fillStyle(0x718096, 0.9);
    g.fillCircle(point.x - size * 0.22, point.y - size * 0.18, size * 0.5);
    g.fillStyle(0x2d3748, 0.95);
    g.fillCircle(point.x + size * 0.18, point.y + size * 0.12, size * 0.38);
    g.fillStyle(0xa0aec0, 0.7);
    g.fillCircle(point.x - size * 0.08, point.y - size * 0.28, size * 0.18);
  }
}

function drawGem(
  g: Phaser.GameObjects.Graphics,
  layout: BoardLayout,
  gem: GemState,
  mergeSelected: boolean,
): void {
  const def = gemDefinitions[gem.family];
  const point = boardToScreen(layout, gem);
  const baseSize = layout.cell * (0.22 + gem.level * 0.04);
  const color = Phaser.Display.Color.HexStringToColor(def.color).color;

  g.fillStyle(color, 0.25);
  g.fillCircle(point.x, point.y, baseSize * 1.4);

  drawGemShape(g, point.x, point.y, baseSize, color, GEM_SHAPES[gem.family]);

  if (gem.level === 7) {
    g.lineStyle(2, 0xfff4a3, 0.9);
    g.strokeCircle(point.x, point.y, baseSize * 1.5);
  } else {
    g.lineStyle(1, 0xffffff, 0.35 + gem.level * 0.08);
    g.strokeCircle(point.x, point.y, baseSize * 1.15);
  }

  if (mergeSelected) {
    g.lineStyle(3, 0xfff4a3, 0.95);
    g.strokeCircle(point.x, point.y, baseSize * 1.7);
  }
}

function drawGemShape(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  size: number,
  color: number,
  shape: 'diamond' | 'hex' | 'circle' | 'square' | 'star',
): void {
  g.fillStyle(color, 0.92);
  switch (shape) {
    case 'diamond':
      g.fillTriangle(x, y - size, x + size, y, x, y + size);
      g.fillTriangle(x, y - size, x - size, y, x, y + size);
      break;
    case 'hex':
      g.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const px = x + Math.cos(angle) * size;
        const py = y + Math.sin(angle) * size;
        if (i === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.closePath();
      g.fillPath();
      break;
    case 'circle':
      g.fillCircle(x, y, size);
      g.fillStyle(0xffffff, 0.35);
      g.fillCircle(x - size * 0.25, y - size * 0.25, size * 0.35);
      break;
    case 'square':
      g.fillRect(x - size, y - size, size * 2, size * 2);
      break;
    case 'star':
      g.beginPath();
      for (let i = 0; i < 10; i++) {
        const angle = (Math.PI / 5) * i - Math.PI / 2;
        const radius = i % 2 === 0 ? size : size * 0.45;
        const px = x + Math.cos(angle) * radius;
        const py = y + Math.sin(angle) * radius;
        if (i === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.closePath();
      g.fillPath();
      break;
  }
}

function drawEnemy(
  g: Phaser.GameObjects.Graphics,
  layout: BoardLayout,
  enemy: EnemyState,
): void {
  const point = boardToScreen(layout, enemy);
  const color = Phaser.Display.Color.HexStringToColor(enemy.color).color;
  const isBoss = enemy.definitionId === 'colossus' || enemy.definitionId === 'dreadnought';
  const size = layout.cell * (isBoss ? 0.38 : 0.22);

  if (isBoss) {
    g.fillStyle(color, 0.3);
    g.fillCircle(point.x, point.y, size * 1.5);
    g.lineStyle(2, color, 0.8);
    g.strokeCircle(point.x, point.y, size * 1.5);
  }

  g.fillStyle(color, 0.9);
  g.fillCircle(point.x, point.y, size);
  g.fillStyle(0xffffff, 0.4);
  g.fillCircle(point.x - size * 0.2, point.y - size * 0.2, size * 0.25);

  if (enemy.slowUntil > 0) {
    g.lineStyle(2, 0x60a5fa, 0.6);
    g.strokeCircle(point.x, point.y, size * 1.3);
  }
}

function drawEnemyBars(
  g: Phaser.GameObjects.Graphics,
  layout: BoardLayout,
  enemy: EnemyState,
): void {
  const point = boardToScreen(layout, enemy);
  const isBoss = enemy.definitionId === 'colossus' || enemy.definitionId === 'dreadnought';
  const barW = layout.cell * (isBoss ? 0.7 : 0.5);
  g.fillStyle(0x02050a, 0.7);
  g.fillRect(point.x - barW / 2, point.y - layout.cell * 0.42, barW, 4);
  g.fillStyle(COLORS.green, 0.95);
  g.fillRect(
    point.x - barW / 2,
    point.y - layout.cell * 0.42,
    barW * Math.max(0, enemy.hp / enemy.maxHp),
    4,
  );
  if (enemy.maxShield > 0) {
    g.fillStyle(COLORS.shield, 0.92);
    g.fillRect(
      point.x - barW / 2,
      point.y - layout.cell * 0.35,
      barW * Math.max(0, enemy.shield / enemy.maxShield),
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
