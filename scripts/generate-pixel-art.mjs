#!/usr/bin/env node
/**
 * Generates interim pixel-art sprites for gems, enemies, and markers.
 * Run: pnpm assets:generate
 *
 * When PIXELLAB_API_KEY is configured, prefer `pnpm assets:pixellab` instead.
 */
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const ASSETS = path.join(ROOT, 'public', 'assets');
const ENEMY_FRAME_SIZE = 48;

const GEM_FAMILIES = {
  kinetic: { color: [0x7d, 0xd3, 0xfc], shape: 'diamond' },
  verdant: { color: [0x66, 0xf2, 0xa4], shape: 'hex' },
  arcane: { color: [0xc0, 0x84, 0xfc], shape: 'circle' },
  nova: { color: [0xfb, 0x71, 0x85], shape: 'square' },
  prism: { color: [0xfd, 0xe6, 0x8a], shape: 'star' },
};

const ENEMIES = {
  scout: { color: [0x77, 0xe7, 0xff], scale: 0.85 },
  trooper: { color: [0xe4, 0xe9, 0xff], scale: 0.9 },
  runner: { color: [0x5e, 0xea, 0xd4], scale: 0.8 },
  bulwark: { color: [0xbd, 0x9c, 0xff], scale: 1.0 },
  striker: { color: [0xff, 0xb8, 0x6b], scale: 0.95 },
  brute: { color: [0xa7, 0x8b, 0xfa], scale: 1.15 },
  shifter: { color: [0xf0, 0xab, 0xfc], scale: 0.9 },
  mystic: { color: [0xc4, 0xb5, 0xfd], scale: 1.0 },
  warden: { color: [0xa4, 0x8c, 0xff], scale: 1.1 },
  vanguard: { color: [0xff, 0xd1, 0x66], scale: 1.2 },
  colossus: { color: [0xf8, 0x71, 0x71], scale: 1.55 },
  dreadnought: { color: [0xef, 0x44, 0x44], scale: 1.75 },
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

function fillCircle(png, cx, cy, r, rgba) {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) setPixel(png, x, y, rgba);
    }
  }
}

function drawOutline(png, cx, cy, r, color) {
  for (let a = 0; a < Math.PI * 2; a += 0.08) {
    const x = Math.round(cx + Math.cos(a) * r);
    const y = Math.round(cy + Math.sin(a) * r);
    setPixel(png, x, y, [...color, 255]);
  }
}

function drawGemShape(png, cx, cy, size, shape, rgb, level) {
  const glow = [rgb[0], rgb[1], rgb[2], 40 + level * 8];
  fillCircle(png, cx, cy, size + 4, glow);
  const body = [...rgb, 230];
  const highlight = [
    Math.min(255, rgb[0] + 50),
    Math.min(255, rgb[1] + 50),
    Math.min(255, rgb[2] + 50),
    255,
  ];
  if (shape === 'diamond') {
    for (let i = -size; i <= size; i++) {
      const w = Math.max(0, size - Math.abs(i));
      for (let dx = -w; dx <= w; dx++) setPixel(png, cx + dx, cy + i, body);
    }
  } else if (shape === 'square') {
    for (let y = -size; y <= size; y++) {
      for (let x = -size; x <= size; x++) setPixel(png, cx + x, cy + y, body);
    }
  } else if (shape === 'hex') {
    for (let a = 0; a < 6; a++) {
      const a1 = (Math.PI / 3) * a - Math.PI / 6;
      const a2 = (Math.PI / 3) * (a + 1) - Math.PI / 6;
      const steps = size * 2;
      for (let t = 0; t <= steps; t++) {
        const f = t / steps;
        const x = Math.round(cx + Math.cos(a1) * size * (1 - f) + Math.cos(a2) * size * f);
        const y = Math.round(cy + Math.sin(a1) * size * (1 - f) + Math.sin(a2) * size * f);
        setPixel(png, x, y, body);
        fillCircle(png, x, y, 1, body);
      }
    }
    fillCircle(png, cx, cy, size * 0.65, body);
  } else if (shape === 'star') {
    for (let a = 0; a < 10; a++) {
      const ang = (Math.PI / 5) * a - Math.PI / 2;
      const rad = a % 2 === 0 ? size : size * 0.45;
      setPixel(png, Math.round(cx + Math.cos(ang) * rad), Math.round(cy + Math.sin(ang) * rad), body);
    }
    fillCircle(png, cx, cy, size * 0.35, body);
  } else {
    fillCircle(png, cx, cy, size, body);
  }
  fillCircle(png, cx - size * 0.25, cy - size * 0.25, Math.max(2, size * 0.2), highlight);
  if (level === 7) drawOutline(png, cx, cy, size + 5, [0xff, 0xf4, 0xa3]);
  drawOutline(png, cx, cy, size + 1, [20, 30, 50]);
}

function drawEnemyFrame(png, frameX, frame, rgb, scale, boss) {
  const size = ENEMY_FRAME_SIZE;
  const cx = frameX + size / 2;
  const cy = size / 2 + 2;
  const bob = Math.sin(frame * 1.4) * 1.5;
  const r = (boss ? 14 : 10) * scale;
  const legOffset = Math.sin(frame * Math.PI * 0.5) * 3;

  if (boss) {
    fillCircle(png, cx, cy + bob, r + 6, [...rgb, 50]);
    drawOutline(png, cx, cy + bob, r + 6, rgb);
  }

  fillCircle(png, cx - legOffset, cy + r * 0.5 + bob, 3, [...rgb, 200]);
  fillCircle(png, cx + legOffset, cy + r * 0.5 + bob, 3, [...rgb, 200]);
  fillCircle(png, cx, cy + bob, r, [...rgb, 235]);
  fillCircle(png, cx - r * 0.25, cy - r * 0.2 + bob, r * 0.22, [255, 255, 255, 180]);
  setPixel(png, Math.round(cx - r * 0.35), Math.round(cy - r * 0.05 + bob), [20, 20, 30, 255]);
  setPixel(png, Math.round(cx + r * 0.15), Math.round(cy - r * 0.05 + bob), [20, 20, 30, 255]);
  drawOutline(png, cx, cy + bob, r, [20, 30, 50]);
}

function writePng(filePath, png) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, PNG.sync.write(png));
  console.log('wrote', path.relative(ROOT, filePath));
}

function generateGems() {
  for (const [family, def] of Object.entries(GEM_FAMILIES)) {
    const dir = path.join(ASSETS, 'gems', family);
    ensureDir(dir);
    for (let level = 1; level <= 7; level++) {
      const png = new PNG({ width: 48, height: 48 });
      const size = 8 + level * 1.6;
      drawGemShape(png, 24, 26, size, def.shape, def.color, level);
      writePng(path.join(dir, `L${level}.png`), png);
    }
  }
}

function generateEnemies() {
  for (const [id, def] of Object.entries(ENEMIES)) {
    const dir = path.join(ASSETS, 'enemies', id);
    ensureDir(dir);
    const frames = 4;
    const png = new PNG({ width: ENEMY_FRAME_SIZE * frames, height: ENEMY_FRAME_SIZE });
    const boss = id === 'colossus' || id === 'dreadnought';
    for (let f = 0; f < frames; f++) {
      drawEnemyFrame(png, f * ENEMY_FRAME_SIZE, f, def.color, def.scale, boss);
    }
    writePng(path.join(dir, 'walk.png'), png);
  }
}

function generateMarkers() {
  const spawn = new PNG({ width: 48, height: 48 });
  fillCircle(spawn, 24, 24, 16, [0x7f, 0xff, 0xb2, 80]);
  drawOutline(spawn, 24, 24, 16, [0x7f, 0xff, 0xb2]);
  fillCircle(spawn, 24, 24, 8, [0x7f, 0xff, 0xb2, 200]);
  writePng(path.join(ASSETS, 'objects', 'spawn-portal.png'), spawn);

  const goal = new PNG({ width: 48, height: 48 });
  fillCircle(goal, 24, 24, 16, [0xff, 0x5a, 0x7a, 80]);
  drawOutline(goal, 24, 24, 16, [0xff, 0x5a, 0x7a]);
  fillCircle(goal, 24, 24, 8, [0xff, 0x5a, 0x7a, 200]);
  writePng(path.join(ASSETS, 'objects', 'goal-nexus.png'), goal);
}

generateGems();
generateEnemies();
generateMarkers();
console.log('Asset generation complete.');
