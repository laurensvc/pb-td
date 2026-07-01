import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pipeline } from 'node:stream/promises'
import { PNG } from 'pngjs'

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)))
const JOBS_PATH = join(ROOT, 'scripts', 'pixellab-jobs.json')

/** @typedef {import('./asset-catalog.mjs').AssetCatalogEntry} AssetCatalogEntry */

/**
 * @typedef {object} PixellabJob
 * @property {string} assetId
 * @property {string} [objectId]
 * @property {string} [characterId]
 * @property {string} [animationGroupId]
 * @property {string} status
 * @property {number} [selectedCandidate]
 * @property {string} exportPath
 * @property {string} [notes]
 * @property {string} [pixellabTool]
 * @property {string} [updatedAt]
 */

export function loadJobs() {
  const raw = readFileSync(JOBS_PATH, 'utf8')
  return /** @type {{ version: number; updatedAt: string | null; jobs: PixellabJob[] }} */ (
    JSON.parse(raw)
  )
}

/** @param {{ version: number; updatedAt: string | null; jobs: PixellabJob[] }} data */
export function saveJobs(data) {
  data.updatedAt = new Date().toISOString()
  writeFileSync(JOBS_PATH, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

/** @param {PixellabJob} job */
export function upsertJob(job) {
  const data = loadJobs()
  const idx = data.jobs.findIndex((j) => j.assetId === job.assetId)
  const next = { ...job, updatedAt: new Date().toISOString() }
  if (idx >= 0) data.jobs[idx] = { ...data.jobs[idx], ...next }
  else data.jobs.push(next)
  saveJobs(data)
  return next
}

/** @param {string} assetId */
export function getJob(assetId) {
  return loadJobs().jobs.find((j) => j.assetId === assetId)
}

/**
 * @param {string} url
 * @param {string} exportPath relative to repo root
 */
export async function downloadToRepo(url, exportPath) {
  const abs = resolve(ROOT, exportPath)
  mkdirSync(dirname(abs), { recursive: true })
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Download failed ${res.status} for ${url}`)
  }
  if (!res.body) throw new Error(`Empty body for ${url}`)
  await pipeline(res.body, createWriteStream(abs))
  return abs
}

/**
 * Stitch frame buffers horizontally into one PNG sheet.
 * @param {Buffer[]} frames left-to-right
 * @param {number} frameWidth
 * @param {number} frameHeight
 * @returns {Buffer}
 */
export function stitchFramesHorizontally(frames, frameWidth, frameHeight) {
  const sheet = new PNG({ width: frameWidth * frames.length, height: frameHeight })
  for (let i = 0; i < frames.length; i++) {
    const frame = PNG.sync.read(frames[i])
    if (frame.width !== frameWidth || frame.height !== frameHeight) {
      throw new Error(
        `Frame ${i} size ${frame.width}x${frame.height} != expected ${frameWidth}x${frameHeight}`,
      )
    }
    frame.data.copy(sheet.data, i * frameWidth * 4, 0, frame.width * frame.height * 4)
  }
  return PNG.sync.write(sheet)
}

/**
 * @param {string} absPath
 * @param {AssetCatalogEntry} entry
 */
export async function validateExportedSheet(absPath, entry) {
  const buf = readFileSync(absPath)
  const img = PNG.sync.read(buf)
  const expectedW = entry.frameWidth * entry.frames
  const expectedH = entry.frameHeight
  if (img.width !== expectedW || img.height !== expectedH) {
    return {
      ok: false,
      message: `Expected ${expectedW}x${expectedH}, got ${img.width}x${img.height}`,
      actual: { width: img.width, height: img.height },
    }
  }
  return { ok: true, actual: { width: img.width, height: img.height } }
}

/** @param {string} exportPath relative to repo root */
export function assetExists(exportPath) {
  return existsSync(resolve(ROOT, exportPath))
}

/** @param {AssetCatalogEntry} entry */
export function repoExportPath(entry) {
  return resolve(ROOT, entry.exportPath)
}

export { ROOT, JOBS_PATH }
