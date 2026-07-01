#!/usr/bin/env node
/**
 * Download a remote PNG into a catalog export path and record job status.
 *
 * Usage:
 *   node scripts/pixellab-pull.mjs --asset=env.spawn-gate --url=https://...
 */
import { getCatalogEntry } from './asset-catalog.mjs'
import { downloadToRepo, upsertJob, validateExportedSheet } from './pixellab-export.mjs'

const assetId = process.argv.find((a) => a.startsWith('--asset='))?.slice(8)
const url = process.argv.find((a) => a.startsWith('--url='))?.slice(6)
const objectId = process.argv.find((a) => a.startsWith('--objectId='))?.slice(11)
const status = process.argv.find((a) => a.startsWith('--status='))?.slice(9) ?? 'accepted'

if (!assetId || !url) {
  console.error('Usage: pixellab-pull.mjs --asset=ID --url=URL [--objectId=] [--status=accepted]')
  process.exit(1)
}

const entry = getCatalogEntry(assetId)
if (!entry) {
  console.error(`Unknown asset: ${assetId}`)
  process.exit(1)
}

const abs = await downloadToRepo(url, entry.exportPath)
const validation = await validateExportedSheet(abs, entry)
if (!validation.ok) {
  console.warn(`[pixellab-pull] dimension warning for ${assetId}: ${validation.message}`)
}

upsertJob({
  assetId,
  status,
  exportPath: entry.exportPath,
  objectId,
  pixellabTool: 'pull',
  notes: validation.ok ? 'dimensions ok' : validation.message,
})

console.log(`[pixellab-pull] ${assetId} -> ${entry.exportPath}`)
