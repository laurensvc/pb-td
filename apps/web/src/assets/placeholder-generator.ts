import type { AssetManifestEntry } from './types.js'
import { colorToCss, resolvePlaceholderStyle, type PlaceholderStyle } from './placeholder-styles.js'

function drawFrame(
  ctx: CanvasRenderingContext2D,
  style: PlaceholderStyle,
  frameIndex: number,
  frameWidth: number,
  frameHeight: number,
): void {
  const cx = frameWidth / 2
  const cy = frameHeight / 2
  const pulse = 1 + Math.sin((frameIndex / 6) * Math.PI * 2) * 0.06
  const tierScale = 0.55 + (style.tier ?? 1) * 0.08

  ctx.clearRect(0, 0, frameWidth, frameHeight)

  switch (style.shape) {
    case 'tile': {
      ctx.fillStyle = colorToCss(style.fill, style.alpha)
      ctx.fillRect(0, 0, frameWidth, frameHeight)
      ctx.strokeStyle = colorToCss(style.stroke, 0.35)
      ctx.strokeRect(0.5, 0.5, frameWidth - 1, frameHeight - 1)
      const dot = ((frameIndex % 2) + (frameWidth % 2)) % 2
      if (dot === 0) {
        ctx.fillStyle = colorToCss(lighten(style.fill, 0.08), 0.5)
        ctx.fillRect(4, 4, 6, 6)
      }
      break
    }
    case 'gem':
    case 'tower-family':
    case 'special': {
      const size = Math.min(frameWidth, frameHeight) * 0.38 * tierScale * pulse
      drawGemBody(ctx, cx, cy, size, style, frameHeight * 0.92)
      break
    }
    case 'enemy': {
      const rx = frameWidth * 0.28 * pulse
      const ry = frameHeight * 0.22 * pulse
      ctx.fillStyle = colorToCss(style.fill, style.alpha)
      ctx.beginPath()
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.lineWidth = 2
      ctx.strokeStyle = colorToCss(style.stroke)
      ctx.stroke()
      if (style.label) {
        ctx.fillStyle = '#0f1219'
        ctx.font = 'bold 10px monospace'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(style.label, cx, cy)
      }
      break
    }
    case 'landmark': {
      const pad = frameWidth * 0.12
      const w = frameWidth - pad * 2
      const h = frameHeight - pad * 2
      ctx.fillStyle = colorToCss(style.fill, style.alpha)
      ctx.fillRect(pad, pad, w, h)
      ctx.lineWidth = 2
      ctx.strokeStyle = colorToCss(style.stroke)
      ctx.strokeRect(pad + 0.5, pad + 0.5, w - 1, h - 1)
      if (style.label) {
        ctx.fillStyle = '#0f1219'
        ctx.font = 'bold 14px monospace'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(style.label, cx, cy)
      }
      break
    }
    case 'rock': {
      ctx.fillStyle = colorToCss(style.fill, style.alpha)
      ctx.beginPath()
      ctx.moveTo(cx - frameWidth * 0.3, cy + frameHeight * 0.2)
      ctx.lineTo(cx - frameWidth * 0.1, cy - frameHeight * 0.25)
      ctx.lineTo(cx + frameWidth * 0.25, cy - frameHeight * 0.15)
      ctx.lineTo(cx + frameWidth * 0.32, cy + frameHeight * 0.22)
      ctx.closePath()
      ctx.fill()
      ctx.lineWidth = 2
      ctx.strokeStyle = colorToCss(style.stroke)
      ctx.stroke()
      break
    }
    case 'ring': {
      ctx.lineWidth = 3
      ctx.strokeStyle = colorToCss(style.fill, style.alpha)
      ctx.beginPath()
      ctx.arc(cx, cy, Math.min(frameWidth, frameHeight) * 0.38, 0, Math.PI * 2)
      ctx.stroke()
      break
    }
    case 'projectile': {
      const s = frameWidth * 0.22
      ctx.fillStyle = colorToCss(style.fill, style.alpha)
      ctx.beginPath()
      ctx.moveTo(cx + s, cy)
      ctx.lineTo(cx - s * 0.6, cy - s)
      ctx.lineTo(cx - s * 0.6, cy + s)
      ctx.closePath()
      ctx.fill()
      ctx.lineWidth = 1
      ctx.strokeStyle = colorToCss(style.stroke)
      ctx.stroke()
      break
    }
    case 'fx': {
      const rays = 4 + (frameIndex % 3)
      const radius = Math.min(frameWidth, frameHeight) * 0.32 * (1 - frameIndex * 0.04)
      ctx.strokeStyle = colorToCss(style.fill, style.alpha * (1 - frameIndex * 0.08))
      ctx.lineWidth = 2
      for (let i = 0; i < rays; i++) {
        const angle = (i / rays) * Math.PI * 2 + frameIndex * 0.2
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius)
        ctx.stroke()
      }
      break
    }
  }
}

function drawGemBody(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  style: PlaceholderStyle,
  footY: number,
): void {
  ctx.fillStyle = colorToCss(darken(style.fill, 0.35))
  ctx.fillRect(cx - size * 0.9, footY - size * 0.2, size * 1.8, size * 0.25)

  ctx.fillStyle = colorToCss(style.fill, style.alpha)
  ctx.beginPath()
  ctx.moveTo(cx, cy - size)
  ctx.lineTo(cx + size, cy)
  ctx.lineTo(cx, cy + size * 0.85)
  ctx.lineTo(cx - size, cy)
  ctx.closePath()
  ctx.fill()
  ctx.lineWidth = 2
  ctx.strokeStyle = colorToCss(style.stroke)
  ctx.stroke()
}

function lighten(color: number, amount: number): number {
  const r = Math.min(255, ((color >> 16) & 0xff) + 255 * amount)
  const g = Math.min(255, ((color >> 8) & 0xff) + 255 * amount)
  const b = Math.min(255, (color & 0xff) + 255 * amount)
  return (r << 16) | (g << 8) | b
}

function darken(color: number, amount: number): number {
  const r = Math.max(0, ((color >> 16) & 0xff) * (1 - amount))
  const g = Math.max(0, ((color >> 8) & 0xff) * (1 - amount))
  const b = Math.max(0, (color & 0xff) * (1 - amount))
  return (r << 16) | (g << 8) | b
}

/** Build a horizontal spritesheet canvas for a manifest entry. */
export function generatePlaceholderCanvas(entry: AssetManifestEntry): HTMLCanvasElement {
  const style = resolvePlaceholderStyle(entry.key)
  const frames = Math.max(1, entry.frames ?? 1)
  const canvas = document.createElement('canvas')
  canvas.width = entry.frameWidth * frames
  canvas.height = entry.frameHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error(`[assets] Canvas 2D unavailable for key ${entry.key}`)
  }

  for (let frame = 0; frame < frames; frame++) {
    ctx.save()
    ctx.translate(frame * entry.frameWidth, 0)
    drawFrame(ctx, style, frame, entry.frameWidth, entry.frameHeight)
    ctx.restore()
  }

  return canvas
}
