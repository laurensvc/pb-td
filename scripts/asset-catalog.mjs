/** @typedef {'terrain'|'landmark'|'enemy'|'tower'|'projectile'|'fx'} AssetCategory */
/** @typedef {'object'|'character'|'tiles'} PixelLabTool */

/**
 * @typedef {object} AssetCatalogEntry
 * @property {string} id
 * @property {AssetCategory} category
 * @property {string} exportPath
 * @property {string} phaserKey
 * @property {string} prompt
 * @property {number} [size]
 * @property {PixelLabTool} tool
 * @property {number} frameWidth
 * @property {number} frameHeight
 * @property {number} frames
 * @property {number} fps
 * @property {number} batch
 * @property {string} [animation]
 * @property {string} [parentId]
 */

export const STYLE_SUFFIX =
  'GemTD-inspired fantasy crystal maze, Warcraft 3 custom map readability, high top-down pixel art, clean silhouette, single-color dark outline, medium shading, readable at 32 pixels, crisp pixel edges, transparent background, background removed, no square backdrop, isolated sprite'

const PUBLIC_ROOT = 'apps/web/public'

/** @param {string} rel @returns {string} */
export function publicPath(rel) {
  return `${PUBLIC_ROOT}/${rel}`
}

/** @param {string} prompt @returns {string} */
function withStyle(prompt) {
  return `${prompt}, ${STYLE_SUFFIX}`
}

/** @type {AssetCatalogEntry[]} */
export const VERTICAL_SLICE_CATALOG = [
  // Batch 1 — terrain
  {
    id: 'terrain.default-floor',
    category: 'terrain',
    exportPath: publicPath('assets/terrain/tiles/default-floor.png'),
    phaserKey: 'terrain.default-floor',
    prompt:
      'top-down seamless 32x32 pixel art terrain tile, soft green grass meadow with tiny wildflower specks and subtle shade variation, gameplay-readable buildable floor, subtle detail only, no tall objects, no path lane paint, no text, crisp pixel edges',
    tool: 'tiles',
    frameWidth: 32,
    frameHeight: 32,
    frames: 1,
    fps: 0,
    batch: 1,
  },
  {
    id: 'terrain.path-floor',
    category: 'terrain',
    exportPath: publicPath('assets/terrain/tiles/path-floor.png'),
    phaserKey: 'terrain.path-floor',
    prompt:
      'top-down seamless 32x32 pixel art terrain tile, muted brown-grey worn path stone with subtle cracks, debug path overlay tile, subtle detail only, no text, crisp pixel edges',
    tool: 'tiles',
    frameWidth: 32,
    frameHeight: 32,
    frames: 1,
    fps: 0,
    batch: 1,
  },
  {
    id: 'terrain.blocked-floor',
    category: 'terrain',
    exportPath: publicPath('assets/terrain/tiles/blocked-floor.png'),
    phaserKey: 'terrain.blocked-floor',
    prompt:
      'top-down seamless 32x32 pixel art terrain tile, dark unbuildable stone slab with rough edges, clearly reads as blocked cell, subtle detail only, no text, crisp pixel edges',
    tool: 'tiles',
    frameWidth: 32,
    frameHeight: 32,
    frames: 1,
    fps: 0,
    batch: 1,
  },

  // Batch 2 — landmarks + UX
  {
    id: 'env.spawn-gate',
    category: 'landmark',
    exportPath: publicPath('assets/terrain/objects/spawn-gate.png'),
    phaserKey: 'env.spawn-gate',
    prompt: withStyle(
      'top-down pixel art map object, monster spawn gate made from cracked stone pillars with green portal core, enemy entry point',
    ),
    size: 64,
    tool: 'object',
    frameWidth: 64,
    frameHeight: 64,
    frames: 1,
    fps: 0,
    batch: 2,
  },
  {
    id: 'env.goal-nexus',
    category: 'landmark',
    exportPath: publicPath('assets/terrain/objects/goal-nexus.png'),
    phaserKey: 'env.goal-nexus',
    prompt: withStyle(
      'top-down pixel art map object, crystal nexus goal core with glowing gem castle heart, player lives at stake',
    ),
    size: 64,
    tool: 'object',
    frameWidth: 64,
    frameHeight: 64,
    frames: 1,
    fps: 0,
    batch: 2,
  },
  ...[1, 2, 3, 4, 5].map((n) => ({
    id: `env.checkpoint-${n}`,
    category: 'landmark',
    exportPath: publicPath(`assets/terrain/objects/checkpoint-${n}.png`),
    phaserKey: `env.checkpoint-${n}`,
    prompt: withStyle(
      `top-down pixel art map object, small stone rune pillar waypoint marker with clear number ${n} engraved`,
    ),
    size: 64,
    tool: 'object',
    frameWidth: 64,
    frameHeight: 64,
    frames: 1,
    fps: 0,
    batch: 2,
  })),
  {
    id: 'env.rock',
    category: 'landmark',
    exportPath: publicPath('assets/terrain/objects/rock.png'),
    phaserKey: 'env.rock',
    prompt: withStyle(
      'top-down pixel art map object, grey maze wall boulder from converted gems, chunky readable rock blocker',
    ),
    size: 64,
    tool: 'object',
    frameWidth: 64,
    frameHeight: 64,
    frames: 1,
    fps: 0,
    batch: 2,
  },
  {
    id: 'fx.selection-ring',
    category: 'landmark',
    exportPath: publicPath('assets/terrain/objects/selection-ring.png'),
    phaserKey: 'fx.selection-ring',
    prompt: withStyle(
      'top-down pixel art build placement ring, soft green circular highlight for legal cell hover, hollow ring only',
    ),
    size: 64,
    tool: 'object',
    frameWidth: 64,
    frameHeight: 64,
    frames: 1,
    fps: 0,
    batch: 2,
  },
  {
    id: 'fx.invalid-ring',
    category: 'landmark',
    exportPath: publicPath('assets/terrain/objects/invalid-ring.png'),
    phaserKey: 'fx.invalid-ring',
    prompt: withStyle(
      'top-down pixel art build placement ring, red circular highlight for illegal blocked cell hover, hollow ring only',
    ),
    size: 64,
    tool: 'object',
    frameWidth: 64,
    frameHeight: 64,
    frames: 1,
    fps: 0,
    batch: 2,
  },

  // Batch 3 — stone-grunt smoke test
  ...['walk', 'hit', 'death'].map((anim) => ({
    id: `enemy.stone-grunt.${anim}`,
    category: 'enemy',
    exportPath: publicPath(`assets/enemies/stone-grunt/${anim}.png`),
    phaserKey: `enemy.stone-grunt.${anim}`,
    prompt: withStyle(
      'top-down pixel art monster sprite, broad simple stone grunt torso, baseline neutral threat ground enemy, facing downward-right',
    ),
    size: 64,
    tool: 'character',
    frameWidth: 64,
    frameHeight: 64,
    frames: anim === 'hit' ? 3 : 8,
    fps: anim === 'walk' ? 10 : anim === 'hit' ? 14 : 12,
    batch: 3,
    animation: anim,
    parentId: 'stone-grunt',
  })),

  // Batch 4 — flame family smoke test + projectile + hit FX
  ...[1, 2, 3].flatMap((tier) =>
    ['idle', 'attack', 'build'].map((anim) => ({
      id: `tower.flame-t${tier}.${anim}`,
      category: 'tower',
      exportPath: publicPath(`assets/towers/flame-t${tier}/${anim}.png`),
      phaserKey: `tower.flame-t${tier}.${anim}`,
      prompt: withStyle(
        `top-down pixel art GemTD-inspired crystal tower, tier ${tier} flame gem tower with jagged ruby-orange crystal and small ember vents, clearly reads as splash fire damage, sits on a small dark stone base, readable at 40 pixels`,
      ),
      size: 64,
      tool: 'object',
      frameWidth: 64,
      frameHeight: 64,
      frames: anim === 'idle' ? 6 : anim === 'attack' ? 6 : 8,
      fps: anim === 'idle' ? 6 : anim === 'attack' ? 12 : 12,
      batch: 4,
      animation: anim,
      parentId: `flame-t${tier}`,
    })),
  ),
  {
    id: 'projectile.flame-bolt',
    category: 'projectile',
    exportPath: publicPath('assets/projectiles/flame-bolt.png'),
    phaserKey: 'projectile.flame-bolt',
    prompt: withStyle(
      'top-down pixel art tower defense projectile, orange ember orb with short motion trail, color-coded for flame damage, strong readable shape at 16 pixels',
    ),
    size: 32,
    tool: 'object',
    frameWidth: 32,
    frameHeight: 32,
    frames: 1,
    fps: 0,
    batch: 4,
  },
  {
    id: 'fx.hit-spark',
    category: 'fx',
    exportPath: publicPath('assets/particles/hit-spark.png'),
    phaserKey: 'fx.hit-spark',
    prompt:
      'top-down pixel art tower defense impact effect spritesheet, bright yellow-white hit spark burst with tiny shards, short one-shot burst, readable at 32 pixels, crisp pixel edges, transparent background, background removed, no square backdrop',
    size: 32,
    tool: 'object',
    frameWidth: 32,
    frameHeight: 32,
    frames: 6,
    fps: 20,
    batch: 4,
  },

  // Batch 5 — remaining monsters
  ...['walk', 'hit', 'death'].flatMap((anim) => [
    {
      id: `enemy.crystal-runner.${anim}`,
      category: 'enemy',
      exportPath: publicPath(`assets/enemies/crystal-runner/${anim}.png`),
      phaserKey: `enemy.crystal-runner.${anim}`,
      prompt: withStyle(
        'top-down pixel art monster sprite, fast crystal runner with lean hunched body, narrow sprinting silhouette, clearly reads as fast low-health enemy, facing downward-right',
      ),
      size: 64,
      tool: 'character',
      frameWidth: 64,
      frameHeight: 64,
      frames: anim === 'hit' ? 3 : 8,
      fps: anim === 'walk' ? 10 : anim === 'hit' ? 14 : 12,
      batch: 5,
      animation: anim,
      parentId: 'crystal-runner',
    },
  ]),
  ...['walk', 'hit', 'death'].flatMap((anim) => [
    {
      id: `enemy.shield-bulwark.${anim}`,
      category: 'enemy',
      exportPath: publicPath(`assets/enemies/shield-bulwark/${anim}.png`),
      phaserKey: `enemy.shield-bulwark.${anim}`,
      prompt: withStyle(
        'top-down pixel art monster sprite, armored shield bulwark with large frontal shell, slow heavy ground enemy, facing downward-right',
      ),
      size: 64,
      tool: 'character',
      frameWidth: 64,
      frameHeight: 64,
      frames: anim === 'hit' ? 3 : 8,
      fps: anim === 'walk' ? 10 : anim === 'hit' ? 14 : 12,
      batch: 5,
      animation: anim,
      parentId: 'shield-bulwark',
    },
  ]),
  ...['fly', 'hit', 'death'].flatMap((anim) => [
    {
      id: `enemy.sky-warden.${anim}`,
      category: 'enemy',
      exportPath: publicPath(`assets/enemies/sky-warden/${anim}.png`),
      phaserKey: `enemy.sky-warden.${anim}`,
      prompt: withStyle(
        'top-down pixel art monster sprite, flying sky warden with spread wings and hover body, aerial enemy, facing downward-right',
      ),
      size: 64,
      tool: 'character',
      frameWidth: 64,
      frameHeight: 64,
      frames: anim === 'hit' ? 3 : 8,
      fps: anim === 'fly' ? 10 : anim === 'hit' ? 14 : 12,
      batch: 5,
      animation: anim,
      parentId: 'sky-warden',
    },
  ]),
  {
    id: 'enemy.sky-warden.shadow',
    category: 'enemy',
    exportPath: publicPath('assets/enemies/sky-warden/shadow.png'),
    phaserKey: 'enemy.sky-warden.shadow',
    prompt: withStyle(
      'top-down pixel art soft oval flying enemy shadow, dark translucent ellipse, simple ground shadow',
    ),
    size: 64,
    tool: 'object',
    frameWidth: 64,
    frameHeight: 64,
    frames: 1,
    fps: 0,
    batch: 5,
  },
  ...['walk', 'hit', 'death', 'spawn'].flatMap((anim) => [
    {
      id: `enemy.gate-colossus.${anim}`,
      category: 'enemy',
      exportPath: publicPath(`assets/enemies/gate-colossus/${anim}.png`),
      phaserKey: `enemy.gate-colossus.${anim}`,
      prompt: withStyle(
        'top-down pixel art boss monster sprite, gate colossus with large crown horns and glowing core, intimidating boss silhouette, facing downward-right',
      ),
      size: 96,
      tool: 'character',
      frameWidth: 96,
      frameHeight: 96,
      frames: anim === 'hit' ? 3 : 8,
      fps: anim === 'walk' ? 10 : anim === 'hit' ? 14 : anim === 'spawn' ? 10 : 12,
      batch: 5,
      animation: anim,
      parentId: 'gate-colossus',
    },
  ]),

  // Batch 6 — remaining towers + projectiles + FX
  ...['stone', 'thorn'].flatMap((family) =>
    [1, 2, 3].flatMap((tier) =>
      ['idle', 'attack', 'build'].map((anim) => ({
        id: `tower.${family}-t${tier}.${anim}`,
        category: 'tower',
        exportPath: publicPath(`assets/towers/${family}-t${tier}/${anim}.png`),
        phaserKey: `tower.${family}-t${tier}.${anim}`,
        prompt: withStyle(
          family === 'stone'
            ? `top-down pixel art GemTD-inspired crystal tower, tier ${tier} stone gem tower with grey-gold granite shard crystal, heavy slow damage read, sits on a small dark stone base`
            : `top-down pixel art GemTD-inspired crystal tower, tier ${tier} thorn gem tower with green thorn crystal and vine lens facets, poison damage read, sits on a small dark stone base`,
        ),
        size: 64,
        tool: 'object',
        frameWidth: 64,
        frameHeight: 64,
        frames: anim === 'idle' ? 6 : anim === 'attack' ? 6 : 8,
        fps: anim === 'idle' ? 6 : 12,
        batch: 6,
        animation: anim,
        parentId: `${family}-t${tier}`,
      })),
    ),
  ),
  ...['idle', 'attack', 'build'].map((anim) => ({
    id: `tower.magma-core.${anim}`,
    category: 'tower',
    exportPath: publicPath(`assets/towers/magma-core/${anim}.png`),
    phaserKey: `tower.magma-core.${anim}`,
    prompt: withStyle(
      'top-down pixel art GemTD-inspired special crystal tower, magma core with molten orange-red crystal vents and elite oversized silhouette, sits on a small dark stone base',
    ),
    size: 96,
    tool: 'object',
    frameWidth: 96,
    frameHeight: 96,
    frames: anim === 'idle' ? 6 : anim === 'attack' ? 6 : 8,
    fps: anim === 'idle' ? 6 : 12,
    batch: 6,
    animation: anim,
    parentId: 'magma-core',
  })),
  {
    id: 'projectile.stone-shard',
    category: 'projectile',
    exportPath: publicPath('assets/projectiles/stone-shard.png'),
    phaserKey: 'projectile.stone-shard',
    prompt: withStyle(
      'top-down pixel art tower defense projectile, grey-gold heavy stone shard with short trail, color-coded for stone damage',
    ),
    size: 32,
    tool: 'object',
    frameWidth: 32,
    frameHeight: 32,
    frames: 1,
    fps: 0,
    batch: 6,
  },
  {
    id: 'projectile.thorn-spore',
    category: 'projectile',
    exportPath: publicPath('assets/projectiles/thorn-spore.png'),
    phaserKey: 'projectile.thorn-spore',
    prompt: withStyle(
      'top-down pixel art tower defense projectile, green poison spore seed with tiny thorn flecks, color-coded for thorn damage',
    ),
    size: 32,
    tool: 'object',
    frameWidth: 32,
    frameHeight: 32,
    frames: 1,
    fps: 0,
    batch: 6,
  },
  {
    id: 'projectile.magma-core-shot',
    category: 'projectile',
    exportPath: publicPath('assets/projectiles/magma-core-shot.png'),
    phaserKey: 'projectile.magma-core-shot',
    prompt: withStyle(
      'top-down pixel art tower defense projectile, larger molten orange shell with ember trail, magma core special shot',
    ),
    size: 64,
    tool: 'object',
    frameWidth: 64,
    frameHeight: 64,
    frames: 1,
    fps: 0,
    batch: 6,
  },
  ...[
    {
      id: 'fx.burn-tick',
      prompt:
        'top-down pixel art tower defense impact effect spritesheet, subtle orange flame DoT tick with tiny embers, short loop, readable at 32 pixels, transparent background',
      frames: 6,
      fps: 10,
    },
    {
      id: 'fx.poison-tick',
      prompt:
        'top-down pixel art tower defense impact effect spritesheet, subtle green poison bubble tick with toxic flecks, short loop, readable at 32 pixels, transparent background',
      frames: 6,
      fps: 10,
    },
    {
      id: 'fx.merge-burst',
      prompt:
        'top-down pixel art tower defense impact effect spritesheet, celebratory gem merge burst with violet sparkles and crystal shards, short one-shot burst, transparent background',
      frames: 10,
      fps: 18,
    },
    {
      id: 'fx.build-flash',
      prompt:
        'top-down pixel art tower defense impact effect spritesheet, white-gold gem to tower build flash with rising sparkles, short one-shot burst, transparent background',
      frames: 8,
      fps: 18,
    },
  ].map((fx) => ({
    id: fx.id,
    category: 'fx',
    exportPath: publicPath(`assets/particles/${fx.id.slice(3)}.png`),
    phaserKey: fx.id,
    prompt: fx.prompt,
    size: 32,
    tool: 'object',
    frameWidth: 32,
    frameHeight: 32,
    frames: fx.frames,
    fps: fx.fps,
    batch: 6,
  })),
]

/** @param {number} [batch] */
export function catalogByBatch(batch) {
  if (batch == null) return VERTICAL_SLICE_CATALOG
  return VERTICAL_SLICE_CATALOG.filter((e) => e.batch === batch)
}

/** @param {string} id */
export function getCatalogEntry(id) {
  return VERTICAL_SLICE_CATALOG.find((e) => e.id === id)
}
