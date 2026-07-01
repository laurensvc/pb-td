#!/usr/bin/env node
/**
 * Export placeholder PNG spritesheets for every vertical-slice catalog entry.
 * Emergency fallback when PixelLab assets are missing or rejected.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PNG } from 'pngjs'
import { VERTICAL_SLICE_CATALOG } from './asset-catalog.mjs'

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)))

const SHAPES = {
  tile: 0,
  enemy: 1,
  tower: 2,
  landmark: 3,
  projectile: 4,
  fx: 5,
}

const COLORS = {
  'terrain.default-floor': [0x3d, 0x6b, 0x3d],
  'terrain.path-floor': [0x4a, 0x67, 0x41],
  'terrain.blocked-floor': [0x2c, 0x3e, 0x50],
  'env.spawn-gate': [0x5d, 0xad, 0xe2],
  'env.goal-nexus': [0xe7, 0x4c, 0x3c],
  'env.rock': [0x6e, 0x6e, 0x6e],
  'fx.selection-ring': [0x2e, 0xcc, 0x71],
  'fx.invalid-ring': [0xe7, 0x4c, 0x3c],
  'projectile.flame-bolt': [0xe6, 0x7e, 0x22],
  'projectile.stone-shard': [0xbd, 0xc3, 0xc7],
  'projectile.thorn-spore': [0x27, 0xae, 0x60],
  'projectile.magma-core-shot': [0xc0, 0x39, 0x2b],
}

/** @param {number} hex @returns {[number, number, number]} */
function rgb(hex) {
  return [(hex >> 16) & 0xff, (hex >> 8) & 0xff, hex & 0xff]
}

/** @param {import('./asset-catalog.mjs').AssetCatalogEntry} entry */
function baseColor(entry) {
  if (COLORS[entry.id]) return COLORS[entry.id]
  if (entry.id.startsWith('env.checkpoint')) return [0xf3, 0x9c, 0x12]
  if (entry.id.startsWith('enemy.')) return [0x95, 0xa5, 0xa6]
  if (entry.id.includes('flame')) return [0xe7, 0x4c, 0x3c]
  if (entry.id.includes('stone')) return [0xbd, 0xc3, 0xc7]
  if (entry.id.includes('thorn')) return [0x2e, 0xcc, 0x71]
  if (entry.id.includes('magma')) return [0xc0, 0x39, 0x2b]
  if (entry.category === 'fx') return [0xf1, 0xc4, 0x0f]
  return [0x7f, 0x8c, 0x8d]
}

/**
 * @param {PNG} png
 * @param {number} x0
 * @param {number} y0
 * @param {number} w
 * @param {number} h
 * @param {[number, number, number]} color
 * @param {number} alpha
 */
function fillRect(png, x0, y0, w, h, color, alpha = 255) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      const i = (png.width * y + x) << 2
      png.data[i] = color[0]
      png.data[i + 1] = color[1]
      png.data[i + 2] = color[2]
      png.data[i + 3] = alpha
    }
  }
}

/** @param {import('./asset-catalog.mjs').AssetCatalogEntry} entry */
function drawFrame(entry, frameIndex) {
  const png = new PNG({ width: entry.frameWidth, height: entry.frameHeight })
  const [r, g, b] = baseColor(entry)
  const pulse = 1 + Math.sin((frameIndex / 6) * Math.PI * 2) * 0.06
  const cx = entry.frameWidth / 2
  const cy = entry.frameHeight / 2

  if (entry.category === 'terrain') {
    fillRect(png, 0, 0, entry.frameWidth, entry.frameHeight, [r, g, b])
    if (frameIndex % 2 === 0)
      fillRect(png, 4, 4, 6, 6, [
        Math.min(255, r + 20),
        Math.min(255, g + 20),
        Math.min(255, b + 20),
      ])
    return png
  }

  if (entry.id.includes('ring')) {
    const radius = Math.min(entry.frameWidth, entry.frameHeight) * 0.38
    for (let y = 0; y < entry.frameHeight; y++) {
      for (let x = 0; x < entry.frameWidth; x++) {
        const dx = x - cx
        const dy = y - cy
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > radius - 2 && dist < radius + 2) {
          const i = (png.width * y + x) << 2
          png.data[i] = r
          png.data[i + 1] = g
          png.data[i + 2] = b
          png.data[i + 3] = 90
        }
      }
    }
    return png
  }

  const size = Math.min(entry.frameWidth, entry.frameHeight) * 0.35 * pulse
  fillRect(
    png,
    Math.floor(cx - size),
    Math.floor(cy - size * 0.8),
    Math.floor(size * 2),
    Math.floor(size * 1.6),
    [r, g, b],
    entry.category === 'enemy' ? 220 : 255,
  )
  return png
}

/** @param {import('./asset-catalog.mjs').AssetCatalogEntry} entry */
function buildSheet(entry) {
  const frames = Math.max(1, entry.frames)
  const sheet = new PNG({
    width: entry.frameWidth * frames,
    height: entry.frameHeight,
  })
  for (let f = 0; f < frames; f++) {
    const frame = drawFrame(entry, f)
    frame.data.copy(sheet.data, f * entry.frameWidth * 4, 0, frame.data.length)
  }
  return sheet
}

const only = process.argv
  .find((a) => a.startsWith('--only='))
  ?.slice(7)
  ?.split(',')
const entries = only
  ? VERTICAL_SLICE_CATALOG.filter((e) => only.includes(e.id))
  : VERTICAL_SLICE_CATALOG

let written = 0
for (const entry of entries) {
  const abs = resolve(ROOT, entry.exportPath)
  mkdirSync(dirname(abs), { recursive: true })
  const sheet = buildSheet(entry)
  writeFileSync(abs, PNG.sync.write(sheet))
  written++
  console.log(`[assets:generate] ${entry.id} -> ${entry.exportPath}`)
}
console.log(`[assets:generate] wrote ${written} PNG(s)`)
