import Phaser from 'phaser';
import { BOARD_HEIGHT, BOARD_WIDTH, getArea, getTower } from '../game/content';
import type { EnemyState, GameState, MissileState, ProjectileState, TowerState, Vec2 } from '../game/types';
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
  slot: 0xf6c85f,
  text: '#eef7ff',
  red: 0xff5a7a,
  green: 0x7fffb2,
  shield: 0xbd9cff,
};

export class CosmicBoardScene extends Phaser.Scene {
  private board!: Phaser.GameObjects.Graphics;
  private actors!: Phaser.GameObjects.Graphics;
  private fx!: Phaser.GameObjects.Graphics;
  private hoveredSlot: number | null = null;
  private layout: BoardLayout = { left: 0, top: 0, cell: 40, width: 640, height: 400 };

  constructor() {
    super('cosmic-board');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.board = this.add.graphics().setDepth(1);
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
    const bridge = getBridge();
    const state = bridge.getState();
    const boardPoint = screenToBoard(this.layout, pointer.x, pointer.y);
    const slotIndex = boardPoint ? getSlotAtPoint(state, boardPoint) : null;
    if (slotIndex !== this.hoveredSlot) {
      this.hoveredSlot = slotIndex;
      bridge.dispatch({ type: 'selectSlot', slotIndex });
    }
    this.input.manager.canvas.style.cursor = slotIndex !== null ? 'pointer' : 'crosshair';
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    const bridge = getBridge();
    const state = bridge.getState();
    const boardPoint = screenToBoard(this.layout, pointer.x, pointer.y);
    if (!boardPoint) return;
    const slotIndex = getSlotAtPoint(state, boardPoint);
    if (slotIndex !== null && state.status !== 'running') {
      bridge.dispatch({ type: 'placeTower', slotIndex });
      return;
    }
    bridge.dispatch({ type: 'fireMissile', x: boardPoint.x, y: boardPoint.y });
  }

  private clearHover(): void {
    this.hoveredSlot = null;
    getBridge().dispatch({ type: 'selectSlot', slotIndex: null });
    this.input.manager.canvas.style.cursor = 'default';
  }

  private drawBoard(state: GameState): void {
    const g = this.board;
    const area = getArea(state.areaId);
    g.clear();
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

    drawPath(g, this.layout, area.path);
    for (let index = 0; index < area.buildSlots.length; index++) {
      drawSlot(g, this.layout, area.buildSlots[index], index === state.selectedSlotIndex);
    }
  }

  private drawActors(state: GameState): void {
    const g = this.actors;
    g.clear();
    for (const tower of state.towers) drawTower(g, this.layout, tower);
    for (const enemy of state.enemies) {
      if (enemy.alive) drawEnemy(g, this.layout, enemy);
    }
    for (const projectile of state.projectiles) drawProjectile(g, this.layout, projectile);
  }

  private drawFx(state: GameState): void {
    const g = this.fx;
    g.clear();
    const selectedTower = state.selectedTowerId ? getTower(state.selectedTowerId) : null;
    if (selectedTower && state.selectedSlotIndex !== null && state.status !== 'running') {
      const slot = getArea(state.areaId).buildSlots[state.selectedSlotIndex];
      if (slot) {
        const point = boardToScreen(this.layout, slot);
        g.lineStyle(2, Phaser.Display.Color.HexStringToColor(selectedTower.color).color, 0.34);
        g.strokeCircle(point.x, point.y, selectedTower.range * this.layout.cell);
      }
    }
    for (const missile of state.missiles) drawMissile(g, this.layout, missile);
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

function drawPath(g: Phaser.GameObjects.Graphics, layout: BoardLayout, path: readonly Vec2[]): void {
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

function strokePath(g: Phaser.GameObjects.Graphics, layout: BoardLayout, path: readonly Vec2[]): void {
  g.beginPath();
  const start = boardToScreen(layout, path[0]);
  g.moveTo(start.x, start.y);
  for (let index = 1; index < path.length; index++) {
    const point = boardToScreen(layout, path[index]);
    g.lineTo(point.x, point.y);
  }
  g.strokePath();
}

function drawSlot(g: Phaser.GameObjects.Graphics, layout: BoardLayout, slot: Vec2, selected: boolean): void {
  const point = boardToScreen(layout, slot);
  g.fillStyle(0x0e2534, 0.96);
  g.fillCircle(point.x, point.y, layout.cell * 0.33);
  g.lineStyle(selected ? 4 : 2, COLORS.slot, selected ? 0.95 : 0.48);
  g.strokeCircle(point.x, point.y, layout.cell * 0.34);
}

function drawTower(g: Phaser.GameObjects.Graphics, layout: BoardLayout, tower: TowerState): void {
  const definition = getTower(tower.towerId);
  const color = Phaser.Display.Color.HexStringToColor(definition.color).color;
  const point = boardToScreen(layout, tower);
  g.fillStyle(0x03111d, 1);
  g.fillCircle(point.x, point.y, layout.cell * 0.29);
  g.fillStyle(color, 0.94);
  g.fillTriangle(
    point.x,
    point.y - layout.cell * 0.29,
    point.x - layout.cell * 0.24,
    point.y + layout.cell * 0.2,
    point.x + layout.cell * 0.24,
    point.y + layout.cell * 0.2,
  );
}

function drawEnemy(g: Phaser.GameObjects.Graphics, layout: BoardLayout, enemy: EnemyState): void {
  const color = Phaser.Display.Color.HexStringToColor(enemy.color).color;
  const point = boardToScreen(layout, enemy);
  const radius = layout.cell * (enemy.maxShield > 0 ? 0.25 : 0.21);
  if (enemy.shield > 0) {
    g.lineStyle(3, COLORS.shield, 0.86);
    g.strokeCircle(point.x, point.y, radius + layout.cell * 0.08);
  }
  g.fillStyle(color, 0.96);
  g.fillCircle(point.x, point.y, radius);
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

function drawProjectile(g: Phaser.GameObjects.Graphics, layout: BoardLayout, projectile: ProjectileState): void {
  const color = Phaser.Display.Color.HexStringToColor(projectile.color).color;
  const point = boardToScreen(layout, projectile);
  g.fillStyle(color, 0.95);
  g.fillCircle(point.x, point.y, Math.max(3, layout.cell * 0.07));
}

function drawMissile(g: Phaser.GameObjects.Graphics, layout: BoardLayout, missile: MissileState): void {
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
  if (x < layout.left || y < layout.top || x > layout.left + layout.width || y > layout.top + layout.height) {
    return null;
  }
  return {
    x: (x - layout.left) / layout.cell - 0.5,
    y: (y - layout.top) / layout.cell - 0.5,
  };
}

function getSlotAtPoint(state: GameState, point: Vec2): number | null {
  const slots = getArea(state.areaId).buildSlots;
  for (let index = 0; index < slots.length; index++) {
    if (Math.hypot(slots[index].x - point.x, slots[index].y - point.y) <= 0.55) return index;
  }
  return null;
}
