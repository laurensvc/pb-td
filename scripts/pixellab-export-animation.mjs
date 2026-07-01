#!/usr/bin/env node
/**
 * Download PixelLab character animation frames and stitch into a horizontal spritesheet.
 *
 * Usage:
 *   node scripts/pixellab-export-animation.mjs --asset=enemy.stone-grunt.walk --urls=url1,url2,... [--skip-ref]
 */
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PNG } from 'pngjs'
import { getCatalogEntry } from './asset-catalog.mjs'
import { stitchFramesHorizontally, upsertJob } from './pixellab-export.mjs'

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)))

/** Nearest-neighbor downscale/upscale to target dimensions. */
function resizeFrame(buffer, targetW, targetH) {
  const src = PNG.sync.read(buffer)
  if (src.width === targetW && src.height === targetH) return buffer
  const dst = new PNG({ width: targetW, height: targetH })
  for (let y = 0; y < targetH; y++) {
    for (let x = 0; x < targetW; x++) {
      const sx = Math.floor((x / targetW) * src.width)
      const sy = Math.floor((y / targetH) * src.height)
      const si = (src.width * sy + sx) << 2
      const di = (targetW * y + x) << 2
      dst.data[di] = src.data[si]
      dst.data[di + 1] = src.data[si + 1]
      dst.data[di + 2] = src.data[si + 2]
      dst.data[di + 3] = src.data[si + 3]
    }
  }
  return PNG.sync.write(dst)
}
const assetId = process.argv.find((a) => a.startsWith('--asset='))?.slice(8)
const urlsArg = process.argv.find((a) => a.startsWith('--urls='))?.slice(7)
const characterId = process.argv.find((a) => a.startsWith('--characterId='))?.slice(14)
const skipRef = process.argv.includes('--skip-ref')

if (!assetId || !urlsArg) {
  console.error(
    'Usage: pixellab-export-animation.mjs --asset=ID --urls=url1,url2,... [--skip-ref] [--characterId=]',
  )
  process.exit(1)
}

const entry = getCatalogEntry(assetId)
if (!entry) {
  console.error(`Unknown asset: ${assetId}`)
  process.exit(1)
}

let urls = urlsArg
  .split(',')
  .map((u) => u.trim())
  .filter(Boolean)
if (skipRef && urls.length > entry.frames) {
  urls = urls.slice(1, 1 + entry.frames)
} else if (urls.length > entry.frames) {
  urls = urls.slice(urls.length - entry.frames)
}

const buffers = await Promise.all(
  urls.map(async (url) => {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Failed ${url}: ${res.status}`)
    const raw = Buffer.from(await res.arrayBuffer())
    return resizeFrame(raw, entry.frameWidth, entry.frameHeight)
  }),
)

const sheet = stitchFramesHorizontally(buffers, entry.frameWidth, entry.frameHeight)
const abs = resolve(ROOT, entry.exportPath)
writeFileSync(abs, sheet)

upsertJob({
  assetId,
  status: 'accepted',
  exportPath: entry.exportPath,
  characterId,
  pixellabTool: 'animate_character',
  notes: `Exported ${urls.length} frames`,
})

console.log(`[pixellab-export-animation] ${assetId} -> ${entry.exportPath} (${urls.length} frames)`)
