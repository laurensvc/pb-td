import Phaser from 'phaser';
import { canPlaceGemAt, canPlaceHoldGemAt, canPlaceRawGemAt } from '../game/boardQueries';
import { getGemCombatStats } from '../game/gems';
import { canPlaceAtBoardPoint, isPlanningPhase } from './boardInput';
import type { GameState, Vec2 } from '../game/types';
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
import { tryGetBridge } from './bridge';
import {
  boardToScreen,
  cellCenter,
  cellToScreen,
  computeLayout,
  pointerToCanvas,
  rangeToPixels,
  screenToCell,
  type BoardLayout,
} from './boardCoords';
import { findGemAtCell, handleRightClick } from './input/pointerHandlers';
import {
  COLORS,
  drawCheckpointRoute,
  drawPathOverlay,
  drawPlacementPreview,
} from './render/boardGraphics';
import { updateFxLabels } from './render/fxLabels';
import { BoardSpriteLayer } from './sprites/boardSprites';

export class CosmicBoardScene extends Phaser.Scene {
  private board!: Phaser.GameObjects.Graphics;
  private boardOverlay!: Phaser.GameObjects.Graphics;
  private fx!: Phaser.GameObjects.Graphics;
  private spriteLayer!: BoardSpriteLayer;
  private fxLabels = new Map<number, Phaser.GameObjects.Text>();
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
  private lastPreviewCellKey: string | null = null;
  private lastLayoutWidth = 0;
  private lastLayoutHeight = 0;

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
    this.spriteLayer = new BoardSpriteLayer(this);
    this.assetsReady = true;
    this.input.on('pointerdown', this.handlePointerDown, this);
    this.input.on('pointermove', this.handlePointerMove, this);
    this.input.on('gameout', this.clearHover, this);
    this.input.on('pointerout', this.clearHover, this);
    this.game.canvas.addEventListener('contextmenu', this.preventContextMenu);
  }

  shutdown(): void {
    this.input.off('pointerdown', this.handlePointerDown, this);
    this.input.off('pointermove', this.handlePointerMove, this);
    this.input.off('gameout', this.clearHover, this);
    this.input.off('pointerout', this.clearHover, this);
    this.game.canvas.removeEventListener('contextmenu', this.preventContextMenu);
    this.spriteLayer.pruneAll(this.fxLabels);
  }

  private preventContextMenu = (event: Event): void => {
    event.preventDefault();
  };

  update(_time: number, delta: number): void {
    const bridge = tryGetBridge();
    if (!bridge) return;
    bridge.step(delta / 1000);
    const state = bridge.getState();
    const nextLayout = computeLayout(this.scale.width, this.scale.height);
    const layoutChanged =
      nextLayout.width !== this.lastLayoutWidth || nextLayout.height !== this.lastLayoutHeight;
    this.layout = nextLayout;
    this.spriteLayer.setLayout(nextLayout);
    this.lastLayoutWidth = nextLayout.width;
    this.lastLayoutHeight = nextLayout.height;
    if (layoutChanged) {
      this.spriteLayer.pruneAll(this.fxLabels);
    }
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
    const bridge = tryGetBridge();
    if (!bridge) return;
    const state = bridge.getState();
    const planning = isPlanningPhase(state.status);
    const canvasPoint = this.pointerCanvasPoint(pointer);
    this.hoverCell = screenToCell(this.layout, canvasPoint.x, canvasPoint.y);
    const boardPoint = this.hoverCell ? cellCenter(this.hoverCell) : null;
    const canPlace = boardPoint !== null && canPlaceAtBoardPoint(state, boardPoint.x, boardPoint.y);
    if (
      planning &&
      state.buildStep === 'rocks' &&
      state.placementMode === 'rock' &&
      this.hoverCell &&
      boardPoint
    ) {
      const cellKey = `${this.hoverCell.x},${this.hoverCell.y}`;
      if (cellKey !== this.lastPreviewCellKey) {
        this.lastPreviewCellKey = cellKey;
        bridge.previewRockPath(boardPoint.x, boardPoint.y);
      }
    }
    this.input.manager.canvas.style.cursor = canPlace ? 'pointer' : 'crosshair';
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    const bridge = tryGetBridge();
    if (!bridge) return;
    const state = bridge.getState();
    const canvasPoint = this.pointerCanvasPoint(pointer);
    const cell = screenToCell(this.layout, canvasPoint.x, canvasPoint.y);
    if (!cell) return;
    const boardPoint = cellCenter(cell);

    if (pointer.rightButtonDown() && state.status !== 'running') {
      handleRightClick(bridge, state, cell);
      return;
    }

    const planning = isPlanningPhase(state.status);
    if (planning && state.buildStep === 'upgrade') {
      const rock = state.rocks.find((r) => r.x === cell.x && r.y === cell.y);
      if (rock && state.claimedOffer) {
        bridge.dispatch({ type: 'upgradeRock', x: boardPoint.x, y: boardPoint.y });
      }
      return;
    }

    if (planning && state.buildStep === 'rocks' && state.placementMode === 'rock') {
      if (canPlaceRawGemAt(state, boardPoint.x, boardPoint.y)) {
        bridge.dispatch({ type: 'placeRawGem', x: boardPoint.x, y: boardPoint.y });
      }
      return;
    }
    if (planning && state.placementMode === 'gem') {
      if (canPlaceGemAt(state, boardPoint.x, boardPoint.y)) {
        bridge.dispatch({ type: 'placeGem', x: boardPoint.x, y: boardPoint.y });
      }
      return;
    }
    if (planning && state.placementMode === 'hold') {
      if (state.holdGem && canPlaceHoldGemAt(state, boardPoint.x, boardPoint.y)) {
        bridge.dispatch({ type: 'placeHoldGem', x: boardPoint.x, y: boardPoint.y });
      }
      return;
    }
    if (planning && state.placementMode === 'merge') {
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
    if (state.status === 'running') return;
  }

  private clearHover(): void {
    this.hoverCell = null;
    this.lastPreviewCellKey = null;
    tryGetBridge()?.clearRockPathPreview();
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
      drawCheckpointRoute(overlay, this.layout, state.pathNav.checkpoints);
      drawPathOverlay(overlay, this.layout, state.pathNav);
      drawPlacementPreview(overlay, this.layout, state, this.hoverCell);
    }
  }

  private drawSprites(state: GameState): void {
    if (!this.assetsReady) return;
    this.spriteLayer.sync(state, this.boardOverlay);
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
          const stats = getGemCombatStats(state.save, inv.family, inv.level);
          const point = cellToScreen(this.layout, this.hoverCell);
          const color = Phaser.Display.Color.HexStringToColor(stats.color).color;
          g.lineStyle(2, color, 0.34);
          g.strokeCircle(point.x, point.y, rangeToPixels(this.layout, stats.range));
        }
      }
    }
    updateFxLabels(this, this.layout, this.fxLabels, state.fxEvents);
  }
}
