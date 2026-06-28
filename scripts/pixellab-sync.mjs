#!/usr/bin/env node
/**
 * Sync assets from PixelLab API when PIXELLAB_API_KEY is set.
 * Run: PIXELLAB_API_KEY=your_token pnpm assets:pixellab
 *
 * Generates: terrain tilesets, rock, gem families, walking enemy characters.
 * Requires a PixelLab account: https://pixellab.ai/account
 */
import fs from 'node:fs';
import path from 'node:path';

const API_BASE = 'https://api.pixellab.ai/mcp';
const ROOT = path.resolve(import.meta.dirname, '..');
const ASSETS = path.join(ROOT, 'public', 'assets');
const TOKEN = process.env.PIXELLAB_API_KEY ?? process.env.PIXELLAB_SECRET ?? process.env.PIXELLAB_TOKEN;

const GEM_FAMILIES = [
  { id: 'kinetic', color: 'cyan kinetic crystal', levels: 7 },
  { id: 'verdant', color: 'green verdant spore crystal', levels: 7 },
  { id: 'arcane', color: 'purple arcane lens crystal', levels: 7 },
  { id: 'nova', color: 'rose nova mortar crystal', levels: 7 },
  { id: 'prism', color: 'gold prism shard crystal', levels: 7 },
];

const ENEMIES = [
  { id: 'scout', desc: 'small alien void scout, sleek cyan eyes, chibi' },
  { id: 'trooper', desc: 'astral trooper alien soldier, white armor' },
  { id: 'runner', desc: 'fast comet runner alien, teal streaks' },
  { id: 'bulwark', desc: 'shield bulwark alien with energy barrier' },
  { id: 'striker', desc: 'orange comet striker alien, agile' },
  { id: 'brute', desc: 'heavy iron brute alien, purple armor' },
  { id: 'shifter', desc: 'phase shifter alien, pink energy wisps' },
  { id: 'mystic', desc: 'void mystic alien caster, violet robes' },
  { id: 'warden', desc: 'nebula warden elite alien, large shield' },
  { id: 'vanguard', desc: 'crown vanguard elite alien, gold trim' },
  { id: 'colossus', desc: 'titan colossus boss alien, massive red armor' },
  { id: 'dreadnought', desc: 'abyss dreadnought boss alien, huge dark red' },
];

async function api(pathname, body) {
  const res = await fetch(`${API_BASE}${pathname}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${pathname}: ${text}`);
  }
  return res.json();
}

async function poll(getter, id, label, maxMs = 300000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const result = await getter(id);
    if (result.status === 'completed') return result;
    if (result.status === 'failed') throw new Error(`${label} failed: ${result.error ?? 'unknown'}`);
    process.stdout.write(`  waiting ${label}... ${result.status ?? 'processing'}\r`);
    await new Promise((r) => setTimeout(r, 5000));
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

async function syncTerrain() {
  console.log('Creating void floor tileset...');
  const voidJob = await api('/create-topdown-tileset', {
    lower_description: 'deep space void black',
    upper_description: 'dark cosmic metal floor plate with faint cyan circuit lines',
    tile_size: { width: 32, height: 32 },
    view: 'high top-down',
    outline: 'single color outline',
    shading: 'medium shading',
  });
  const voidSet = await poll((id) => api(`/topdown-tilesets/${id}`), voidJob.tileset_id, 'void tileset');
  await download(voidSet.download_url, path.join(ASSETS, 'terrain', 'void-floor.png'));

  console.log('Creating gem cell tileset...');
  const gemJob = await api('/create-topdown-tileset', {
    lower_description: 'deep space void black',
    upper_description: 'glowing starfield tile, soft cyan gem placement cell',
    tile_size: { width: 32, height: 32 },
    view: 'high top-down',
    upper_base_tile_id: voidSet.upper_base_tile_id,
    outline: 'single color outline',
    shading: 'medium shading',
  });
  const gemSet = await poll((id) => api(`/topdown-tilesets/${id}`), gemJob.tileset_id, 'gem tileset');
  await download(gemSet.download_url, path.join(ASSETS, 'terrain', 'gem-cell.png'));
}

async function syncRock() {
  console.log('Creating rock object...');
  const job = await api('/create-1-direction-object', {
    description: 'cosmic asteroid rock blocker, chunky, top-down tower defense',
    size: 48,
    view: 'top-down',
  });
  const obj = await poll((id) => api(`/objects/${id}`), job.object_id, 'rock');
  await download(obj.rotations.south, path.join(ASSETS, 'objects', 'rock.png'));
}

async function syncGems() {
  for (const family of GEM_FAMILIES) {
    console.log(`Creating ${family.id} gems...`);
    const descriptions = Array.from({ length: family.levels }, (_, i) => {
      const tier = i + 1;
      return tier === 7
        ? `great tier 7 massive ${family.color} tower defense gem`
        : `tier ${tier} ${family.color} tower defense gem, top-down`;
    });
    const job = await api('/create-1-direction-object', {
      description: `cosmic ${family.id} gem tower`,
      size: 48,
      view: 'top-down',
      item_descriptions: descriptions,
    });
    const obj = await poll((id) => api(`/objects/${id}`), job.object_id, `${family.id} gems`);
    if (obj.status === 'review') {
      const selected = await api('/select-object-frames', {
        object_id: job.object_id,
        indices: descriptions.map((_, i) => i),
      });
      for (let i = 0; i < selected.objects.length; i++) {
        const level = i + 1;
        const got = await poll((id) => api(`/objects/${id}`), selected.objects[i].object_id, `gem L${level}`);
        const dir = path.join(ASSETS, 'gems', family.id);
        fs.mkdirSync(dir, { recursive: true });
        await download(got.rotations.south, path.join(dir, `L${level}.png`));
      }
    }
  }
}

async function syncEnemies() {
  for (const enemy of ENEMIES) {
    console.log(`Creating ${enemy.id} character...`);
    const job = await api('/create-character', {
      description: enemy.desc,
      name: enemy.id,
      size: enemy.id.includes('colossus') || enemy.id.includes('dreadnought') ? 64 : 40,
      view: 'high top-down',
      mode: 'standard',
      n_directions: 4,
      outline: 'single color outline',
      shading: 'medium shading',
      detail: 'medium detail',
      proportions: '{"type": "preset", "name": "chibi"}',
    });
    const character = await poll((id) => api(`/characters/${id}`), job.character_id, enemy.id);
    const animJob = await api('/animate-character', {
      character_id: job.character_id,
      template_animation_id: 'walking',
      directions: ['south'],
    });
    const anim = await poll(
      () => api(`/characters/${job.character_id}`),
      job.character_id,
      `${enemy.id} walk`,
    );
    const walkUrl = anim.animations?.walk?.south?.download_url ?? character.download_url;
    const dir = path.join(ASSETS, 'enemies', enemy.id);
    fs.mkdirSync(dir, { recursive: true });
    await download(walkUrl, path.join(dir, 'walk.png'));
  }
}

async function main() {
  if (!TOKEN) {
    console.error('Missing PIXELLAB_API_KEY. Get one at https://pixellab.ai/account');
    console.error('Usage: PIXELLAB_API_KEY=xxx pnpm assets:pixellab');
    process.exit(1);
  }
  fs.mkdirSync(ASSETS, { recursive: true });
  await syncTerrain();
  await syncRock();
  await syncGems();
  await syncEnemies();
  console.log('PixelLab asset sync complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
