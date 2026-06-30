import Phaser from 'phaser'
import type { GameEvent, GameSnapshot } from '@facet/protocol'
import type { GameBridge } from '../../bridge/game-bridge.js'
import { CameraController } from '../CameraController.js'
import { BuildOverlayLayer } from '../layers/BuildOverlayLayer.js'
import { FxLayer } from '../layers/FxLayer.js'
import { LandmarkLayer } from '../layers/LandmarkLayer.js'
import { StructureLayer } from '../layers/StructureLayer.js'
import { TerrainLayer } from '../layers/TerrainLayer.js'
import { UnitLayer } from '../layers/UnitLayer.js'
import { snapFootprint, worldToGrid } from '@facet/sim'

export class BoardScene extends Phaser.Scene {
  private bridge: GameBridge | null = null
  private unsubscribeSnapshot: (() => void) | null = null
  private unsubscribeEvents: (() => void) | null = null
  private snapshot: GameSnapshot | null = null
  private cameraController: CameraController | null = null
  private unsubscribeCameraFocus: (() => void) | null = null
  private terrain: TerrainLayer | null = null
  private landmarks: LandmarkLayer | null = null
  private structures: StructureLayer | null = null
  private units: UnitLayer | null = null
  private fx: FxLayer | null = null
  private buildOverlay: BuildOverlayLayer | null = null

  constructor() {
    super('BoardScene')
  }

  init(data: { bridge?: GameBridge }): void {
    this.bridge = data.bridge ?? null
  }

  create(): void {
    const bridge = this.bridge
    if (!bridge) {
      this.add.text(16, 16, 'Bridge missing', { color: '#e74c3c' })
      return
    }

    const snapshot = bridge.getSnapshot()
    this.snapshot = snapshot
    const { tileSize, worldWidth, worldHeight, cameraBounds } = snapshot.board

    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight)
    this.cameras.main.setZoom(1)
    this.scale.resize(Math.min(960, worldWidth), Math.min(640, worldHeight))

    this.terrain = new TerrainLayer(this)
    this.landmarks = new LandmarkLayer(this)
    this.structures = new StructureLayer(this, tileSize)
    this.units = new UnitLayer(this, tileSize)
    this.fx = new FxLayer(this)
    this.buildOverlay = new BuildOverlayLayer(this, tileSize)
    this.cameraController = new CameraController(this, cameraBounds, {
      resolveLandmarkCenter: (landmarkId) =>
        this.landmarks?.getWorldCenter(landmarkId, tileSize) ?? null,
    })

    this.unsubscribeCameraFocus = bridge.onCameraFocus((landmarkId) => {
      this.cameraController?.focusLandmark(landmarkId)
    })

    const focus = this.landmarks.getWorldCenter(snapshot.board.startFocusLandmarkId, tileSize)
    if (focus) {
      this.cameraController.focusWorldPoint(focus.x, focus.y)
    }

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!bridge || pointer.middleButtonDown()) return
      const world = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2
      const grid = worldToGrid(world.x, world.y)
      bridge.dispatch({ type: 'pointer.hoverFootprint', gx: grid.gx, gy: grid.gy })
    })

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!bridge || pointer.middleButtonDown() || pointer.rightButtonDown()) return
      if (this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE).isDown) return
      const world = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2
      if (this.snapshot?.phase === 'placement') {
        const grid = snapFootprint(
          worldToGrid(world.x, world.y).gx,
          worldToGrid(world.x, world.y).gy,
        )
        bridge.dispatch({ type: 'pointer.hoverFootprint', gx: grid.gx, gy: grid.gy })
        bridge.dispatch({ type: 'pointer.placeAtHoveredFootprint' })
        return
      }
      const structureId = this.structures?.hitTest(world.x, world.y, this.snapshot!) ?? null
      if (structureId) {
        bridge.dispatch({ type: 'pointer.selectStructure', structureId })
      }
    })

    this.unsubscribeSnapshot = bridge.onSnapshot((next: GameSnapshot) => {
      this.snapshot = next
      this.syncLayers(next)
    })

    this.unsubscribeEvents = bridge.onEvent((event: GameEvent) => {
      if (event.type === 'tower.fired' && this.snapshot) {
        const creep = this.snapshot.creeps.find((c) => c.id === event.creepId)
        if (creep) this.fx?.spawnHit(creep.worldPos.x, creep.worldPos.y)
      }
    })

    this.syncLayers(snapshot)
  }

  update(): void {
    this.cameraController?.update()
  }

  shutdown(): void {
    this.unsubscribeSnapshot?.()
    this.unsubscribeEvents?.()
    this.unsubscribeCameraFocus?.()
    this.terrain?.destroy()
    this.landmarks?.destroy()
    this.structures?.destroy()
    this.units?.destroy()
    this.fx?.destroy()
    this.buildOverlay?.destroy()
  }

  private syncLayers(snapshot: GameSnapshot): void {
    this.terrain?.sync(snapshot)
    this.landmarks?.sync(snapshot)
    this.structures?.sync(snapshot)
    this.units?.sync(snapshot)
    this.buildOverlay?.sync(snapshot)
  }
}
