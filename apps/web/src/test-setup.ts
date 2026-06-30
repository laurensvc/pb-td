import { vi } from 'vitest'

class CanvasContext2DStub {
  fillStyle = ''
  strokeStyle = ''
  lineWidth = 1
  font = ''
  textAlign = 'start'
  textBaseline = 'alphabetic'
  globalAlpha = 1

  save() {}
  restore() {}
  clearRect() {}
  fillRect() {}
  strokeRect() {}
  fillText() {}
  beginPath() {}
  closePath() {}
  moveTo() {}
  lineTo() {}
  arc() {}
  ellipse() {}
  fill() {}
  stroke() {}
  translate() {}
  getImageData() {
    return { data: new Uint8ClampedArray(4) }
  }
}

const canvasStore = new WeakMap<HTMLCanvasElement, { width: number; height: number }>()

// Vitest jsdom stub — keep typing loose so app tsconfig stays strict.
;(
  HTMLCanvasElement.prototype as { getContext: typeof HTMLCanvasElement.prototype.getContext }
).getContext = vi.fn(function (this: HTMLCanvasElement) {
  return new CanvasContext2DStub() as unknown as CanvasRenderingContext2D
}) as typeof HTMLCanvasElement.prototype.getContext

Object.defineProperty(HTMLCanvasElement.prototype, 'width', {
  get(this: HTMLCanvasElement) {
    return canvasStore.get(this)?.width ?? 0
  },
  set(this: HTMLCanvasElement, value: number) {
    const state = canvasStore.get(this) ?? { width: 0, height: 0 }
    state.width = value
    canvasStore.set(this, state)
  },
})

Object.defineProperty(HTMLCanvasElement.prototype, 'height', {
  get(this: HTMLCanvasElement) {
    return canvasStore.get(this)?.height ?? 0
  },
  set(this: HTMLCanvasElement, value: number) {
    const state = canvasStore.get(this) ?? { width: 0, height: 0 }
    state.height = value
    canvasStore.set(this, state)
  },
})
