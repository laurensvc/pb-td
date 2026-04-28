import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

const outDir = join(process.cwd(), 'public', 'assets', 'sprites');
mkdirSync(outDir, { recursive: true });

const FRAME = 64;
/** Gem atlas columns × rows (28 slots). */
const GEMS_COLS = 7;
const GEMS_ROWS = 4;
const monsterIds = ['cinderling', 'slag-runner', 'iron-wight', 'glass-hex', 'obelisk'];
const monsterAnimations = {
  idle: { frames: 2, duration: 260 },
  walk: { frames: 4, duration: 120 },
  attack: { frames: 3, duration: 95 },
  death: { frames: 4, duration: 130 },
};
const monsterSequence = [
  ['idle', 0],
  ['idle', 1],
  ['walk', 0],
  ['walk', 1],
  ['walk', 2],
  ['walk', 3],
  ['attack', 0],
  ['attack', 1],
  ['attack', 2],
  ['death', 0],
  ['death', 1],
  ['death', 2],
  ['death', 3],
];
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

const monsterPalette = {
  cinderling: ['#30100b', '#7b2d13', '#d27633', '#ffd36e'],
  'slag-runner': ['#18100d', '#3d3329', '#e06624', '#ffd46b'],
  'iron-wight': ['#17191a', '#4b514d', '#9ca79b', '#f0a43c'],
  'glass-hex': ['#0b2734', '#1e7084', '#80dffc', '#e7fbff'],
  obelisk: ['#151019', '#332743', '#ad7bf2', '#f2d7ff'],
};

const monsters = makeImage(FRAME * monsterSequence.length, FRAME * monsterIds.length);
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

for (let row = 0; row < monsterIds.length; row++) {
  const id = monsterIds[row];
  metadata.monsters[id] = { sheet: 'monsters', animations: {} };
  for (const [name, config] of Object.entries(monsterAnimations)) {
    metadata.monsters[id].animations[name] = { frames: [], frameDurationMs: config.duration };
  }
  for (let col = 0; col < monsterSequence.length; col++) {
    const [animation, frame] = monsterSequence[col];
    drawMonster(monsters, col * FRAME, row * FRAME, id, animation, frame);
    metadata.monsters[id].animations[animation].frames.push({
      x: col * FRAME,
      y: row * FRAME,
      w: FRAME,
      h: FRAME,
    });
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
console.log(`Sprite atlases: monsters.png, gems.png, sprites.json → ${outDirForLog}`);

function makeImage(width, height) {
  return { width, height, data: new Uint8Array(width * height * 4) };
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

function diamond(image, cx, cy, rx, ry, color, alpha = 255) {
  for (let y = -ry; y <= ry; y++) {
    const span = Math.floor(rx * (1 - Math.abs(y) / (ry + 1)));
    for (let x = -span; x <= span; x++) setPixel(image, cx + x, cy + y, color, alpha);
  }
}

function circle(image, cx, cy, r, color, alpha = 255) {
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      if (x * x + y * y <= r * r) setPixel(image, cx + x, cy + y, color, alpha);
    }
  }
}

function line(image, x1, y1, x2, y2, color) {
  const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
  for (let i = 0; i <= steps; i++) {
    const t = steps === 0 ? 0 : i / steps;
    setPixel(image, Math.round(x1 + (x2 - x1) * t), Math.round(y1 + (y2 - y1) * t), color);
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

function shadow(image, ox, oy, width = 36) {
  ellipse(image, ox + 32, oy + 53, Math.floor(width / 2), 5, '#090807', 150);
}

function drawMonster(image, ox, oy, id, animation, frame) {
  const p = monsterPalette[id];
  const outline = '#080706';
  const bob = animation === 'walk' ? [0, -2, 1, -1][frame] : animation === 'attack' ? -2 : 0;
  const lean = animation === 'attack' ? frame * 2 : animation === 'walk' ? [0, 1, -1, 1][frame] : 0;
  shadow(image, ox, oy, id === 'obelisk' ? 46 : id === 'iron-wight' ? 42 : 34);
  if (animation === 'death') {
    drawDeath(image, ox, oy, id, frame, p);
    return;
  }
  if (id === 'obelisk') {
    drawObelisk(image, ox, oy, animation, frame, bob, p, outline);
  } else if (id === 'glass-hex') {
    drawGlassHex(image, ox, oy, animation, frame, bob, lean, p, outline);
  } else if (id === 'iron-wight') {
    drawIronWight(image, ox, oy, animation, frame, bob, lean, p, outline);
  } else if (id === 'slag-runner') {
    drawSlagRunner(image, ox, oy, animation, frame, bob, lean, p, outline);
  } else {
    drawCinderling(image, ox, oy, animation, frame, bob, lean, p, outline);
  }
}

function drawDeath(image, ox, oy, id, frame, p) {
  const collapse = frame * 4;
  if (id === 'glass-hex') {
    for (let i = 0; i < 7 - frame; i++)
      diamondO(image, ox + 14 + i * 7, oy + 43 - i, 3, 6, '#071016', p[2]);
  } else if (id === 'obelisk') {
    for (let i = 0; i < 8 - frame; i++)
      rectO(image, ox + 10 + i * 6, oy + 46 - i, 5, 8, '#080706', p[1]);
    flame(image, ox + 32, oy + 40 + collapse, 8, p[0], p[2], p[3]);
  } else {
    rectO(image, ox + 18, oy + 42 + collapse, 30, Math.max(5, 13 - frame * 2), '#080706', p[1]);
    flame(image, ox + 34, oy + 35 + collapse, Math.max(3, 8 - frame), p[0], p[2], p[3]);
  }
  for (let i = 0; i < 4 - frame; i++) spark(image, ox + 12 + i * 13, oy + 24 + i * 3, p[3]);
}

function drawCinderling(image, ox, oy, animation, frame, bob, lean, p, outline) {
  const wing = animation === 'walk' ? [0, 2, -1, 1][frame] : 0;
  diamondO(image, ox + 20 + lean, oy + 28 + bob + wing, 12, 9, outline, '#6a1c10');
  diamondO(image, ox + 45 + lean, oy + 28 + bob - wing, 10, 8, outline, '#6a1c10');
  circleO(image, ox + 33 + lean, oy + 29 + bob, 13, outline, p[2]);
  rectO(image, ox + 24 + lean, oy + 37 + bob, 18, 13, outline, p[1]);
  flame(image, ox + 22 + lean, oy + 14 + bob, 5, outline, p[2], p[3]);
  flame(image, ox + 43 + lean, oy + 14 + bob, 5, outline, p[2], p[3]);
  line(image, ox + 19 + lean, oy + 41 + bob, ox + 11, oy + 36 + bob, outline);
  flame(image, ox + 10 + lean, oy + 35 + bob, 4, outline, p[2], p[3]);
  rectO(image, ox + 20, oy + 49 + bob, 6, 7, outline, p[0]);
  rectO(image, ox + 38, oy + 49 + bob, 6, 7, outline, p[0]);
  rectO(image, ox + 42 + lean, oy + 36 + bob, 10, 4, outline, p[1]);
  if (animation === 'attack')
    flame(image, ox + 54 + frame * 2, oy + 32 + bob, 6 + frame, outline, p[2], p[3]);
  setPixel(image, ox + 37 + lean, oy + 27 + bob, '#fff6d7');
}

function drawSlagRunner(image, ox, oy, animation, frame, bob, lean, p, outline) {
  const stretch =
    animation === 'walk' ? [0, 3, 5, 2][frame] : animation === 'attack' ? 2 + frame : 0;
  if (animation === 'walk') {
    rect(image, ox + 4, oy + 30 + frame, 16 + frame * 2, 3, p[2], 190);
    rect(image, ox + 7, oy + 35 + frame, 11 + frame, 3, p[3], 180);
  }
  ellipse(image, ox + 31 + lean, oy + 32 + bob, 21 + stretch, 12, outline);
  ellipse(image, ox + 32 + lean, oy + 31 + bob, 18 + stretch, 9, p[1]);
  circleO(image, ox + 48 + lean + stretch, oy + 28 + bob, 9, outline, p[1]);
  diamond(image, ox + 50 + lean + stretch, oy + 29 + bob, 7, 5, p[2]);
  for (let i = 0; i < 4; i++) {
    const lx = ox + 17 + i * 9 + (i % 2 === frame % 2 ? 2 : -1);
    rectO(image, lx, oy + 41 + bob, 5, 11, outline, i % 2 ? p[2] : p[0]);
  }
  line(image, ox + 21 + lean, oy + 28 + bob, ox + 45 + lean, oy + 34 + bob, p[3]);
  line(image, ox + 25 + lean, oy + 36 + bob, ox + 38 + lean, oy + 25 + bob, p[2]);
  if (animation === 'attack') flame(image, ox + 49 + frame * 2, oy + 44, 7, outline, p[2], p[3]);
}

function drawIronWight(image, ox, oy, animation, frame, bob, lean, p, outline) {
  const attack = animation === 'attack';
  rectO(image, ox + 20 + lean, oy + 23 + bob, 25, 25, outline, p[1]);
  rectO(image, ox + 24 + lean, oy + 14 + bob, 18, 14, outline, p[2]);
  rectO(image, ox + 16 + lean, oy + 25 + bob, 10, 19, outline, p[2]);
  rectO(image, ox + 42 + lean, oy + 25 + bob, 10, 19, outline, p[2]);
  rectO(image, ox + 21, oy + 47 + bob, 8, 9, outline, p[0]);
  rectO(image, ox + 38, oy + 47 + bob, 8, 9, outline, p[0]);
  rect(image, ox + 30 + lean, oy + 33 + bob, 8, 10, p[3]);
  rect(image, ox + 27 + lean, oy + 18 + bob, 4, 3, p[3]);
  rect(image, ox + 36 + lean, oy + 18 + bob, 4, 3, p[3]);
  line(image, ox + 18 + lean, oy + 30 + bob, ox + 45 + lean, oy + 30 + bob, '#d7ae64');
  if (attack) {
    line(image, ox + 14, oy + 31, ox + 8, oy + 17 + frame * 5, outline);
    circleO(image, ox + 7, oy + 15 + frame * 5, 6, outline, p[2]);
    flame(image, ox + 50, oy + 45, 4 + frame, outline, '#d27633', p[3]);
  }
}

function drawGlassHex(image, ox, oy, animation, frame, bob, lean, p, outline) {
  const burst = animation === 'attack' ? frame * 4 : 0;
  diamondO(image, ox + 32 + lean, oy + 28 + bob, 15, 18, outline, p[2]);
  diamond(image, ox + 32 + lean, oy + 29 + bob, 8, 11, p[1]);
  diamondO(image, ox + 18 - burst, oy + 25 + bob, 6, 13, outline, p[2]);
  diamondO(image, ox + 46 + burst, oy + 24 + bob, 6, 13, outline, p[2]);
  diamondO(image, ox + 24 + lean, oy + 12 + bob, 5, 10, outline, p[3]);
  diamondO(image, ox + 42 + lean, oy + 13 + bob, 5, 10, outline, p[3]);
  line(image, ox + 24 + lean, oy + 39 + bob, ox + 16, oy + 51, outline);
  line(image, ox + 41 + lean, oy + 39 + bob, ox + 49, oy + 51, outline);
  rectO(image, ox + 15, oy + 48, 7, 6, outline, p[1]);
  rectO(image, ox + 44, oy + 48, 7, 6, outline, p[1]);
  if (animation === 'attack') {
    for (let i = 0; i < 5; i++) diamond(image, ox + 12 + i * 9, oy + 37 - i * 2, 3, 5, p[3]);
  }
}

function drawObelisk(image, ox, oy, animation, frame, bob, p, outline) {
  const pulse = animation === 'attack' ? frame * 2 : animation === 'idle' ? frame : 0;
  rectO(image, ox + 14, oy + 45, 36, 10, outline, p[0]);
  rectO(image, ox + 19, oy + 25 + bob, 26, 24, outline, p[1]);
  diamondO(image, ox + 32, oy + 17 + bob, 14, 13, outline, p[1]);
  rect(image, ox + 26, oy + 27 + bob, 12, 21, p[2]);
  rect(image, ox + 29, oy + 29 + bob, 6, 17, p[3]);
  rectO(image, ox + 9, oy + 31, 7, 20, outline, p[1]);
  rectO(image, ox + 49, oy + 31, 7, 20, outline, p[1]);
  circle(image, ox + 32, oy + 35 + bob, 7 + pulse, p[2], 180);
  circle(image, ox + 32, oy + 35 + bob, 3 + pulse, p[3]);
  if (animation === 'attack') {
    rect(image, ox + 47, oy + 32, 10 + frame * 3, 5, p[2], 220);
    spark(image, ox + 58, oy + 34, p[3]);
  }
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
