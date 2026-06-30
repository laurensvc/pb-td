#!/usr/bin/env node
/**
 * Generates clear, simple pixel-art for hex floor tiles, towers, monsters, and props.
 * Run: pnpm assets:generate
 */
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const ASSETS = path.join(ROOT, 'apps', 'web', 'public', 'assets');
const ENEMY_FRAME_SIZE = 48;
const HEX_TILE_W = 56;
const HEX_TILE_H = 64;
const HEX_RADIUS = 26;

const GEM_FAMILIES = {
  kinetic: { color: [0x5b, 0xcf, 0xff], accent: [0xd8, 0xf4, 0xff] },
  verdant: { color: [0x4a, 0xde, 0x80], accent: [0xd1, 0xfa, 0xe5] },
  arcane: { color: [0xb7, 0x94, 0xf6], accent: [0xed, 0xe9, 0xfe] },
  nova: { color: [0xfb, 0x71, 0x85], accent: [0xff, 0xe4, 0xe6] },
  prism: { color: [0xfb, 0xbf, 0x24], accent: [0xff, 0xf7, 0xcc] },
  toxic_shot: { color: [0x34, 0xd3, 0x99], accent: [0xcc, 0xfb, 0xf1] },
  plasma_mortar: { color: [0xe8, 0x79, 0xf9], accent: [0xfd, 0xe8, 0xff] },
  pierce_crystal: { color: [0x93, 0xc5, 0xfd], accent: [0xdb, 0xea, 0xfe] },
  spore_bomb: { color: [0x86, 0xef, 0xac], accent: [0xdc, 0xfc, 0xe7] },
  slayer_shard: { color: [0xf5, 0x9e, 0x0b], accent: [0xff, 0xeb, 0xad] },
  venom_lens: { color: [0x22, 0xc5, 0x5e], accent: [0xbb, 0xf7, 0xd0] },
  shatter_star: { color: [0xf4, 0x3f, 0x5e], accent: [0xff, 0xe4, 0xe6] },
  executioner: { color: [0xf9, 0x73, 0x16], accent: [0xff, 0xed, 0xd5] },
};

const ENEMIES = {
  scout: { body: [0x67, 0xe8, 0xf9], kind: 'slime', scale: 0.82 },
  trooper: { body: [0xe2, 0xe8, 0xf0], kind: 'soldier', scale: 0.88 },
  runner: { body: [0x2d, 0xd4, 0xbf], kind: 'slime', scale: 0.78 },
  bulwark: { body: [0xa7, 0x8b, 0xfa], kind: 'tank', scale: 1.05 },
  striker: { body: [0xfb, 0x92, 0x3c], kind: 'soldier', scale: 0.92 },
  brute: { body: [0x8b, 0x5c, 0xf6], kind: 'tank', scale: 1.12 },
  shifter: { body: [0xf0, 0xab, 0xfc], kind: 'ghost', scale: 0.86 },
  mystic: { body: [0xc4, 0xb5, 0xfd], kind: 'ghost', scale: 0.94 },
  warden: { body: [0x81, 0x8c, 0xf8], kind: 'tank', scale: 1.08 },
  vanguard: { body: [0xf5, 0xc5, 0x18], kind: 'soldier', scale: 1.15 },
  colossus: { body: [0xef, 0x44, 0x44], kind: 'boss', scale: 1.45 },
  dreadnought: { body: [0xdc, 0x26, 0x26], kind: 'boss', scale: 1.65 },
};

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function setPixel(png, x, y, rgba) {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) return;
  const i = (png.width * y + x) << 2;
  png.data[i] = rgba[0];
  png.data[i + 1] = rgba[1];
  png.data[i + 2] = rgba[2];
  png.data[i + 3] = rgba[3] ?? 255;
}

function fillRect(png, x0, y0, x1, y1, rgba) {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) setPixel(png, x, y, rgba);
  }
}

function fillCircle(png, cx, cy, r, rgba) {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) setPixel(png, x, y, rgba);
    }
  }
}

function pointInFlatHex(px, py, cx, cy, radius) {
  const dx = Math.abs(px - cx);
  const dy = Math.abs(py - cy);
  if (dy > radius) return false;
  return dx <= (Math.sqrt(3) / 2) * radius && dx * 0.5 + dy * 0.866 <= radius;
}

function fillFlatHex(png, cx, cy, radius, rgba) {
  for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y++) {
    for (let x = Math.floor(cx - radius * 1.2); x <= Math.ceil(cx + radius * 1.2); x++) {
      if (pointInFlatHex(x, y, cx, cy, radius)) setPixel(png, x, y, rgba);
    }
  }
}

function strokeFlatHex(png, cx, cy, radius, rgba) {
  for (let y = Math.floor(cy - radius - 1); y <= Math.ceil(cy + radius + 1); y++) {
    for (let x = Math.floor(cx - radius * 1.2 - 1); x <= Math.ceil(cx + radius * 1.2 + 1); x++) {
      if (
        pointInFlatHex(x, y, cx, cy, radius) &&
        !pointInFlatHex(x, y, cx, cy, radius - 1.2)
      ) {
        setPixel(png, x, y, rgba);
      }
    }
  }
}

function drawHexTile(base, edge, highlight, accent) {
  const png = new PNG({ width: HEX_TILE_W, height: HEX_TILE_H });
  const cx = HEX_TILE_W / 2;
  const cy = HEX_TILE_H / 2 + 1;
  fillFlatHex(png, cx, cy, HEX_RADIUS, [...base, 255]);
  strokeFlatHex(png, cx, cy, HEX_RADIUS, [...edge, 255]);
  fillFlatHex(png, cx - 8, cy - 10, 8, [...highlight, 70]);
  if (accent) {
    for (let i = 0; i < 4; i++) {
      const x = cx - 10 + i * 7;
      setPixel(png, x, cy + 8, [...accent, 180]);
      setPixel(png, x + 1, cy + 9, [...accent, 120]);
    }
  }
  return png;
}

function generateHexTiles() {
  const terrainDir = path.join(ASSETS, 'terrain');
  ensureDir(terrainDir);
  writePng(
    path.join(terrainDir, 'hex-rock-floor.png'),
    drawHexTile([0x1a, 0x2a, 0x3d], [0x2f, 0x45, 0x63], [0x4a, 0x67, 0x8a]),
  );
  writePng(
    path.join(terrainDir, 'hex-gem-floor.png'),
    drawHexTile([0x1f, 0x3d, 0x52], [0x3a, 0x6d, 0x8f], [0x5b, 0x9f, 0xc8], [0x7d, 0xd3, 0xfc]),
  );
  writePng(
    path.join(terrainDir, 'hex-path-floor.png'),
    drawHexTile([0x1a, 0x4a, 0x5c], [0x35, 0x9a, 0xb8], [0x67, 0xe8, 0xf9], [0x35, 0xd0, 0xff]),
  );

  // Legacy square tilesets kept for compatibility.
  writePng(path.join(terrainDir, 'void-floor.png'), drawHexTile([0x1a, 0x2a, 0x3d], [0x2f, 0x45, 0x63], [0x4a, 0x67, 0x8a]));
  writePng(path.join(terrainDir, 'gem-cell.png'), drawHexTile([0x1f, 0x3d, 0x52], [0x3a, 0x6d, 0x8f], [0x5b, 0x9f, 0xc8], [0x7d, 0xd3, 0xfc]));
}

function drawTower(png, cx, cy, rgb, accent, level) {
  const baseW = 10 + level;
  const baseH = 6;
  fillRect(png, cx - baseW, cy + 4, cx + baseW, cy + 4 + baseH, [40, 52, 70, 255]);
  fillRect(png, cx - baseW + 2, cy + 2, cx + baseW - 2, cy + 4, [62, 78, 98, 255]);
  const spikeH = 10 + level * 2.2;
  for (let row = 0; row < spikeH; row++) {
    const w = Math.max(1, Math.round((spikeH - row) * 0.45));
    for (let dx = -w; dx <= w; dx++) {
      setPixel(png, cx + dx, cy + 2 - row, [...rgb, 240]);
    }
  }
  fillCircle(png, cx - 3, cy - spikeH * 0.35, 2, [...accent, 255]);
  if (level >= 5) strokeFlatHex(png, cx, cy - 2, 12 + level, [255, 244, 163, 180]);
}

function generateGems() {
  for (const [family, def] of Object.entries(GEM_FAMILIES)) {
    const dir = path.join(ASSETS, 'gems', family);
    ensureDir(dir);
    for (let level = 1; level <= 7; level++) {
      const png = new PNG({ width: 48, height: 48 });
      drawTower(png, 24, 30, def.color, def.accent, level);
      writePng(path.join(dir, `L${level}.png`), png);
    }
  }
}

function drawSlime(png, cx, cy, rgb, scale, frame) {
  const wobble = Math.sin(frame * 1.2) * 2;
  fillCircle(png, cx, cy + 4 + wobble * 0.2, 12 * scale, [...rgb, 230]);
  fillCircle(png, cx - 4 * scale, cy + 1 + wobble * 0.2, 2, [255, 255, 255, 220]);
  setPixel(png, Math.round(cx - 5 * scale), Math.round(cy + 2 + wobble * 0.2), [20, 30, 40, 255]);
  setPixel(png, Math.round(cx + 1 * scale), Math.round(cy + 2 + wobble * 0.2), [20, 30, 40, 255]);
}

function drawSoldier(png, cx, cy, rgb, scale, frame) {
  const bob = Math.sin(frame * 1.4) * 1.5;
  fillRect(png, cx - 4 * scale, cy + 2 + bob, cx + 4 * scale, cy + 10 + bob, [...rgb, 235]);
  fillCircle(png, cx, cy - 4 + bob, 5 * scale, [...rgb, 240]);
  fillCircle(png, cx - 2 * scale, cy - 5 + bob, 1, [255, 255, 255, 220]);
  const leg = Math.sin(frame * Math.PI * 0.5) * 2;
  fillRect(png, cx - 3 * scale + leg, cy + 10 + bob, cx - 1 * scale + leg, cy + 14 + bob, [30, 40, 55, 255]);
  fillRect(png, cx + 1 * scale - leg, cy + 10 + bob, cx + 3 * scale - leg, cy + 14 + bob, [30, 40, 55, 255]);
}

function drawTank(png, cx, cy, rgb, scale, frame) {
  const bob = Math.sin(frame * 0.9) * 1;
  fillRect(png, cx - 9 * scale, cy + bob, cx + 9 * scale, cy + 8 + bob, [...rgb, 235]);
  fillRect(png, cx - 6 * scale, cy - 6 + bob, cx + 6 * scale, cy + bob, [...rgb, 245]);
  fillRect(png, cx + 2 * scale, cy - 3 + bob, cx + 10 * scale, cy - 1 + bob, [255, 255, 255, 180]);
}

function drawGhost(png, cx, cy, rgb, scale, frame) {
  const bob = Math.sin(frame * 1.1) * 2;
  fillCircle(png, cx, cy - 2 + bob, 8 * scale, [...rgb, 180]);
  for (let x = -7 * scale; x <= 7 * scale; x++) {
    const wave = Math.sin((x / scale + frame) * 0.8) * 2;
    fillRect(png, cx + x, cy + 4 + bob + wave, cx + x, cy + 12 + bob, [...rgb, 150]);
  }
  setPixel(png, Math.round(cx - 3 * scale), Math.round(cy - 2 + bob), [255, 255, 255, 200]);
  setPixel(png, Math.round(cx + 2 * scale), Math.round(cy - 2 + bob), [255, 255, 255, 200]);
}

function drawBoss(png, cx, cy, rgb, scale, frame) {
  const pulse = 1 + Math.sin(frame * 0.8) * 0.06;
  fillCircle(png, cx, cy, 16 * scale * pulse, [...rgb, 60]);
  drawTank(png, cx, cy - 2, rgb, scale, frame);
  strokeFlatHex(png, cx, cy, 18 * scale, [255, 220, 120, 200]);
}

function drawEnemyFrame(png, frameX, frame, def) {
  const cx = frameX + ENEMY_FRAME_SIZE / 2;
  const cy = ENEMY_FRAME_SIZE / 2 + 4;
  const drawer = {
    slime: drawSlime,
    soldier: drawSoldier,
    tank: drawTank,
    ghost: drawGhost,
    boss: drawBoss,
  }[def.kind];
  drawer(png, cx, cy, def.body, def.scale, frame);
}

function generateEnemies() {
  for (const [id, def] of Object.entries(ENEMIES)) {
    const dir = path.join(ASSETS, 'enemies', id);
    ensureDir(dir);
    const frames = 4;
    const png = new PNG({ width: ENEMY_FRAME_SIZE * frames, height: ENEMY_FRAME_SIZE });
    for (let f = 0; f < frames; f++) {
      drawEnemyFrame(png, f * ENEMY_FRAME_SIZE, f, def);
    }
    writePng(path.join(dir, 'walk.png'), png);
  }
}

function generateProps() {
  const objectsDir = path.join(ASSETS, 'objects');
  ensureDir(objectsDir);

  const rock = new PNG({ width: 48, height: 48 });
  fillCircle(rock, 24, 28, 14, [70, 82, 98, 255]);
  fillCircle(rock, 20, 24, 6, [110, 124, 142, 255]);
  fillCircle(rock, 28, 26, 5, [52, 64, 78, 255]);
  fillCircle(rock, 18, 30, 3, [140, 152, 168, 255]);
  writePng(path.join(objectsDir, 'rock.png'), rock);

  const spawn = new PNG({ width: 48, height: 48 });
  fillFlatHex(spawn, 24, 26, 16, [40, 120, 90, 120]);
  strokeFlatHex(spawn, 24, 26, 16, [127, 255, 178, 255]);
  fillCircle(spawn, 24, 24, 6, [127, 255, 178, 220]);
  writePng(path.join(objectsDir, 'spawn-portal.png'), spawn);

  const goal = new PNG({ width: 48, height: 48 });
  fillFlatHex(goal, 24, 26, 16, [120, 40, 60, 120]);
  strokeFlatHex(goal, 24, 26, 16, [255, 90, 122, 255]);
  fillCircle(goal, 24, 24, 6, [255, 90, 122, 220]);
  writePng(path.join(objectsDir, 'goal-nexus.png'), goal);
}

function writePng(filePath, png) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, PNG.sync.write(png));
  console.log('wrote', path.relative(ROOT, filePath));
}

generateHexTiles();
generateGems();
generateEnemies();
generateProps();
console.log('Asset generation complete.');
