import Phaser from 'phaser';
import { canPlaceWithoutBlocking, toIndex } from '../../game/pathfinding';
import { getAnimationFrame } from '../../game/spriteAtlas';
import { spriteMetadata, type SpriteRect } from '../../game/spriteMetadata';
import type { GameState, GridPoint, TowerState } from '../../game/types';
import { getSceneBridge, type PhaserSceneBridge } from '../adapters/sceneBridge';
import {
  computeBoardLayout,
  pointToEnemyId,
  pointToTile,
  type PhaserBoardLayout,
} from '../view/boardGeometry';
import { Colors, textStyle } from '../ui/palette';
import { SceneKeys } from './sceneKeys';

export class BoardScene extends Phaser.Scene {
  private bridge!: PhaserSceneBridge;
  private backdrop!: Phaser.GameObjects.Image;
  private boardGraphics!: Phaser.GameObjects.Graphics;
  private fxGraphics!: Phaser.GameObjects.Graphics;
  private overlayGraphics!: Phaser.GameObjects.Graphics;
  private towerImages: Phaser.GameObjects.Image[] = [];
  private enemyImages: Phaser.GameObjects.Image[] = [];
  private floatingTexts: Phaser.GameObjects.Text[] = [];
  private lastHoverX = -1;
  private lastHoverY = -1;
  private layout: PhaserBoardLayout | null = null;

  constructor() {
    super(SceneKeys.Board);
  }

  create(): void {
    this.bridge = getSceneBridge();
    this.cameras.main.setBackgroundColor(Colors.bg);
    this.backdrop = this.add
      .image(0, 0, 'tactical-backdrop')
      .setOrigin(0)
      .setDepth(0)
      .setAlpha(0.24);
    this.boardGraphics = this.add.graphics().setDepth(1);
    this.fxGraphics = this.add.graphics().setDepth(5);
    this.overlayGraphics = this.add.graphics().setDepth(8);
    this.input.on('pointermove', this.handlePointerMove, this);
    this.input.on('pointerdown', this.handlePointerDown, this);
    this.input.on('gameout', this.clearHover, this);
  }

  update(): void {
    const state = this.bridge.game.current;
    this.layout = getLayoutForScene(this, state);
    this.resizeBackdrop();
    this.drawBoard(state, this.layout);
    this.drawTowerImages(state, this.layout);
    this.drawEnemyImages(state, this.layout);
    this.drawFx(state, this.layout);
    this.drawFloatingTexts(state, this.layout);
    this.drawOverlay(state, this.layout);
  }

  private resizeBackdrop(): void {
    this.backdrop.setDisplaySize(this.scale.width, this.scale.height);
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    const state = this.bridge.game.current;
    const layout = this.layout ?? getLayoutForScene(this, state);
    const tile = pointToTile(layout, state, pointer.x, pointer.y);
    const targetId = pointToEnemyId(layout, state.enemies, pointer.x, pointer.y);
    if (tile) {
      if (tile.x !== this.lastHoverX || tile.y !== this.lastHoverY) {
        this.lastHoverX = tile.x;
        this.lastHoverY = tile.y;
        this.bridge.dispatch({ type: 'hoverTile', x: tile.x, y: tile.y });
      }
    } else {
      this.clearHover();
    }
    this.input.manager.canvas.style.cursor = getCursorForHover(state, tile, targetId);
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    const state = this.bridge.game.current;
    const layout = this.layout ?? getLayoutForScene(this, state);
    const tile = pointToTile(layout, state, pointer.x, pointer.y);
    const targetId = pointToEnemyId(layout, state.enemies, pointer.x, pointer.y);
    if (tile && state.buildMode === 'mazeBlock') {
      this.bridge.dispatch({ type: 'placeMazeBlock', x: tile.x, y: tile.y });
    } else if (tile && state.buildMode === 'shopTower') {
      this.bridge.dispatch({ type: 'placeShopTower', x: tile.x, y: tile.y });
    } else if (targetId && state.selectedTile && selectedTileHasTower(state)) {
      this.bridge.dispatch({
        type: 'setTowerTarget',
        x: state.selectedTile.x,
        y: state.selectedTile.y,
        targetId,
      });
    } else if (tile) {
      this.bridge.dispatch({ type: 'selectTile', x: tile.x, y: tile.y });
    } else {
      this.clearHover();
    }
  }

  private clearHover(): void {
    if (this.lastHoverX === -1 && this.lastHoverY === -1) return;
    this.lastHoverX = -1;
    this.lastHoverY = -1;
    this.bridge.dispatch({ type: 'clearHover' });
    this.input.manager.canvas.style.cursor = 'default';
  }

  private drawBoard(state: GameState, layout: PhaserBoardLayout): void {
    const g = this.boardGraphics;
    const map = state.config.map;
    g.clear();
    g.fillGradientStyle(0x112d3a, 0x0a1c26, 0x061018, 0x03070b, 0.96);
    g.fillRect(layout.boardX, layout.boardY, layout.width, layout.height);
    g.fillStyle(0x071722, 0.94);
    g.fillRect(layout.offsetX, layout.offsetY, layout.boardWidth, layout.boardHeight);

    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const px = layout.offsetX + x * layout.cellSize;
        const py = layout.offsetY + y * layout.cellSize;
        if (state.occupied[toIndex(x, y, map.width)] === -1) {
          g.fillStyle(0x243944, 0.88);
          g.fillRoundedRect(px + 4, py + 4, layout.cellSize - 8, layout.cellSize - 8, 5);
          g.lineStyle(1, Colors.line, 0.3);
          g.strokeRoundedRect(px + 4, py + 4, layout.cellSize - 8, layout.cellSize - 8, 5);
        } else if ((x + y) % 2 === 0) {
          g.fillStyle(Colors.cyan, 0.035);
          g.fillRect(px, py, layout.cellSize, layout.cellSize);
        }
      }
    }

    this.drawPath(state, layout);
    g.lineStyle(Math.max(1, layout.cellSize * 0.018), Colors.line, 0.22);
    for (let x = 0; x <= map.width; x++) {
      const px = layout.offsetX + x * layout.cellSize;
      g.lineBetween(px, layout.offsetY, px, layout.offsetY + layout.boardHeight);
    }
    for (let y = 0; y <= map.height; y++) {
      const py = layout.offsetY + y * layout.cellSize;
      g.lineBetween(layout.offsetX, py, layout.offsetX + layout.boardWidth, py);
    }
    drawGate(g, layout, map.entrance.x, map.entrance.y, Colors.green);
    for (let i = 0; i < map.checkpoints.length; i++) {
      drawGate(g, layout, map.checkpoints[i].x, map.checkpoints[i].y, Colors.cyan);
    }
    drawGate(g, layout, map.exit.x, map.exit.y, Colors.red);
    this.drawStones(state, layout);
  }

  private drawPath(state: GameState, layout: PhaserBoardLayout): void {
    if (state.currentPath.length <= 1) return;
    const g = this.boardGraphics;
    g.lineStyle(Math.max(4, layout.cellSize * 0.15), Colors.cyan, 0.16);
    drawPolyline(g, state.currentPath, layout);
    g.lineStyle(Math.max(2, layout.cellSize * 0.055), Colors.cyan, 0.5);
    drawPolyline(g, state.currentPath, layout);
  }

  private drawStones(state: GameState, layout: PhaserBoardLayout): void {
    const g = this.boardGraphics;
    for (let i = 0; i < state.stones.length; i++) {
      const stone = state.stones[i];
      const px = layout.offsetX + stone.x * layout.cellSize;
      const py = layout.offsetY + stone.y * layout.cellSize;
      g.fillStyle(0x1c333d, 0.94);
      g.fillRoundedRect(
        px + layout.cellSize * 0.16,
        py + layout.cellSize * 0.16,
        layout.cellSize * 0.68,
        layout.cellSize * 0.68,
        Math.max(3, layout.cellSize * 0.08),
      );
      g.lineStyle(1, Colors.cyan, 0.36);
      g.strokeRoundedRect(
        px + layout.cellSize * 0.16,
        py + layout.cellSize * 0.16,
        layout.cellSize * 0.68,
        layout.cellSize * 0.68,
        Math.max(3, layout.cellSize * 0.08),
      );
    }
  }

  private drawTowerImages(state: GameState, layout: PhaserBoardLayout): void {
    let used = 0;
    for (let i = 0; i < state.draft.length; i++) {
      const candidate = state.draft[i];
      const frame = spriteMetadata.gems[candidate.gemId]?.frame;
      used = this.placeImage(
        this.towerImages,
        used,
        'gems',
        frame,
        candidate.x,
        candidate.y,
        layout,
        0.82,
        3,
      );
    }
    for (let i = 0; i < state.towers.length; i++) {
      const tower = state.towers[i];
      const frame = spriteMetadata.gems[tower.gemId]?.frame;
      used = this.placeImage(
        this.towerImages,
        used,
        'gems',
        frame,
        tower.x,
        tower.y,
        layout,
        0.92,
        3,
      );
    }
    hideImages(this.towerImages, used);
  }

  private drawEnemyImages(state: GameState, layout: PhaserBoardLayout): void {
    let used = 0;
    for (let i = 0; i < state.enemies.length; i++) {
      const enemy = state.enemies[i];
      if (!enemy.alive) continue;
      const meta = spriteMetadata.monsters[enemy.definitionId];
      const frame = meta
        ? getAnimationFrame(meta.animations.walk, state.time * 1000 + enemy.id * 37)
        : null;
      const image = this.acquireImage(this.enemyImages, used++);
      image.setTexture('monsters');
      if (frame) image.setCrop(frame.x, frame.y, frame.w, frame.h);
      else image.setCrop();
      image
        .setPosition(
          layout.offsetX + (enemy.x + 0.5) * layout.cellSize,
          layout.offsetY + (enemy.y + 0.5) * layout.cellSize,
        )
        .setDisplaySize(layout.cellSize * 0.92, layout.cellSize * 0.92)
        .setAlpha(enemy.invisible ? 0.48 : 1)
        .setVisible(true)
        .setDepth(4);
    }
    hideImages(this.enemyImages, used);
  }

  private placeImage(
    pool: Phaser.GameObjects.Image[],
    index: number,
    texture: string,
    frame: SpriteRect | undefined,
    tileX: number,
    tileY: number,
    layout: PhaserBoardLayout,
    scale: number,
    depth: number,
  ): number {
    const image = this.acquireImage(pool, index);
    image.setTexture(texture);
    if (frame) image.setCrop(frame.x, frame.y, frame.w, frame.h);
    else image.setCrop();
    image
      .setPosition(
        layout.offsetX + tileX * layout.cellSize + layout.cellSize / 2,
        layout.offsetY + tileY * layout.cellSize + layout.cellSize / 2,
      )
      .setDisplaySize(layout.cellSize * scale, layout.cellSize * scale)
      .setAlpha(1)
      .setVisible(true)
      .setDepth(depth);
    return index + 1;
  }

  private acquireImage(pool: Phaser.GameObjects.Image[], index: number): Phaser.GameObjects.Image {
    let image = pool[index];
    if (!image) {
      image = this.add.image(0, 0, 'gems').setOrigin(0.5).setVisible(false);
      pool[index] = image;
    }
    return image;
  }

  private drawFx(state: GameState, layout: PhaserBoardLayout): void {
    const g = this.fxGraphics;
    g.clear();
    for (let i = 0; i < state.towers.length; i++) {
      const tower = state.towers[i];
      if (state.selectedTile?.x === tower.x && state.selectedTile.y === tower.y) {
        const cx = layout.offsetX + tower.x * layout.cellSize + layout.cellSize / 2;
        const cy = layout.offsetY + tower.y * layout.cellSize + layout.cellSize / 2;
        g.lineStyle(1, Colors.cyan, 0.42);
        g.strokeCircle(cx, cy, tower.range * layout.cellSize);
      }
      if (tower.mvpAwards > 0) drawMvpRing(g, tower, layout);
    }
    for (let i = 0; i < state.projectiles.length; i++) {
      const projectile = state.projectiles[i];
      if (!projectile.active) continue;
      g.fillStyle(Phaser.Display.Color.HexStringToColor(projectile.color).color, 0.96);
      g.fillCircle(
        layout.offsetX + projectile.x * layout.cellSize,
        layout.offsetY + projectile.y * layout.cellSize,
        Math.max(3, layout.cellSize * 0.07),
      );
    }
    for (let i = 0; i < state.enemies.length; i++) {
      const enemy = state.enemies[i];
      if (!enemy.alive) continue;
      const cx = layout.offsetX + (enemy.x + 0.5) * layout.cellSize;
      const cy = layout.offsetY + (enemy.y + 0.5) * layout.cellSize;
      drawHealthBar(g, cx, cy, layout.cellSize, enemy.hp / enemy.maxHp);
    }
  }

  private drawFloatingTexts(state: GameState, layout: PhaserBoardLayout): void {
    let used = 0;
    for (let i = 0; i < state.floatingTexts.length; i++) {
      const item = state.floatingTexts[i];
      if (!item.active) continue;
      let text = this.floatingTexts[used];
      if (!text) {
        text = this.add.text(0, 0, '', textStyle(13, '#f3ca72')).setOrigin(0.5).setDepth(7);
        this.floatingTexts[used] = text;
      }
      text
        .setText(item.value)
        .setPosition(
          layout.offsetX + item.x * layout.cellSize + layout.cellSize / 2,
          layout.offsetY + item.y * layout.cellSize,
        )
        .setAlpha(Math.max(0, item.life / 0.6))
        .setVisible(true);
      used++;
    }
    for (let i = used; i < this.floatingTexts.length; i++) this.floatingTexts[i].setVisible(false);
  }

  private drawOverlay(state: GameState, layout: PhaserBoardLayout): void {
    const g = this.overlayGraphics;
    g.clear();
    drawPlacementPreview(g, state, layout);
    drawSelectedTile(g, state, layout);
    drawTargetIndicator(g, state, layout);
    if (state.status === 'paused' || state.status === 'won' || state.status === 'lost') {
      g.fillStyle(0x040a0f, 0.68);
      g.fillRect(layout.boardX, layout.boardY, layout.width, layout.height);
    }
  }
}

function getLayoutForScene(scene: Phaser.Scene, state: GameState): PhaserBoardLayout {
  const width = scene.scale.width;
  const height = scene.scale.height;
  const top = 112;
  const bottom = 150;
  const right = width >= 1040 ? 380 : 0;
  return computeBoardLayout(state, {
    x: 16,
    y: top,
    width: Math.max(320, width - right - 32),
    height: Math.max(260, height - top - bottom - 16),
  });
}

function drawPolyline(
  g: Phaser.GameObjects.Graphics,
  points: readonly GridPoint[],
  layout: PhaserBoardLayout,
): void {
  g.beginPath();
  g.moveTo(
    layout.offsetX + points[0].x * layout.cellSize + layout.cellSize / 2,
    layout.offsetY + points[0].y * layout.cellSize + layout.cellSize / 2,
  );
  for (let i = 1; i < points.length; i++) {
    g.lineTo(
      layout.offsetX + points[i].x * layout.cellSize + layout.cellSize / 2,
      layout.offsetY + points[i].y * layout.cellSize + layout.cellSize / 2,
    );
  }
  g.strokePath();
}

function drawGate(
  g: Phaser.GameObjects.Graphics,
  layout: PhaserBoardLayout,
  x: number,
  y: number,
  color: number,
): void {
  const cx = layout.offsetX + x * layout.cellSize + layout.cellSize / 2;
  const cy = layout.offsetY + y * layout.cellSize + layout.cellSize / 2;
  g.fillStyle(color, 0.18);
  g.fillCircle(cx, cy, layout.cellSize * 0.42);
  g.lineStyle(Math.max(2, layout.cellSize * 0.05), color, 0.86);
  g.strokeCircle(cx, cy, layout.cellSize * 0.42);
}

function drawMvpRing(
  g: Phaser.GameObjects.Graphics,
  tower: TowerState,
  layout: PhaserBoardLayout,
): void {
  const cx = layout.offsetX + tower.x * layout.cellSize + layout.cellSize / 2;
  const cy = layout.offsetY + tower.y * layout.cellSize + layout.cellSize / 2;
  g.lineStyle(Math.max(2, layout.cellSize * 0.035), Colors.amber, 0.72);
  g.strokeCircle(cx, cy, layout.cellSize * (0.34 + tower.mvpAwards * 0.018));
}

function drawHealthBar(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  cellSize: number,
  ratio: number,
): void {
  const width = cellSize * 0.72;
  const height = Math.max(3, cellSize * 0.055);
  const x = cx - width / 2;
  const y = cy - cellSize * 0.34;
  g.fillStyle(0x000000, 0.5);
  g.fillRect(x, y, width, height);
  g.fillStyle(Colors.green, 0.95);
  g.fillRect(x, y, width * Math.max(0, ratio), height);
}

function drawPlacementPreview(
  g: Phaser.GameObjects.Graphics,
  state: GameState,
  layout: PhaserBoardLayout,
): void {
  const tile = state.hoverTile;
  if (!tile || state.buildMode === 'select') return;
  const canPlace = canPlaceAtHoveredTile(state, tile);
  const color = canPlace ? Colors.green : Colors.red;
  const x = layout.offsetX + tile.x * layout.cellSize;
  const y = layout.offsetY + tile.y * layout.cellSize;
  g.fillStyle(color, 0.18);
  g.fillRect(x, y, layout.cellSize, layout.cellSize);
  g.lineStyle(Math.max(2, layout.cellSize * 0.05), color, 0.9);
  g.strokeRect(x + 2, y + 2, layout.cellSize - 4, layout.cellSize - 4);
}

function drawSelectedTile(
  g: Phaser.GameObjects.Graphics,
  state: GameState,
  layout: PhaserBoardLayout,
): void {
  const tile = state.selectedTile;
  if (!tile) return;
  const x = layout.offsetX + tile.x * layout.cellSize;
  const y = layout.offsetY + tile.y * layout.cellSize;
  g.lineStyle(Math.max(2, layout.cellSize * 0.055), Colors.ink, 0.78);
  g.strokeRect(x + 3, y + 3, layout.cellSize - 6, layout.cellSize - 6);
}

function drawTargetIndicator(
  g: Phaser.GameObjects.Graphics,
  state: GameState,
  layout: PhaserBoardLayout,
): void {
  const selectedTargetId = getSelectedTargetId(state);
  if (!selectedTargetId) return;
  for (let i = 0; i < state.enemies.length; i++) {
    const enemy = state.enemies[i];
    if (!enemy.alive || enemy.id !== selectedTargetId) continue;
    const cx = layout.offsetX + (enemy.x + 0.5) * layout.cellSize;
    const cy = layout.offsetY + (enemy.y + 0.5) * layout.cellSize;
    g.lineStyle(Math.max(2, layout.cellSize * 0.045), Colors.cyan, 0.95);
    g.strokeCircle(cx, cy, layout.cellSize * 0.43);
    return;
  }
}

function hideImages(pool: Phaser.GameObjects.Image[], used: number): void {
  for (let i = used; i < pool.length; i++) pool[i].setVisible(false);
}

function getSelectedTargetId(state: GameState): number | null {
  const tile = state.selectedTile;
  if (!tile) return null;
  for (let i = 0; i < state.towers.length; i++) {
    const tower = state.towers[i];
    if (tower.x === tile.x && tower.y === tile.y) return tower.targetId;
  }
  return null;
}

function selectedTileHasTower(state: GameState): boolean {
  const tile = state.selectedTile;
  if (!tile) return false;
  return tileHasTower(state, tile);
}

function getCursorForHover(
  state: GameState,
  tile: GridPoint | null,
  targetId: number | null,
): string {
  if (state.buildMode === 'mazeBlock')
    return tile && canPlaceMazeBlockAt(state, tile) ? 'pointer' : 'not-allowed';
  if (state.buildMode === 'shopTower')
    return tile && canPlaceShopTowerAt(state, tile) ? 'pointer' : 'not-allowed';
  if (targetId && selectedTileHasTower(state)) return 'pointer';
  if (tile && (tileHasTower(state, tile) || tileHasStone(state, tile))) return 'pointer';
  return tile ? 'crosshair' : 'default';
}

function canPlaceAtHoveredTile(state: GameState, tile: GridPoint): boolean {
  if (state.buildMode === 'mazeBlock') return canPlaceMazeBlockAt(state, tile);
  if (state.buildMode === 'shopTower') return canPlaceShopTowerAt(state, tile);
  return false;
}

function canPlaceMazeBlockAt(state: GameState, tile: GridPoint): boolean {
  if (!canBuildBetweenWaves(state) || state.bankedMazeBlocks <= 0) return false;
  return canPlaceWithoutBlocking(
    state.config.map,
    state.occupied,
    tile.x,
    tile.y,
    getActiveEnemyCells(state),
  );
}

function canPlaceShopTowerAt(state: GameState, tile: GridPoint): boolean {
  if (!canBuildBetweenWaves(state) || !state.selectedShopGemId || tileHasTower(state, tile))
    return false;
  const item = state.config.towerShop.find(
    (shopItem) => shopItem.gemId === state.selectedShopGemId,
  );
  if (!item || state.gold < item.cost) return false;
  if (tileHasStone(state, tile)) return true;
  return canPlaceWithoutBlocking(
    state.config.map,
    state.occupied,
    tile.x,
    tile.y,
    getActiveEnemyCells(state),
  );
}

function canBuildBetweenWaves(state: GameState): boolean {
  return (
    state.phase === 'build' &&
    !state.activeWaveId &&
    state.status !== 'running' &&
    state.status !== 'paused' &&
    state.status !== 'lost'
  );
}

function tileHasTower(state: GameState, tile: GridPoint): boolean {
  for (let i = 0; i < state.towers.length; i++) {
    const tower = state.towers[i];
    if (tower.x === tile.x && tower.y === tile.y) return true;
  }
  return false;
}

function tileHasStone(state: GameState, tile: GridPoint): boolean {
  for (let i = 0; i < state.stones.length; i++) {
    const stone = state.stones[i];
    if (stone.x === tile.x && stone.y === tile.y) return true;
  }
  return false;
}

function getActiveEnemyCells(state: GameState): GridPoint[] {
  const cells: GridPoint[] = [];
  for (let i = 0; i < state.enemies.length; i++) {
    const enemy = state.enemies[i];
    if (enemy.alive) cells.push({ x: Math.round(enemy.x), y: Math.round(enemy.y) });
  }
  return cells;
}
