#!/usr/bin/env node
/**
 * Inspect vertical-slice asset export status against catalog + job ledger.
 *
 * Usage:
 *   node scripts/pixellab-sync.mjs status
 *   node scripts/pixellab-sync.mjs missing [--batch=N]
 *   node scripts/pixellab-sync.mjs record --asset=ID --status=accepted --objectId=...
 */
import { VERTICAL_SLICE_CATALOG, catalogByBatch } from './asset-catalog.mjs'
import { assetExists, getJob, loadJobs, upsertJob } from './pixellab-export.mjs'

const [cmd = 'status', ...rest] = process.argv.slice(2)

function arg(name) {
  const hit = rest.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : undefined
}

function printStatus() {
  const jobs = loadJobs().jobs
  const byStatus = /** @type {Record<string, number>} */ ({})
  let onDisk = 0
  for (const entry of VERTICAL_SLICE_CATALOG) {
    if (assetExists(entry.exportPath)) onDisk++
    const job = jobs.find((j) => j.assetId === entry.id)
    const status = job?.status ?? (assetExists(entry.exportPath) ? 'accepted' : 'pending')
    byStatus[status] = (byStatus[status] ?? 0) + 1
  }
  console.log(`Vertical slice catalog: ${VERTICAL_SLICE_CATALOG.length} assets`)
  console.log(`On disk: ${onDisk}`)
  console.log('By job/status:', byStatus)
}

function printMissing() {
  const batch = arg('batch') ? Number(arg('batch')) : undefined
  const entries = batch ? catalogByBatch(batch) : VERTICAL_SLICE_CATALOG
  const missing = entries.filter((e) => !assetExists(e.exportPath))
  if (missing.length === 0) {
    console.log(batch ? `Batch ${batch}: all assets on disk` : 'All assets on disk')
    return
  }
  for (const e of missing) {
    const job = getJob(e.id)
    console.log(`${e.id}\tbatch=${e.batch}\tjob=${job?.status ?? 'none'}`)
  }
  console.log(`Missing: ${missing.length}/${entries.length}`)
}

function recordJob() {
  const assetId = arg('asset')
  const status = arg('status')
  if (!assetId || !status) {
    console.error(
      'Usage: record --asset=ID --status=STATUS [--objectId=] [--characterId=] [--notes=]',
    )
    process.exit(1)
  }
  const entry = VERTICAL_SLICE_CATALOG.find((e) => e.id === assetId)
  if (!entry) {
    console.error(`Unknown asset id: ${assetId}`)
    process.exit(1)
  }
  upsertJob({
    assetId,
    status,
    exportPath: entry.exportPath,
    objectId: arg('objectId'),
    characterId: arg('characterId'),
    animationGroupId: arg('animationGroupId'),
    notes: arg('notes'),
    pixellabTool: arg('tool'),
  })
  console.log(`Recorded ${assetId} -> ${status}`)
}

switch (cmd) {
  case 'status':
    printStatus()
    break
  case 'missing':
    printMissing()
    break
  case 'record':
    recordJob()
    break
  default:
    console.error(`Unknown command: ${cmd}`)
    process.exit(1)
}
