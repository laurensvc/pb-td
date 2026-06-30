import Phaser from 'phaser';
import { canPlaceGemAt, canPlaceHoldGemAt, canPlaceRawGemAt } from '../game/boardQueries';
import { canPlaceAtBoardPoint, isPlanningPhase } from './boardInput';
import type { GameState, Vec2 } from '../game/types';
import {
  ASSET_PATHS,
  BOSS_ENEMY_IDS,
  CHECKPOINT_LEVELS,
  ENEMY_FRAME_SIZE,
  ENEMY_IDS,
  ENEMY_WALK_FRAMES,
  FLOOR_VARIANT_TILE_SIZE,
  GEM_FAMILIES,
  GEM_LEVELS,
  checkpointAssetPath,
  checkpointTextureKey,
  enemyWalkAssetPath,
  enemyWalkTextureKey,
  fxTextureKey,
  gemAssetPath,
  gemTextureKey,
  projectileAssetPath,
  projectileTextureKey,
  PROJECTILE_BRANCHES,
} from './assetManifest';
import { tryGetBridge } from './bridge';
import {
  boardToScreen,
  BOARD_PAN_SPEED,
  cellCenter,
  cellToScreen,
  clampBoardScroll,
  computeLayout,
  DEFAULT_BOARD_ZOOM,
  effectiveTileSize,
  isPointInBoardViewport,
  layoutWithZoom,
  pointerToCanvas,
  rangeToPixels,
  screenToCell,
  withBoardScroll,
  zoomBoardAt,
  type BoardLayout,
} from './boardCoords';
import { findGemAtCell, handleRightClick } from './input/pointerHandlers';
import {
  COLORS,
  drawCheckpointRoute,
  drawGridOverlay,
  drawPathOverlay,
  drawPlacementPreview,
  drawProspectHighlight,
  gridOverlayAlpha,
} from './render/boardGraphics';
import { findRawGemAtCell, resolvePlacementGhost } from './render/placementGhost';
import { updateFxLabels } from './render/fxLabels';
import { BoardSpriteLayer } from './sprites/boardSprites';
import { FxSpriteLayer } from './sprites/fxSprites';

export class GemBoardScene extends Phaser.Scene {
  private board!: Phaser.GameObjects.Graphics;
  private boardOverlay!: Phaser.GameObjects.Graphics;
  private fx!: Phaser.GameObjects.Graphics;
  private spriteLayer!: BoardSpriteLayer;
  private fxSpriteLayer!: FxSpriteLayer;
  private fxLabels = new Map<number, Phaser.GameObjects.Text>();
  private hoverCell: Vec2 | null = null;
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
    zoom: DEFAULT_BOARD_ZOOM,
  };
  private zoom = DEFAULT_BOARD_ZOOM;
  private ghostSprite: Phaser.GameObjects.Image | null = null;
  private scrollX = 0;
  private scrollY = 0;
  private isPanning = false;
  private panAnchorX = 0;
  private panAnchorY = 0;
  private panScrollStartX = 0;
  private panScrollStartY = 0;
  private cursorKeys!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private zoomOutKey!: Phaser.Input.Keyboard.Key;
  private zoomInKey!: Phaser.Input.Keyboard.Key;
  private viewportMaskGfx!: Phaser.GameObjects.Graphics;
  private viewportMask!: Phaser.Display.Masks.GeometryMask;
  private assetsReady = false;
  private lastPreviewCellKey: string | null = null;
  private lastLayoutWidth = 0;
  private lastLayoutHeight = 0;

  constructor() {
    super('gem-board');
  }

  preload(): void {
    this.load.image('hex-rock-floor', ASSET_PATHS.terrainVoid);
    this.load.image('hex-gem-floor', ASSET_PATHS.terrainGem);
    this.load.image('hex-path-floor', ASSET_PATHS.terrainPath);
    this.load.spritesheet('floor-variants', ASSET_PATHS.terrainFloorVariants, {
      frameWidth: FLOOR_VARIANT_TILE_SIZE,
      frameHeight: FLOOR_VARIANT_TILE_SIZE,
    });
    this.load.image('board-rock', ASSET_PATHS.rock);
    this.load.image('spawn-portal', ASSET_PATHS.spawnPortal);
    this.load.image('goal-nexus', ASSET_PATHS.goalNexus);
    this.load.image(fxTextureKey('merge-burst'), ASSET_PATHS.fxMergeBurst);
    this.load.image(fxTextureKey('hit-spark'), ASSET_PATHS.fxHitSpark);

    for (const branch of PROJECTILE_BRANCHES) {
      this.load.image(projectileTextureKey(branch), projectileAssetPath(branch));
    }

    for (const level of CHECKPOINT_LEVELS) {
      this.load.image(checkpointTextureKey(level), checkpointAssetPath(level));
    }

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
    this.fxSpriteLayer = new FxSpriteLayer(this);
    this.assetsReady = true;

    this.cursorKeys = this.input.keyboard!.createCursorKeys();
    this.wasdKeys = this.input.keyboard!.addKeys('W,A,S,D') as GemBoardScene['wasdKeys'];
    this.zoomOutKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.zoomInKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    this.viewportMaskGfx = this.make.graphics({ x: 0, y: 0 });
    this.viewportMaskGfx.setVisible(false);
    this.viewportMask = this.viewportMaskGfx.createGeometryMask();
    this.board.setMask(this.viewportMask);
    this.boardOverlay.setMask(this.viewportMask);
    this.fx.setMask(this.viewportMask);
    this.spriteLayer.setViewportMask(this.viewportMask);
    this.fxSpriteLayer.setViewportMask(this.viewportMask);

    this.input.on('pointerdown', this.handlePointerDown, this);
    this.input.on('pointermove', this.handlePointerMove, this);
    this.input.on('pointerup', this.handlePointerUp, this);
    this.input.on('wheel', this.handleWheel, this);
    this.input.on('gameout', this.clearHover, this);
    this.input.on('pointerout', this.clearHover, this);
    this.game.canvas.addEventListener('contextmenu', this.preventContextMenu);
  }

  shutdown(): void {
    this.input.off('pointerdown', this.handlePointerDown, this);
    this.input.off('pointermove', this.handlePointerMove, this);
    this.input.off('pointerup', this.handlePointerUp, this);
    this.input.off('wheel', this.handleWheel, this);
    this.ghostSprite?.destroy();
    this.ghostSprite = null;
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

    this.updateKeyboardPan(delta);
    this.updateDragPan();

    const baseLayout = computeLayout(this.scale.width, this.scale.height);
    const zoomedLayout = layoutWithZoom(baseLayout, this.zoom);
    const clamped = clampBoardScroll(zoomedLayout, this.scrollX, this.scrollY);
    this.scrollX = clamped.scrollX;
    this.scrollY = clamped.scrollY;
    const nextLayout = withBoardScroll(zoomedLayout, this.scrollX, this.scrollY);

    const layoutChanged =
      nextLayout.width !== this.lastLayoutWidth || nextLayout.height !== this.lastLayoutHeight;
    this.layout = nextLayout;
    this.spriteLayer.setLayout(nextLayout);
    this.lastLayoutWidth = nextLayout.width;
    this.lastLayoutHeight = nextLayout.height;
    if (layoutChanged) {
      this.spriteLayer.pruneAll(this.fxLabels);
    }
    this.updateViewportMask();
    this.drawBoard(state);
    this.drawSprites(state);
    this.syncPlacementGhost(state);
    this.drawFx(state);
  }

  private updateKeyboardPan(delta: number): void {
    const step = (BOARD_PAN_SPEED * delta) / 1000;
    let dx = 0;
    let dy = 0;
    if (this.cursorKeys.left?.isDown || this.wasdKeys.A?.isDown) dx -= step;
    if (this.cursorKeys.right?.isDown || this.wasdKeys.D?.isDown) dx += step;
    if (this.cursorKeys.up?.isDown || this.wasdKeys.W?.isDown) dy -= step;
    if (this.cursorKeys.down?.isDown || this.wasdKeys.S?.isDown) dy += step;
    if (dx !== 0) this.scrollX += dx;
    if (dy !== 0) this.scrollY += dy;

    if (Phaser.Input.Keyboard.JustDown(this.zoomOutKey)) {
      this.applyZoom(
        this.zoom * 0.9,
        this.layout.left + this.layout.width / 2,
        this.layout.top + this.layout.height / 2,
      );
    }
    if (Phaser.Input.Keyboard.JustDown(this.zoomInKey)) {
      this.applyZoom(
        this.zoom * 1.1,
        this.layout.left + this.layout.width / 2,
        this.layout.top + this.layout.height / 2,
      );
    }
  }

  private handleWheel = (
    pointer: Phaser.Input.Pointer,
    _gameObjects: Phaser.GameObjects.GameObject[],
    _deltaX: number,
    deltaY: number,
  ): void => {
    if (!isPointInBoardViewport(this.layout, pointer.x, pointer.y)) return;
    const factor = deltaY > 0 ? 0.92 : 1.08;
    const canvasPoint = this.pointerCanvasPoint(pointer);
    this.applyZoom(this.zoom * factor, canvasPoint.x, canvasPoint.y);
  };

  private applyZoom(nextZoom: number, anchorX: number, anchorY: number): void {
    const baseLayout = computeLayout(this.scale.width, this.scale.height);
    const current = withBoardScroll(
      layoutWithZoom(baseLayout, this.zoom),
      this.scrollX,
      this.scrollY,
    );
    const next = zoomBoardAt(current, this.scrollX, this.scrollY, nextZoom, anchorX, anchorY);
    this.zoom = next.zoom;
    this.scrollX = next.scrollX;
    this.scrollY = next.scrollY;
  }

  private updateDragPan(): void {
    if (!this.isPanning) return;
    const canvasPoint = this.pointerCanvasPoint(this.input.activePointer);
    this.scrollX = this.panScrollStartX - (canvasPoint.x - this.panAnchorX);
    this.scrollY = this.panScrollStartY - (canvasPoint.y - this.panAnchorY);
  }

  private updateViewportMask(): void {
    this.viewportMaskGfx.clear();
    this.viewportMaskGfx.fillStyle(0xffffff, 1);
    this.viewportMaskGfx.fillRect(
      this.layout.left,
      this.layout.top,
      this.layout.width,
      this.layout.height,
    );
  }

  private shouldStartPan(pointer: Phaser.Input.Pointer): boolean {
    const event = pointer.event as MouseEvent | undefined;
    if (pointer.middleButtonDown()) return true;
    return pointer.leftButtonDown() && event?.shiftKey === true;
  }

  private startPan(canvasPoint: Vec2): void {
    this.isPanning = true;
    this.panAnchorX = canvasPoint.x;
    this.panAnchorY = canvasPoint.y;
    this.panScrollStartX = this.scrollX;
    this.panScrollStartY = this.scrollY;
    this.input.manager.canvas.style.cursor = 'grabbing';
  }

  private stopPan(): void {
    this.isPanning = false;
    this.input.manager.canvas.style.cursor = 'default';
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
    if (this.isPanning) {
      this.updateDragPan();
      return;
    }

    const bridge = tryGetBridge();
    if (!bridge) return;
    const state = bridge.getState();
    const planning = isPlanningPhase(state.status);
    const canvasPoint = this.pointerCanvasPoint(pointer);
    this.hoverCell = screenToCell(this.layout, canvasPoint.x, canvasPoint.y);
    const boardPoint = this.hoverCell ? cellCenter(this.hoverCell) : null;
    const canPlace = boardPoint !== null && canPlaceAtBoardPoint(state, boardPoint.x, boardPoint.y);
    const prospectHover =
      planning && state.buildStep === 'prospect' && this.hoverCell
        ? findRawGemAtCell(state, this.hoverCell)
        : undefined;
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
    this.input.manager.canvas.style.cursor = prospectHover || canPlace ? 'pointer' : 'crosshair';
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    const canvasPoint = this.pointerCanvasPoint(pointer);
    if (
      this.shouldStartPan(pointer) &&
      isPointInBoardViewport(this.layout, canvasPoint.x, canvasPoint.y)
    ) {
      this.startPan(canvasPoint);
      return;
    }

    const bridge = tryGetBridge();
    if (!bridge) return;
    const state = bridge.getState();
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

    if (planning && state.buildStep === 'prospect') {
      const raw = findRawGemAtCell(state, cell);
      if (raw) {
        bridge.dispatch({ type: 'commitRawGem', rawGemId: raw.id });
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

  private handlePointerUp(): void {
    if (this.isPanning) this.stopPan();
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
      drawGridOverlay(overlay, this.layout, gridOverlayAlpha(state));
      drawCheckpointRoute(overlay, this.layout, state.pathNav.checkpoints);
      drawPathOverlay(overlay, this.layout, state.pathNav);
      if (
        state.buildStep === 'prospect' &&
        this.hoverCell &&
        findRawGemAtCell(state, this.hoverCell)
      ) {
        drawProspectHighlight(overlay, this.layout, this.hoverCell);
      }
      drawPlacementPreview(overlay, this.layout, state, this.hoverCell);
    }
  }

  private syncPlacementGhost(state: GameState): void {
    const ghost = resolvePlacementGhost(state, this.hoverCell);
    if (!ghost || !this.hoverCell || !this.assetsReady || !this.textures.exists(ghost.textureKey)) {
      this.ghostSprite?.setVisible(false);
      return;
    }

    if (!this.ghostSprite) {
      this.ghostSprite = this.add.image(0, 0, ghost.textureKey).setOrigin(0.5, 0.78).setDepth(2.4);
      this.ghostSprite.setMask(this.viewportMask);
    }

    const point = cellToScreen(this.layout, this.hoverCell);
    const tile = effectiveTileSize(this.layout);
    const size = tile * (1.15 + ghost.level * 0.04);
    this.ghostSprite
      .setTexture(ghost.textureKey)
      .setPosition(point.x, point.y + tile * 0.06)
      .setDisplaySize(size, size)
      .clearTint()
      .setTint(ghost.canPlace ? 0xffffff : 0xff9d9d)
      .setAlpha(ghost.canPlace ? 0.5 : 0.35)
      .setVisible(true);
  }

  private drawSprites(state: GameState): void {
    if (!this.assetsReady) return;
    this.spriteLayer.sync(state, this.boardOverlay);
  }

  private drawFx(state: GameState): void {
    const g = this.fx;
    g.clear();
    if (this.assetsReady) {
      this.fxSpriteLayer.sync(state, this.layout);
    }
    const hasProjectileSprites = PROJECTILE_BRANCHES.some((branch) =>
      this.textures.exists(projectileTextureKey(branch)),
    );
    if (!hasProjectileSprites) {
      for (const projectile of state.projectiles) {
        if (!projectile.active) continue;
        const color = Phaser.Display.Color.HexStringToColor(projectile.color).color;
        const point = boardToScreen(this.layout, projectile);
        g.fillStyle(color, 0.95);
        g.fillCircle(point.x, point.y, Math.max(3, effectiveTileSize(this.layout) * 0.12));
      }
    }
    const ghost = resolvePlacementGhost(state, this.hoverCell);
    if (ghost?.showRange && this.hoverCell) {
      const point = cellToScreen(this.layout, this.hoverCell);
      const color = Phaser.Display.Color.HexStringToColor(ghost.rangeColor).color;
      g.lineStyle(2, color, 0.34);
      g.strokeCircle(point.x, point.y, rangeToPixels(this.layout, ghost.range));
    }
    updateFxLabels(this, this.layout, this.fxLabels, state.fxEvents, this.viewportMask);
  }
}
