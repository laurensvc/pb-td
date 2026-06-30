import Phaser from 'phaser'

export const CAMERA_MIN_ZOOM = 0.5
export const CAMERA_MAX_ZOOM = 2.0
const ZOOM_STEP_FACTOR = 1.1
const PAN_SPEED = 8

export type LandmarkCenterResolver = (landmarkId: string) => { x: number; y: number } | null

export class CameraController {
  private readonly scene: Phaser.Scene
  private readonly bounds: Phaser.Geom.Rectangle
  private readonly resolveLandmarkCenter: LandmarkCenterResolver | null
  private readonly wasd: {
    W: Phaser.Input.Keyboard.Key
    A: Phaser.Input.Keyboard.Key
    S: Phaser.Input.Keyboard.Key
    D: Phaser.Input.Keyboard.Key
  }
  private readonly arrows: Phaser.Types.Input.Keyboard.CursorKeys
  private readonly spaceKey: Phaser.Input.Keyboard.Key
  private readonly homeKey: Phaser.Input.Keyboard.Key
  private readonly endKey: Phaser.Input.Keyboard.Key
  private readonly centerKey: Phaser.Input.Keyboard.Key
  private readonly zoomInKeys: Phaser.Input.Keyboard.Key[]
  private readonly zoomOutKeys: Phaser.Input.Keyboard.Key[]
  private middleDragging = false
  private spaceDragging = false
  private lastPointer = { x: 0, y: 0 }

  constructor(
    scene: Phaser.Scene,
    bounds: [number, number, number, number],
    options: { resolveLandmarkCenter?: LandmarkCenterResolver } = {},
  ) {
    this.scene = scene
    const [x, y, w, h] = bounds
    this.bounds = new Phaser.Geom.Rectangle(x, y, w, h)
    this.resolveLandmarkCenter = options.resolveLandmarkCenter ?? null
    const keyboard = scene.input.keyboard
    if (!keyboard) {
      throw new Error('Keyboard plugin unavailable')
    }
    this.wasd = keyboard.addKeys('W,A,S,D') as CameraController['wasd']
    this.arrows = keyboard.createCursorKeys()
    this.spaceKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.homeKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.HOME)
    this.endKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.END)
    this.centerKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C)
    this.zoomInKeys = [
      keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.PLUS),
      keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_ADD),
      keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.PAGE_UP),
    ]
    this.zoomOutKeys = [
      keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.MINUS),
      keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_SUBTRACT),
      keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.PAGE_DOWN),
    ]

    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.middleButtonDown()) {
        this.middleDragging = true
        this.lastPointer = { x: pointer.x, y: pointer.y }
        return
      }
      if (pointer.leftButtonDown() && this.spaceKey.isDown) {
        this.spaceDragging = true
        this.lastPointer = { x: pointer.x, y: pointer.y }
      }
    })
    scene.input.on('pointerup', () => {
      this.middleDragging = false
      this.spaceDragging = false
    })
    scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.middleDragging && !this.spaceDragging) return
      const cam = scene.cameras.main
      cam.scrollX -= (pointer.x - this.lastPointer.x) / cam.zoom
      cam.scrollY -= (pointer.y - this.lastPointer.y) / cam.zoom
      this.lastPointer = { x: pointer.x, y: pointer.y }
      this.clamp()
    })
    scene.input.on(
      'wheel',
      (
        pointer: Phaser.Input.Pointer,
        _over: Phaser.GameObjects.GameObject[],
        _deltaX: number,
        deltaY: number,
      ) => {
        if (deltaY === 0) return
        this.zoomAtScreen(pointer.x, pointer.y, deltaY < 0 ? 1 : -1)
      },
    )
  }

  focusWorldPoint(x: number, y: number): void {
    const cam = this.scene.cameras.main
    cam.centerOn(x, y)
    this.clamp()
  }

  focusLandmark(landmarkId: string): boolean {
    const center = this.resolveLandmarkCenter?.(landmarkId)
    if (!center) return false
    this.focusWorldPoint(center.x, center.y)
    return true
  }

  update(): void {
    const cam = this.scene.cameras.main
    let dx = 0
    let dy = 0
    if (this.wasd.A.isDown || this.arrows.left.isDown) dx -= PAN_SPEED
    if (this.wasd.D.isDown || this.arrows.right.isDown) dx += PAN_SPEED
    if (this.wasd.W.isDown || this.arrows.up.isDown) dy -= PAN_SPEED
    if (this.wasd.S.isDown || this.arrows.down.isDown) dy += PAN_SPEED
    if (dx !== 0 || dy !== 0) {
      cam.scrollX += dx
      cam.scrollY += dy
      this.clamp()
    }

    if (this.zoomInKeys.some((key) => Phaser.Input.Keyboard.JustDown(key))) {
      this.zoomAtScreen(cam.width / 2, cam.height / 2, 1)
    } else if (this.zoomOutKeys.some((key) => Phaser.Input.Keyboard.JustDown(key))) {
      this.zoomAtScreen(cam.width / 2, cam.height / 2, -1)
    }

    if (Phaser.Input.Keyboard.JustDown(this.homeKey)) {
      this.focusLandmark('spawn')
    } else if (Phaser.Input.Keyboard.JustDown(this.endKey)) {
      this.focusLandmark('goal')
    } else if (Phaser.Input.Keyboard.JustDown(this.centerKey)) {
      this.focusLandmark('checkpoint-1')
    }
  }

  private zoomAtScreen(screenX: number, screenY: number, direction: 1 | -1): void {
    const cam = this.scene.cameras.main
    const worldX = cam.scrollX + screenX / cam.zoom
    const worldY = cam.scrollY + screenY / cam.zoom
    const factor = direction > 0 ? ZOOM_STEP_FACTOR : 1 / ZOOM_STEP_FACTOR
    const newZoom = Phaser.Math.Clamp(
      Phaser.Math.RoundTo(cam.zoom * factor, -2),
      CAMERA_MIN_ZOOM,
      CAMERA_MAX_ZOOM,
    )
    if (newZoom === cam.zoom) return
    cam.setZoom(newZoom)
    cam.scrollX = worldX - screenX / newZoom
    cam.scrollY = worldY - screenY / newZoom
    this.clamp()
  }

  private clamp(): void {
    const cam = this.scene.cameras.main
    const vw = cam.width / cam.zoom
    const vh = cam.height / cam.zoom
    const minX = this.bounds.x
    const minY = this.bounds.y
    const maxX = Math.max(minX, this.bounds.width - vw)
    const maxY = Math.max(minY, this.bounds.height - vh)
    cam.scrollX = Phaser.Math.Clamp(cam.scrollX, minX, maxX)
    cam.scrollY = Phaser.Math.Clamp(cam.scrollY, minY, maxY)
  }
}
