import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

const outDir = join(process.cwd(), 'public', 'assets', 'sprites');
mkdirSync(outDir, { recursive: true });

const FRAME = 64;
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
const gems = makeImage(FRAME * 7, FRAME * 4);
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
  const x = (index % 7) * FRAME;
  const y = Math.floor(index / 7) * FRAME;
  drawGem(gems, x, y, id);
  metadata.gems[id] = { sheet: 'gems', frame: { x, y, w: FRAME, h: FRAME } };
}

writePng(join(outDir, 'monsters.png'), monsters);
writePng(join(outDir, 'gems.png'), gems);
writeFileSync(join(outDir, 'sprites.json'), `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');

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

function drawMonster(image, ox, oy, id, animation, frame) {
  const p = monsterPalette[id];
  const bob = animation === 'walk' ? [0, -2, 1, -1][frame] : animation === 'attack' ? -1 : 0;
  const lean = animation === 'attack' ? frame * 2 : animation === 'walk' ? [0, 1, -1, 1][frame] : 0;
  if (animation === 'death') {
    const sink = frame * 5;
    rect(image, ox + 20, oy + 42 + sink, 24, Math.max(4, 14 - frame * 3), p[1]);
    rect(image, ox + 18, oy + 40 + sink, 28, 4, p[2]);
    for (let i = 0; i < 6 - frame; i++) circle(image, ox + 16 + i * 7, oy + 34 - i, 2, p[3]);
    return;
  }
  if (id === 'obelisk') {
    rect(image, ox + 19 + lean, oy + 20 + bob, 26, 30, p[1]);
    diamond(image, ox + 32 + lean, oy + 17 + bob, 14, 13, p[2]);
    rect(image, ox + 26 + lean, oy + 25 + bob, 12, 22, p[3]);
    rect(image, ox + 14, oy + 50, 36, 7, p[0]);
  } else if (id === 'glass-hex') {
    diamond(image, ox + 32 + lean, oy + 25 + bob, 16, 18, p[2]);
    circle(image, ox + 32 + lean, oy + 29 + bob, 7, p[1]);
    line(image, ox + 20 + lean, oy + 36 + bob, ox + 13, oy + 47, p[2]);
    line(image, ox + 44 + lean, oy + 36 + bob, ox + 51, oy + 47, p[2]);
    rect(image, ox + 24, oy + 47, 5, 9, p[1]);
    rect(image, ox + 36, oy + 47, 5, 9, p[1]);
  } else if (id === 'iron-wight') {
    rect(image, ox + 21 + lean, oy + 21 + bob, 24, 27, p[1]);
    rect(image, ox + 24 + lean, oy + 15 + bob, 18, 14, p[2]);
    rect(image, ox + 29 + lean, oy + 31 + bob, 7, 10, p[3]);
    rect(image, ox + 14 + lean, oy + 29 + bob, 8, 18, p[2]);
    rect(image, ox + 44 + lean, oy + 29 + bob, 8, 18, p[2]);
    rect(image, ox + 21, oy + 48, 7, 8, p[0]);
    rect(image, ox + 39, oy + 48, 7, 8, p[0]);
  } else if (id === 'slag-runner') {
    rect(image, ox + 18 + lean, oy + 27 + bob, 31, 16, p[1]);
    circle(image, ox + 47 + lean, oy + 27 + bob, 9, p[2]);
    rect(image, ox + 20, oy + 43 + bob, 7, 11, p[3]);
    rect(image, ox + 39, oy + 43 + bob, 7, 11, p[3]);
    if (animation === 'walk') rect(image, ox + 7, oy + 31 + frame, 12, 4, p[2], 210);
  } else {
    circle(image, ox + 32 + lean, oy + 27 + bob, 13, p[2]);
    rect(image, ox + 22 + lean, oy + 34 + bob, 22, 15, p[1]);
    rect(image, ox + 19 + lean, oy + 13 + bob, 6, 12, p[3]);
    rect(image, ox + 39 + lean, oy + 13 + bob, 6, 12, p[3]);
    rect(image, ox + 24, oy + 48, 6, 8, p[0]);
    rect(image, ox + 37, oy + 48, 6, 8, p[0]);
    if (animation === 'attack') circle(image, ox + 51 + frame * 2, oy + 28, 4 + frame, p[3]);
  }
  setPixel(image, ox + 36 + lean, oy + 25 + bob, '#fff6d7');
}

function drawGem(image, ox, oy, id) {
  const family = id.startsWith('prism')
    ? 'prism'
    : id.startsWith('verdant')
      ? 'verdant'
      : id.startsWith('night')
        ? 'night'
        : id.startsWith('sunward')
          ? 'sunward'
          : id.split('-')[0];
  const tierMatch = id.match(/-(\d)$/);
  const tier = tierMatch ? Number(tierMatch[1]) : 4;
  const p = palette[family];
  const cx = ox + 32;
  const cy = oy + 32;
  const scale = tier >= 4 ? 1.15 : 0.82 + tier * 0.08;
  rect(image, ox + 20, oy + 47, 24, 5, '#271d15');
  diamond(image, cx, cy, Math.round(16 * scale), Math.round(22 * scale), p[1]);
  diamond(image, cx, cy - 1, Math.round(11 * scale), Math.round(17 * scale), p[2]);
  diamond(image, cx - 4, cy - 5, Math.round(4 * scale), Math.round(7 * scale), p[3]);
  line(image, cx - 15, cy, cx + 15, cy, '#fff6d7');
  line(image, cx, cy - 21, cx, cy + 20, p[0]);
  rect(image, ox + 18, oy + 30, 5, 5, '#d7ae64');
  rect(image, ox + 41, oy + 30, 5, 5, '#d7ae64');
  if (tier >= 3 || family.length > 6) {
    circle(image, ox + 15, oy + 18, 2, p[3]);
    circle(image, ox + 48, oy + 17, 2, p[3]);
    circle(image, ox + 51, oy + 45, 2, p[2]);
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
