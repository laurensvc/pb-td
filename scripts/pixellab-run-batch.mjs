#!/usr/bin/env node
/**
 * Generate procedural fallback PNGs for catalog entries not yet on disk.
 *
 * Usage:
 *   node scripts/pixellab-run-batch.mjs --batch=3
 *   node scripts/pixellab-run-batch.mjs --all-missing
 */
import { spawnSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { catalogByBatch, VERTICAL_SLICE_CATALOG } from './asset-catalog.mjs'
import { assetExists, upsertJob } from './pixellab-export.mjs'

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)))
const batchArg = process.argv.find((a) => a.startsWith('--batch='))?.slice(8)
const allMissing = process.argv.includes('--all-missing')

function missingEntries() {
  const batch = batchArg ? Number(batchArg) : undefined
  const entries = batch ? catalogByBatch(batch) : VERTICAL_SLICE_CATALOG
  return entries.filter((e) => !assetExists(e.exportPath))
}

const missing = missingEntries()
if (missing.length === 0) {
  console.log(batchArg ? `Batch ${batchArg}: nothing missing` : 'No missing assets')
  process.exit(0)
}

const ids = missing.map((e) => e.id).join(',')
const result = spawnSync(process.execPath, ['scripts/generate-pixel-art.mjs', `--only=${ids}`], {
  cwd: ROOT,
  stdio: 'inherit',
})

if (result.status !== 0) process.exit(result.status ?? 1)

for (const entry of missing) {
  upsertJob({
    assetId: entry.id,
    status: 'fallback',
    exportPath: entry.exportPath,
    pixellabTool: 'generate-pixel-art',
    notes: 'Procedural fallback PNG until PixelLab asset accepted',
  })
}

console.log(`[pixellab-run-batch] generated ${missing.length} fallback asset(s)`)
