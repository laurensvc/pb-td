import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { deflateSync } from 'node:zlib';

const root = process.cwd();
const outDir = join(root, 'public', 'assets', 'sprites');
const monsterSourceDir = join(root, 'public', 'assets', 'monsters');
mkdirSync(outDir, { recursive: true });
mkdirSync(monsterSourceDir, { recursive: true });

const FRAME = 64;
const GEMS_COLS = 7;
const GEMS_ROWS = 4;
const monsterAnimations = {
  idle: { frames: 2, duration: 260 },
  walk: { frames: 4, duration: 120 },
  attack: { frames: 3, duration: 95 },
  death: { frames: 4, duration: 130 },
};

const gemIds = [
  'ruby-1',
  'sapphire-1',
  'topaz-1',
  'emerald-1',
  'amethyst-1',
  'onyx-1',
  'ruby-2',
  'sapphire-2',
  'topaz-2',
  'emerald-2',
  'amethyst-2',
  'onyx-2',
  'ruby-3',
  'sapphire-3',
  'topaz-3',
  'emerald-3',
  'amethyst-3',
  'onyx-3',
  'ruby-4',
  'sapphire-4',
  'topaz-4',
  'emerald-4',
  'amethyst-4',
  'onyx-4',
  'prism-lens',
  'verdant-forge',
  'night-crucible',
  'sunward-core',
];

const palette = {
  ruby: ['#421016', '#87242e', '#e15c65', '#ffd1c9'],
  sapphire: ['#101a42', '#243d94', '#6491ff', '#d7f1ff'],
  topaz: ['#46310b', '#9b6b17', '#f0c84e', '#fff2a1'],
  emerald: ['#0e3a25', '#1f7c4e', '#55cf87', '#cdfcdd'],
  amethyst: ['#26113f', '#5c2c9c', '#ad7bf2', '#f2d7ff'],
  onyx: ['#151219', '#3b3444', '#9b91a4', '#f3ecff'],
  prism: ['#20123a', '#7a4ec7', '#f0c84e', '#ffffff'],
  verdant: ['#0e3429', '#2f8f83', '#55cf87', '#d6ffe8'],
  night: ['#111019', '#31273f', '#ad7bf2', '#f5d7ff'],
  sunward: ['#4a1e0b', '#b74b22', '#f0c84e', '#fff0a8'],
};

const enemies = readEnemies();
const monsters = makeImage(FRAME, FRAME * enemies.length);
const gems = makeImage(FRAME * GEMS_COLS, FRAME * GEMS_ROWS);
const metadata = {
  frameSize: FRAME,
  sheets: {
    monsters: {
      src: '/assets/sprites/monsters.png',
      width: monsters.width,
      height: monsters.height,
    },
    gems: { src: '/assets/sprites/gems.png', width: gems.width, height: gems.height },
  },
  monsters: {},
  gems: {},
};

for (let row = 0; row < enemies.length; row++) {
  const enemy = enemies[row];
  const sprite = makeImage(FRAME, FRAME);
  drawMonsterSprite(sprite, enemy, 0, 0);
  const spritePath = join(monsterSourceDir, enemy.id, 'sprite.png');
  mkdirSync(dirname(spritePath), { recursive: true });
  writePng(spritePath, sprite);
  blit(sprite, monsters, 0, row * FRAME);

  const rect = { x: 0, y: row * FRAME, w: FRAME, h: FRAME };
  metadata.monsters[enemy.id] = { sheet: 'monsters', animations: {} };
  for (const [name, config] of Object.entries(monsterAnimations)) {
    metadata.monsters[enemy.id].animations[name] = {
      frames: Array.from({ length: config.frames }, () => rect),
      frameDurationMs: config.duration,
    };
  }
}

for (let index = 0; index < gemIds.length; index++) {
  const id = gemIds[index];
  const x = (index % GEMS_COLS) * FRAME;
  const y = Math.floor(index / GEMS_COLS) * FRAME;
  drawGem(gems, x, y, id);
  metadata.gems[id] = { sheet: 'gems', frame: { x, y, w: FRAME, h: FRAME } };
}

writePng(join(outDir, 'monsters.png'), monsters);
writePng(join(outDir, 'gems.png'), gems);
writeFileSync(join(outDir, 'sprites.json'), `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');

const outDirForLog = outDir.split(/[/\\]/).join('/');
console.log(`Sprite atlases: ${enemies.length} monsters, ${gemIds.length} gems -> ${outDirForLog}`);

function readEnemies() {
  const config = readFileSync(join(root, 'src', 'game', 'config.ts'), 'utf8');
  const start = config.indexOf('export const enemies');
  const end = config.indexOf('function e(', start);
  if (start < 0 || end < 0) throw new Error('Could not find enemy definitions in config.ts');
  const block = config.slice(start, end);
  const out = [];
  for (const call of readEnemyCalls(block)) {
    const strings = Array.from(call.matchAll(/'([^']+)'/g), (match) => match[1]);
    const color = call.match(/#[0-9a-fA-F]{6}/)?.[0];
    if (strings.length < 2 || !color) continue;
    const afterColor = call.slice(call.indexOf(color) + color.length);
    const skillsBlock = afterColor.match(/\[[\s\S]*?\]/)?.[0] ?? '';
    const skills = Array.from(skillsBlock.matchAll(/'([^']+)'/g), (skill) => skill[1]);
    out.push({
      id: strings[0],
      name: strings[1],
      color,
      skills,
      boss: /,\s*true\s*\)$/.test(call),
      flying: skills.includes('flying'),
    });
  }
  if (out.length === 0) throw new Error('No enemies parsed from config.ts');
  return out;
}

function readEnemyCalls(block) {
  const calls = [];
  for (let i = 0; i < block.length; i++) {
    if (block[i] !== 'e' || block[i + 1] !== '(') continue;
    let cursor = i + 2;
    let depth = 1;
    let quote = null;
    for (; cursor < block.length; cursor++) {
      const char = block[cursor];
      const previous = block[cursor - 1];
      if (quote) {
        if (char === quote && previous !== '\\') quote = null;
      } else if (char === "'" || char === '"') quote = char;
      else if (char === '(') depth++;
      else if (char === ')' && --depth === 0) break;
    }
    calls.push(block.slice(i, cursor + 1));
    i = cursor;
  }
  return calls;
}

function makeImage(width, height) {
  return { width, height, data: new Uint8Array(width * height * 4) };
}

function blit(source, target, ox, oy) {
  for (let y = 0; y < source.height; y++) {
    for (let x = 0; x < source.width; x++) {
      const si = (y * source.width + x) * 4;
      const ti = ((oy + y) * target.width + ox + x) * 4;
      target.data[ti] = source.data[si];
      target.data[ti + 1] = source.data[si + 1];
      target.data[ti + 2] = source.data[si + 2];
      target.data[ti + 3] = source.data[si + 3];
    }
  }
}

function setPixel(image, x, y, color, alpha = 255) {
  if (x < 0 || y < 0 || x >= image.width || y >= image.height) return;
  const [r, g, b] = hex(color);
  const i = (Math.floor(y) * image.width + Math.floor(x)) * 4;
  image.data[i] = r;
  image.data[i + 1] = g;
  image.data[i + 2] = b;
  image.data[i + 3] = alpha;
}

function rect(image, x, y, w, h, color, alpha = 255) {
  for (let yy = 0; yy < h; yy++) {
    for (let xx = 0; xx < w; xx++) setPixel(image, x + xx, y + yy, color, alpha);
  }
}

function circle(image, cx, cy, r, color, alpha = 255) {
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      if (x * x + y * y <= r * r) setPixel(image, cx + x, cy + y, color, alpha);
    }
  }
}

function ellipse(image, cx, cy, rx, ry, color, alpha = 255) {
  for (let y = -ry; y <= ry; y++) {
    for (let x = -rx; x <= rx; x++) {
      if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) {
        setPixel(image, cx + x, cy + y, color, alpha);
      }
    }
  }
}

function diamond(image, cx, cy, rx, ry, color, alpha = 255) {
  for (let y = -ry; y <= ry; y++) {
    const span = Math.floor(rx * (1 - Math.abs(y) / (ry + 1)));
    for (let x = -span; x <= span; x++) setPixel(image, cx + x, cy + y, color, alpha);
  }
}

function line(image, x1, y1, x2, y2, color, alpha = 255) {
  const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
  for (let i = 0; i <= steps; i++) {
    const t = steps === 0 ? 0 : i / steps;
    setPixel(image, Math.round(x1 + (x2 - x1) * t), Math.round(y1 + (y2 - y1) * t), color, alpha);
  }
}

function circleO(image, cx, cy, r, outline, fill) {
  circle(image, cx, cy, r + 2, outline);
  circle(image, cx, cy, r, fill);
}

function rectO(image, x, y, w, h, outline, fill) {
  rect(image, x - 2, y - 2, w + 4, h + 4, outline);
  rect(image, x, y, w, h, fill);
}

function diamondO(image, cx, cy, rx, ry, outline, fill) {
  diamond(image, cx, cy, rx + 2, ry + 2, outline);
  diamond(image, cx, cy, rx, ry, fill);
}

function spark(image, x, y, color) {
  rect(image, x, y - 2, 1, 5, color);
  rect(image, x - 2, y, 5, 1, color);
}

function flame(image, x, y, size, dark, mid, light) {
  diamond(image, x, y, size, size + 3, dark);
  diamond(image, x + 1, y - 1, Math.max(2, size - 3), size, mid);
  diamond(image, x + 2, y - 2, Math.max(1, size - 6), Math.max(2, size - 3), light);
}

function drawMonsterSprite(image, enemy, ox, oy) {
  const p = monsterPalette(enemy);
  const outline = '#090807';
  const variant = hash(enemy.id) % 5;
  const heavy =
    enemy.boss || enemy.skills.includes('highArmor') || enemy.skills.includes('reactiveArmor');
  const spectral =
    enemy.skills.includes('magicImmune') ||
    enemy.skills.includes('permanentInvisibility') ||
    enemy.skills.includes('cloakAndDagger');

  if (enemy.boss) drawBossBase(image, ox, oy, enemy, p, outline);
  else if (enemy.flying) drawFlyingBase(image, ox, oy, enemy, p, outline, variant);
  else if (heavy) drawArmoredBase(image, ox, oy, enemy, p, outline, variant);
  else if (spectral) drawSpectralBase(image, ox, oy, enemy, p, outline, variant);
  else drawGroundBase(image, ox, oy, enemy, p, outline, variant);

  drawSkillMarks(image, ox, oy, enemy, p, outline);
  setPixel(image, ox + 28, oy + 28, p[3]);
  setPixel(image, ox + 39, oy + 27, p[3]);
}

function drawGroundBase(image, ox, oy, enemy, p, outline, variant) {
  ellipse(image, ox + 32, oy + 54, 17, 4, '#000000', 90);
  ellipse(image, ox + 32, oy + 35, 18 + variant, 12, outline);
  ellipse(image, ox + 32, oy + 34, 15 + variant, 9, p[1]);
  circleO(image, ox + 44, oy + 28, 9, outline, p[1]);
  diamond(image, ox + 46, oy + 29, 7, 5, p[2]);
  for (let i = 0; i < 4; i++) rectO(image, ox + 18 + i * 8, oy + 43, 5, 10, outline, p[i % 2]);
  if (enemy.name.toLowerCase().includes('pig') || enemy.name.toLowerCase().includes('dog')) {
    circle(image, ox + 51, oy + 29, 3, p[3]);
  }
  if (enemy.name.toLowerCase().includes('frog')) {
    circleO(image, ox + 24, oy + 24, 5, outline, p[2]);
    circleO(image, ox + 40, oy + 23, 5, outline, p[2]);
  }
}

function drawFlyingBase(image, ox, oy, enemy, p, outline, variant) {
  diamondO(image, ox + 20, oy + 32, 13, 9 + variant, outline, p[1]);
  diamondO(image, ox + 46, oy + 31, 12, 8 + variant, outline, p[1]);
  circleO(image, ox + 33, oy + 32, 12, outline, p[2]);
  rectO(image, ox + 25, oy + 41, 17, 9, outline, p[1]);
  if (enemy.name.toLowerCase().includes('fish') || enemy.name.toLowerCase().includes('jelly')) {
    for (let i = 0; i < 4; i++)
      line(image, ox + 24 + i * 5, oy + 43, ox + 20 + i * 7, oy + 55, p[3]);
  } else {
    flame(image, ox + 31, oy + 17, 5, outline, p[2], p[3]);
  }
}

function drawArmoredBase(image, ox, oy, enemy, p, outline, variant) {
  ellipse(image, ox + 32, oy + 54, 20, 4, '#000000', 90);
  rectO(image, ox + 19 - variant, oy + 24, 29 + variant * 2, 25, outline, p[1]);
  rectO(image, ox + 24, oy + 15, 19, 14, outline, p[2]);
  rect(image, ox + 29, oy + 32, 9, 12, p[3]);
  rectO(image, ox + 14, oy + 29, 10, 16, outline, p[2]);
  rectO(image, ox + 43, oy + 29, 10, 16, outline, p[2]);
  rectO(image, ox + 21, oy + 47, 8, 9, outline, p[0]);
  rectO(image, ox + 38, oy + 47, 8, 9, outline, p[0]);
}

function drawSpectralBase(image, ox, oy, enemy, p, outline, variant) {
  diamondO(image, ox + 32, oy + 28, 15 + variant, 18, outline, p[1]);
  diamond(image, ox + 32, oy + 29, 9 + variant, 12, p[2], 210);
  for (let i = 0; i < 4; i++) {
    const x = ox + 20 + i * 8;
    line(image, x, oy + 41, x - 3 + i * 2, oy + 54, p[2], 190);
  }
  spark(image, ox + 19, oy + 18, p[3]);
  spark(image, ox + 48, oy + 20, p[3]);
}

function drawBossBase(image, ox, oy, enemy, p, outline) {
  ellipse(image, ox + 32, oy + 55, 24, 5, '#000000', 110);
  rectO(image, ox + 13, oy + 39, 39, 13, outline, p[0]);
  rectO(image, ox + 18, oy + 22, 29, 25, outline, p[1]);
  diamondO(image, ox + 32, oy + 14, 17, 13, outline, p[2]);
  circle(image, ox + 32, oy + 32, 9, p[2], 180);
  circle(image, ox + 32, oy + 32, 4, p[3]);
  rectO(image, ox + 8, oy + 31, 9, 20, outline, p[1]);
  rectO(image, ox + 49, oy + 31, 9, 20, outline, p[1]);
  if (enemy.id.includes('roshan')) {
    flame(image, ox + 17, oy + 16, 5, outline, p[2], p[3]);
    flame(image, ox + 47, oy + 16, 5, outline, p[2], p[3]);
  }
}

function drawSkillMarks(image, ox, oy, enemy, p, outline) {
  if (enemy.skills.includes('flying')) spark(image, ox + 51, oy + 15, '#e7fbff');
  if (enemy.skills.includes('magicImmune')) circle(image, ox + 32, oy + 32, 17, '#ffffff', 38);
  if (enemy.skills.includes('physicalImmune')) rect(image, ox + 23, oy + 22, 19, 4, '#f3ecff', 180);
  if (enemy.skills.includes('rush')) line(image, ox + 6, oy + 37, ox + 19, oy + 37, p[3], 210);
  if (enemy.skills.includes('blink')) {
    diamond(image, ox + 14, oy + 20, 3, 5, p[3], 220);
    diamond(image, ox + 50, oy + 45, 3, 5, p[3], 220);
  }
  if (enemy.skills.includes('krakenShell')) circle(image, ox + 32, oy + 36, 22, outline, 120);
  if (enemy.skills.includes('evasion')) spark(image, ox + 12, oy + 45, '#d7f1ff');
  if (enemy.skills.includes('thief')) rectO(image, ox + 41, oy + 17, 8, 6, outline, '#d7ae64');
}

function monsterPalette(enemy) {
  const base = enemy.color;
  const dark = mix(base, '#070707', 0.68);
  const mid = mix(base, '#151515', 0.28);
  const light = mix(base, '#ffffff', enemy.boss ? 0.36 : 0.25);
  const pop = enemy.skills.includes('magicImmune')
    ? '#f5d7ff'
    : enemy.skills.includes('flying')
      ? '#e7fbff'
      : mix(base, '#fff2a1', 0.45);
  return [dark, mid, light, pop];
}

function getGemFamily(id) {
  if (id.startsWith('prism')) return 'prism';
  if (id.startsWith('verdant')) return 'verdant';
  if (id.startsWith('night')) return 'night';
  if (id.startsWith('sunward')) return 'sunward';
  return id.split('-')[0];
}

function drawGem(image, ox, oy, id) {
  const family = getGemFamily(id);
  const tierMatch = id.match(/-(\d)$/);
  const tier = tierMatch ? Number(tierMatch[1]) : 4;
  const p = palette[family];
  const cx = ox + 32;
  const cy = oy + 32;
  const scale = tier >= 4 ? 1.05 : 0.76 + tier * 0.08;
  if (family === 'verdant' || family === 'night' || family === 'sunward') {
    drawRelicGem(image, ox, oy, family, p);
    return;
  }
  rect(image, ox + 20, oy + 48, 24, 5, '#090807');
  diamondO(image, cx, cy, Math.round(19 * scale), Math.round(25 * scale), '#090807', '#d7ae64');
  diamondO(image, cx, cy, Math.round(14 * scale), Math.round(20 * scale), p[0], p[1]);
  diamond(image, cx, cy - 1, Math.round(10 * scale), Math.round(16 * scale), p[2]);
  diamond(image, cx - 5, cy - 7, Math.round(4 * scale), Math.round(7 * scale), p[3]);
  line(image, cx - 12, cy, cx + 12, cy, '#fff6d7');
  line(image, cx, cy - 18, cx, cy + 18, p[0]);
  rectO(image, ox + 14, oy + 28, 6, 8, '#090807', '#d7ae64');
  rectO(image, ox + 44, oy + 28, 6, 8, '#090807', '#d7ae64');
  rectO(image, ox + 28, oy + 7, 8, 6, '#090807', '#d7ae64');
  if (tier >= 3 || family === 'prism') {
    spark(image, ox + 15, oy + 18, p[3]);
    spark(image, ox + 49, oy + 17, p[3]);
    spark(image, ox + 51, oy + 45, p[2]);
  }
}

function drawRelicGem(image, ox, oy, family, p) {
  if (family === 'sunward') {
    for (let i = 0; i < 12; i++) {
      const a = (Math.PI * 2 * i) / 12;
      line(
        image,
        ox + 32,
        oy + 32,
        ox + 32 + Math.round(Math.cos(a) * 25),
        oy + 32 + Math.round(Math.sin(a) * 25),
        '#d7ae64',
      );
    }
    circleO(image, ox + 32, oy + 32, 15, '#090807', '#d7ae64');
    circle(image, ox + 32, oy + 32, 9, p[2]);
    circle(image, ox + 34, oy + 29, 4, p[3]);
    return;
  }
  rectO(image, ox + 15, oy + 28, 34, 22, '#090807', p[0]);
  rectO(image, ox + 20, oy + 18, 24, 25, '#090807', p[1]);
  circleO(image, ox + 32, oy + 31, 10, '#090807', p[2]);
  circle(image, ox + 32, oy + 31, 5, p[3]);
  rectO(image, ox + 10, oy + 34, 7, 13, '#090807', '#d7ae64');
  rectO(image, ox + 47, oy + 34, 7, 13, '#090807', '#d7ae64');
  if (family === 'night') {
    rect(image, ox + 29, oy + 12, 6, 28, p[2]);
    spark(image, ox + 50, oy + 17, p[3]);
  } else {
    flame(image, ox + 32, oy + 16, 5, '#090807', p[2], p[3]);
  }
}

function writePng(path, image) {
  const chunks = [];
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(image.width, 0);
  ihdr.writeUInt32BE(image.height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  chunks.push(chunk('IHDR', ihdr));
  const scanlines = Buffer.alloc((image.width * 4 + 1) * image.height);
  for (let y = 0; y < image.height; y++) {
    const rowStart = y * (image.width * 4 + 1);
    scanlines[rowStart] = 0;
    Buffer.from(image.data.buffer, y * image.width * 4, image.width * 4).copy(
      scanlines,
      rowStart + 1,
    );
  }
  chunks.push(chunk('IDAT', deflateSync(scanlines)));
  chunks.push(chunk('IEND', Buffer.alloc(0)));
  writeFileSync(path, Buffer.concat([signature, ...chunks]));
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuffer, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i++) {
    crc ^= buffer[i];
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function hex(value) {
  return [
    Number.parseInt(value.slice(1, 3), 16),
    Number.parseInt(value.slice(3, 5), 16),
    Number.parseInt(value.slice(5, 7), 16),
  ];
}

function mix(a, b, amount) {
  const ah = hex(a);
  const bh = hex(b);
  const out = ah.map((channel, index) =>
    Math.round(channel * (1 - amount) + bh[index] * amount)
      .toString(16)
      .padStart(2, '0'),
  );
  return `#${out.join('')}`;
}

function hash(value) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
