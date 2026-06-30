#!/usr/bin/env node
/**
 * Download completed PixelLab objects/tilesets into public/assets.
 * Usage:
 *   node scripts/export-pixellab-batch2.mjs object <object_id> <family>
 *   node scripts/export-pixellab-batch2.mjs tileset <tileset_id>
 */
import fs from 'node:fs';
import path from 'node:path';

const API_BASE = 'https://api.pixellab.ai/mcp';
const ROOT = path.resolve(import.meta.dirname, '..');
const ASSETS = path.join(ROOT, 'apps', 'web', 'public', 'assets');
const TOKEN =
  process.env.PIXELLAB_API_KEY ?? process.env.PIXELLAB_SECRET ?? process.env.PIXELLAB_TOKEN;

async function api(pathname, body) {
  if (!TOKEN) throw new Error('Missing PIXELLAB_API_KEY');
  const res = await fetch(`${API_BASE}${pathname}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${res.status} ${pathname}: ${await res.text()}`);
  return res.json();
}

async function poll(getter, id, label, maxMs = 600000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const result = await getter(id);
    if (result.status === 'completed') return result;
    if (result.status === 'review') return result;
    if (result.status === 'failed') throw new Error(`${label} failed`);
    process.stdout.write(
      `  waiting ${label}... ${result.status ?? result.job_status ?? 'processing'}\r`,
    );
    await new Promise((r) => setTimeout(r, 8000));
  }
  throw new Error(`${label} timed out`);
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed ${url}`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  console.log('saved', path.relative(ROOT, dest));
}

async function exportReviewGemPack(objectId, family) {
  const review = await poll((id) => api(`/objects/${id}`), objectId, `${family} review`);
  if (review.status !== 'review') {
    throw new Error(`Expected review status, got ${review.status}`);
  }
  const indices = Array.from({ length: 7 }, (_, i) => i);
  const selected = await api('/select-object-frames', { object_id: objectId, indices });
  for (let i = 0; i < selected.objects.length; i++) {
    const childId = selected.objects[i].object_id;
    const got = await poll((id) => api(`/objects/${id}`), childId, `${family} L${i + 1}`);
    const url = got.rotations?.south ?? got.download_url;
    await download(url, path.join(ASSETS, 'gems', family, `L${i + 1}.png`));
  }
}

async function exportTileset(tilesetId) {
  const tileset = await poll((id) => api(`/topdown-tilesets/${id}`), tilesetId, 'floor variants');
  await download(tileset.download_url, path.join(ASSETS, 'terrain', 'floor-variants.png'));
}

const [mode, id, family] = process.argv.slice(2);
if (!mode || !id) {
  console.error('Usage: node scripts/export-pixellab-batch2.mjs object <id> <family>');
  console.error('       node scripts/export-pixellab-batch2.mjs tileset <id>');
  process.exit(1);
}

if (mode === 'object') {
  await exportReviewGemPack(id, family);
} else if (mode === 'tileset') {
  await exportTileset(id);
} else {
  throw new Error(`Unknown mode ${mode}`);
}
