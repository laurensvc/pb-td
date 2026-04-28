import { describe, expect, it } from 'vitest';
import { gameConfig } from './config';
import { createGame, createSnapshot, dispatchGameAction, tickGame } from './engine';
import type {
  EnemyState,
  GemFamily,
  GemTier,
  TargetMode,
  TowerState,
  WaveDefinition,
} from './types';

function tower(
  id: number,
  x: number,
  y: number,
  family: GemFamily = 'ruby',
  tier: GemTier = 1,
): TowerState {
  return {
    id,
    gemId: `${family}-${tier}`,
    name: 'Test Gem',
    family,
    tier,
    classification: 'gem',
    x,
    y,
    damage: 10,
    range: 5,
    cooldown: 1,
    cooldownLeft: 0,
    projectileSpeed: 8,
    color: '#e15c5c',
    damageType: 'physical',
    effects: [],
    kills: 0,
    roundDamage: 0,
    totalDamage: 0,
    mvpAwards: 0,
    stopped: false,
    targetId: null,
    targetMode: 'first',
    buffUntil: 0,
    attackSpeedBuff: 0,
    rangeBuff: 0,
    critBuff: 0,
    critMultiplier: 1,
  };
}

function enemy(id = 1, x = 5, y = 5): EnemyState {
  return {
    id,
    definitionId: 'frenzied-pig',
    name: 'Target',
    x,
    y,
    hp: 1000,
    maxHp: 1000,
    speed: 1,
    reward: 0,
    armor: 0,
    checkpointIndex: 0,
    path: [
      { x, y },
      { x: x + 10, y },
    ],
    pathIndex: 0,
    alive: true,
    reachedExit: false,
    slowUntil: 0,
    slowMultiplier: 1,
    sapphireSlowUntil: [0, 0, 0, 0, 0, 0],
    sapphireSlowMultiplier: [1, 1, 1, 1, 1, 1],
    poisonDps: 0,
    poisonUntil: 0,
    burnDps: 0,
    burnUntil: 0,
    stunUntil: 0,
    refraction: 0,
    blinkCooldown: 0,
    rechargeTimer: 0,
    revealedUntil: 0,
    color: '#fca5a5',
    skills: [],
    invisible: false,
    flying: false,
    boss: false,
  };
}

function emptyWaves(count: number): WaveDefinition[] {
  const waves: WaveDefinition[] = [];
  for (let i = 0; i < count; i++) {
    waves.push({
      id: `empty-${i + 1}`,
      wave: i + 1,
      name: `Empty ${i + 1}`,
      enemyId: 'frenzied-pig',
      count: 0,
      spawnInterval: 1,
      skills: [],
    });
  }
  return waves;
}

function placeAndKeepDraft(game = createGame(gameConfig)) {
  dispatchGameAction(game, { type: 'placePendingGem', x: 2, y: 4 });
  dispatchGameAction(game, { type: 'placePendingGem', x: 2, y: 5 });
  dispatchGameAction(game, { type: 'placePendingGem', x: 3, y: 4 });
  dispatchGameAction(game, { type: 'placePendingGem', x: 3, y: 5 });
  dispatchGameAction(game, { type: 'placePendingGem', x: 5, y: 4 });
  dispatchGameAction(game, { type: 'keepDraftCandidate', x: 2, y: 4 });
  return game;
}

function runOneTowerTargetMode(mode: TargetMode, enemies: EnemyState[], manualTargetId?: number) {
  const game = createGame(gameConfig);
  game.pendingGemId = null;
  game.draftQueue.length = 0;
  game.draft = [];
  game.status = 'running';
  game.phase = 'attack';
  const attacker = tower(1, 5, 5, 'topaz', 1);
  attacker.range = 20;
  attacker.damage = 0;
  attacker.projectileSpeed = 0;
  attacker.targetMode = mode;
  attacker.targetId = manualTargetId ?? null;
  game.towers.push(attacker);
  game.enemies.push(...enemies);

  tickGame(game, 0.01);

  return game.projectiles.find((projectile) => projectile.active)?.targetId ?? null;
}

function setProgress(target: EnemyState, pathIndex: number): EnemyState {
  target.path = [
    { x: 0, y: 5 },
    { x: 1, y: 5 },
    { x: 2, y: 5 },
    { x: 3, y: 5 },
    { x: 4, y: 5 },
    { x: 5, y: 5 },
    { x: 6, y: 5 },
  ];
  target.pathIndex = pathIndex;
  return target;
}

describe('game engine', () => {
  it('does not merge gems before at least one wave is completed', () => {
    const game = placeAndKeepDraft();
    const gem = game.towers[0];
    const tierBefore = gem.tier;
    dispatchGameAction(game, { type: 'selectTile', x: gem.x, y: gem.y });
    expect(createSnapshot(game).canMerge).toBe(false);
    dispatchGameAction(game, { type: 'mergeAt', x: gem.x, y: gem.y, levels: 1 });
    expect(game.towers[0].tier).toBe(tierBefore);
  });

  it('removes a maze stone and refunds no gold', () => {
    const game = placeAndKeepDraft();
    const initialGold = game.gold;
    const stone = game.stones[0];
    dispatchGameAction(game, { type: 'selectTile', x: stone.x, y: stone.y });
    expect(createSnapshot(game).canRemoveStone).toBe(true);
    dispatchGameAction(game, { type: 'removeStone', x: stone.x, y: stone.y });
    expect(game.stones).toHaveLength(3);
    expect(game.gold).toBe(initialGold);
  });

  it('starts a build draft, keeps one gem, and hardens the rest into stones', () => {
    const game = createGame(gameConfig);
    expect(game.phase).toBe('build');
    expect(game.pendingGemId).toBeTruthy();
    placeAndKeepDraft(game);
    expect(game.towers).toHaveLength(1);
    expect(game.stones).toHaveLength(4);
    expect(game.draft).toHaveLength(0);
    expect(game.phase).toBe('attack');
    expect(game.currentPath.length).toBeGreaterThan(0);
  });

  it('spawns enemies and advances an attack wave through checkpoint paths', () => {
    const game = placeAndKeepDraft();
    expect(game.checkpointPaths.length).toBeGreaterThanOrEqual(5);
    dispatchGameAction(game, { type: 'startWave' });
    tickGame(game, 0.2);
    expect(game.enemies.length).toBeGreaterThan(0);
    expect(createSnapshot(game).status).toBe('running');
  });

  it('starts the next build draft automatically after a completed wave', () => {
    const game = placeAndKeepDraft(
      createGame({
        ...gameConfig,
        waves: [
          {
            id: 'empty-1',
            wave: 1,
            name: 'Empty One',
            enemyId: 'frenzied-pig',
            count: 0,
            spawnInterval: 1,
            skills: [],
          },
          {
            id: 'empty-2',
            wave: 2,
            name: 'Empty Two',
            enemyId: 'frenzied-pig',
            count: 0,
            spawnInterval: 1,
            skills: [],
          },
        ],
      }),
    );
    dispatchGameAction(game, { type: 'startWave' });
    tickGame(game, 0.2);
    expect(game.waveIndex).toBe(1);
    expect(game.status).toBe('ready');
    expect(game.phase).toBe('build');
    expect(game.pendingGemId).toBeTruthy();
  });

  it('combines three matching adjacent gems into the next tier', () => {
    const game = createGame(gameConfig);
    game.towers.push(tower(1, 2, 4), tower(2, 2, 5), tower(3, 3, 4));
    dispatchGameAction(game, { type: 'combineAt', x: 2, y: 4 });
    expect(game.towers).toHaveLength(1);
    expect(game.towers[0].gemId).toBe('ruby-2');
  });

  it('combines recipe ingredients globally and outputs on the selected ingredient', () => {
    const game = createGame(gameConfig);
    game.towers.push(
      tower(1, 2, 4, 'sapphire', 1),
      tower(2, 12, 8, 'diamond', 1),
      tower(3, 15, 3, 'topaz', 1),
    );

    dispatchGameAction(game, { type: 'combineAt', x: 12, y: 8 });

    expect(game.towers).toHaveLength(1);
    expect(game.towers[0].gemId).toBe('silver');
    expect(game.towers[0].x).toBe(12);
    expect(game.towers[0].y).toBe(8);
  });

  it('supports build actions and player skills', () => {
    const game = createGame(gameConfig);
    game.gold = 2000;
    game.waveIndex = 1;
    game.pendingGemId = null;
    game.draft = [];
    game.towers.push(tower(10, 4, 4, 'diamond', 3));
    dispatchGameAction(game, { type: 'buySkill', skillId: 'attackSpeed' });
    expect(game.skillInventory.get('attackSpeed')).toBe(1);
    dispatchGameAction(game, { type: 'activateSkill', skillId: 'attackSpeed', x: 4, y: 4 });
    expect(game.towers[0].buffUntil).toBeGreaterThan(0);
    dispatchGameAction(game, { type: 'mergeAt', x: 4, y: 4, levels: 2 });
    expect(game.towers[0].gemId).toBe('diamond-5');
    dispatchGameAction(game, { type: 'downgradeAt', x: 4, y: 4 });
    expect(game.gold).toBeLessThan(2000);
  });

  it('charges gold for merges and blocks unaffordable or max-level merges', () => {
    const game = createGame(gameConfig);
    game.gold = 450;
    game.waveIndex = 1;
    game.pendingGemId = null;
    game.draft = [];
    game.towers.push(tower(10, 4, 4, 'diamond', 3));

    dispatchGameAction(game, { type: 'mergeAt', x: 4, y: 4, levels: 1 });
    expect(game.towers[0].gemId).toBe('diamond-4');
    expect(game.gold).toBe(250);

    dispatchGameAction(game, { type: 'mergeAt', x: 4, y: 4, levels: 2 });
    expect(game.towers[0].gemId).toBe('diamond-4');
    expect(game.gold).toBe(250);

    game.gold = 1000;
    game.towers[0].tier = 6;
    game.towers[0].gemId = 'diamond-6';
    dispatchGameAction(game, { type: 'mergeAt', x: 4, y: 4, levels: 1 });
    expect(game.towers[0].gemId).toBe('diamond-6');
    expect(game.gold).toBe(1000);
  });

  it('continues into repeat mode after the required 50 waves', () => {
    const game = placeAndKeepDraft(createGame({ ...gameConfig, waves: emptyWaves(50) }));
    game.waveIndex = 49;
    dispatchGameAction(game, { type: 'startWave' });
    tickGame(game, 0.2);
    const snapshot = createSnapshot(game);
    expect(game.waveIndex).toBe(50);
    expect(game.status).toBe('won');
    expect(game.phase).toBe('build');
    expect(game.stats.completedRequiredWaves).toBe(true);
    expect(snapshot.wave).toBe(51);
    expect(snapshot.currentWave?.wave).toBe(1);
    expect(snapshot.currentWaveSkills).toContain('rush');

    game.pendingGemId = null;
    game.draft.length = 0;
    game.draftQueue.length = 0;
    game.phase = 'attack';
    expect(createSnapshot(game).canStartWave).toBe(true);
    dispatchGameAction(game, { type: 'startWave' });
    expect(game.status).toBe('running');
  });

  it('uses per-tower automatic targeting modes and manual focus override', () => {
    const first = setProgress(enemy(1, 8, 5), 4);
    const last = setProgress(enemy(2, 4, 5), 1);
    const strong = enemy(3, 10, 5);
    strong.hp = 900;
    const weak = enemy(4, 9, 5);
    weak.hp = 100;
    const flying = enemy(5, 11, 5);
    flying.flying = true;
    const boss = enemy(6, 12, 5);
    boss.boss = true;

    expect(runOneTowerTargetMode('first', [last, first])).toBe(1);
    expect(runOneTowerTargetMode('last', [last, first])).toBe(2);
    expect(runOneTowerTargetMode('strongest', [weak, strong])).toBe(3);
    expect(runOneTowerTargetMode('weakest', [weak, strong])).toBe(4);
    expect(runOneTowerTargetMode('closest', [enemy(7, 14, 5), enemy(8, 6, 5)])).toBe(8);
    expect(runOneTowerTargetMode('flyingOnly', [enemy(9, 6, 5), flying])).toBe(5);
    expect(runOneTowerTargetMode('bossOnly', [enemy(10, 6, 5), boss])).toBe(6);
    expect(runOneTowerTargetMode('strongest', [weak, strong], 4)).toBe(4);
  });

  it('requires detection for invisible enemies and lets overlook reveal them for other towers', () => {
    const hidden = enemy(1, 6, 5);
    hidden.invisible = true;

    expect(runOneTowerTargetMode('first', [hidden])).toBe(null);

    const game = createGame(gameConfig);
    game.pendingGemId = null;
    game.draftQueue.length = 0;
    game.draft = [];
    game.status = 'running';
    game.phase = 'attack';
    const detector = tower(1, 5, 5, 'emerald', 2);
    detector.range = 20;
    detector.damage = 0;
    detector.projectileSpeed = 100;
    detector.effects = [{ type: 'overlook', value: 1, duration: 4 }];
    const helper = tower(2, 5, 6, 'ruby', 1);
    helper.range = 20;
    helper.damage = 0;
    helper.projectileSpeed = 0;
    helper.cooldownLeft = 0.2;
    const target = enemy(1, 6, 5);
    target.invisible = true;
    game.towers.push(detector, helper);
    game.enemies.push(target);

    tickGame(game, 0.1);
    expect(game.enemies[0].revealedUntil).toBeGreaterThan(game.time);

    tickGame(game, 0.2);
    expect(game.projectiles.some((projectile) => projectile.towerId === helper.id)).toBe(true);
  });

  it('applies normal and boss leak damage after guard reduction', () => {
    const game = createGame(gameConfig);
    game.status = 'running';
    game.phase = 'attack';
    game.pendingGemId = null;
    game.draft = [];
    const normal = enemy(1, 0, 0);
    normal.path = [{ x: 0, y: 0 }];
    normal.checkpointIndex = game.checkpointPaths.length;
    const boss = enemy(2, 0, 0);
    boss.path = [{ x: 0, y: 0 }];
    boss.checkpointIndex = game.checkpointPaths.length;
    boss.boss = true;
    game.enemies.push(normal, boss);
    game.skillInventory.set('guard', 2);
    game.activeSkills.guardUntil = 10;

    tickGame(game, 0.1);

    expect(game.lives).toBe(game.config.economy.startingLives - 3);
    expect(game.stats.leaks).toBe(2);
  });

  it('lets evade cancel castle leak damage when it triggers', () => {
    const game = createGame(gameConfig);
    game.status = 'running';
    game.phase = 'attack';
    game.rngSeed = 0;
    game.pendingGemId = null;
    game.draft = [];
    const normal = enemy(1, 0, 0);
    normal.path = [{ x: 0, y: 0 }];
    normal.checkpointIndex = game.checkpointPaths.length;
    game.enemies.push(normal);
    game.skillInventory.set('evade', 4);
    game.activeSkills.evadeUntil = 10;

    tickGame(game, 0.1);

    expect(game.lives).toBe(game.config.economy.startingLives);
    expect(game.stats.leaks).toBe(1);
  });

  it('moves flying enemies directly to the castle while ground enemies use checkpoints', () => {
    const game = placeAndKeepDraft(
      createGame({
        ...gameConfig,
        waves: [
          {
            id: 'flying-test',
            wave: 1,
            name: 'Flying Test',
            enemyId: 'baby-panda',
            count: 1,
            spawnInterval: 1,
            skills: ['flying'],
          },
        ],
      }),
    );

    dispatchGameAction(game, { type: 'startWave' });
    tickGame(game, 0.1);

    expect(game.enemies[0].flying).toBe(true);
    expect(game.enemies[0].path).toEqual([game.config.map.entrance, game.config.map.exit]);
    expect(game.checkpointPaths[0][game.checkpointPaths[0].length - 1]).toEqual(
      game.config.map.checkpoints[0],
    );
  });

  it('applies MVP caps, range, and nearby magic vulnerability', () => {
    const game = createGame(gameConfig);
    const attacker = tower(1, 5, 5, 'ruby', 1);
    attacker.damage = 100;
    attacker.range = 10;
    attacker.damageType = 'magic';
    attacker.projectileSpeed = 100;
    const mvp = tower(2, 6, 6, 'diamond', 1);
    mvp.mvpAwards = 10;
    mvp.stopped = true;
    const target = enemy(1, 5, 6);
    target.speed = 0;
    attacker.x = 3;
    attacker.y = 6;
    game.towers.push(attacker, mvp);
    game.enemies.push(target);
    game.status = 'running';
    game.phase = 'attack';

    tickGame(game, 0.1);

    expect(target.hp).toBe(890);
    expect(attacker.cooldownLeft).toBeCloseTo(1, 5);

    target.hp = 1000;
    attacker.cooldownLeft = 0;
    mvp.x = 9;
    tickGame(game, 0.1);

    expect(target.hp).toBe(900);

    target.hp = 1000;
    attacker.cooldownLeft = 0;
    attacker.damageType = 'physical';
    mvp.x = 5;
    tickGame(game, 0.1);

    expect(target.hp).toBe(825);
  });

  it('stacks different Opal speed aura levels but not identical levels', () => {
    const game = createGame(gameConfig);
    const attacker = tower(1, 5, 5, 'ruby', 1);
    attacker.range = 10;
    const opalOneA = tower(2, 6, 5, 'opal', 1);
    opalOneA.effects = [{ type: 'speedAura', value: 0.2, radius: 5 }];
    opalOneA.stopped = true;
    const opalOneB = tower(3, 5, 6, 'opal', 1);
    opalOneB.effects = [{ type: 'speedAura', value: 0.2, radius: 5 }];
    opalOneB.stopped = true;
    const opalTwo = tower(4, 6, 6, 'opal', 2);
    opalTwo.effects = [{ type: 'speedAura', value: 0.3, radius: 5 }];
    opalTwo.stopped = true;
    game.towers.push(attacker, opalOneA, opalOneB, opalTwo);
    game.enemies.push(enemy());
    game.status = 'running';
    game.phase = 'attack';

    tickGame(game, 0.1);

    expect(attacker.cooldownLeft).toBeCloseTo(1 / 1.5, 5);
  });

  it('does not stack identical Sapphire slow levels but combines different levels', () => {
    const game = createGame(gameConfig);
    const first = tower(1, 1, 0, 'sapphire', 1);
    first.damage = 0;
    first.range = 10;
    first.projectileSpeed = 1000;
    first.effects = [{ type: 'slow', value: 0.12, duration: 5 }];
    const second = tower(2, 1, 1, 'sapphire', 1);
    second.damage = 0;
    second.range = 10;
    second.projectileSpeed = 1000;
    second.effects = [{ type: 'slow', value: 0.12, duration: 5 }];
    const third = tower(3, 1, 2, 'sapphire', 2);
    third.damage = 0;
    third.range = 10;
    third.projectileSpeed = 1000;
    third.effects = [{ type: 'slow', value: 0.18, duration: 5 }];
    const target = enemy(1, 0, 0);
    game.towers.push(first, second, third);
    game.enemies.push(target);
    game.status = 'running';
    game.phase = 'attack';

    tickGame(game, 0.01);
    first.stopped = true;
    second.stopped = true;
    third.stopped = true;
    tickGame(game, 1);

    expect(target.x).toBeCloseTo(0.01 + 0.88 * 0.82, 2);
  });

  it('creates one-build-phase towers only from a completed all-draft recipe', () => {
    const game = createGame(gameConfig);
    game.pendingGemId = null;
    game.draftQueue.length = 0;
    game.phase = 'build';
    game.draft = [
      { id: 1, gemId: 'sapphire-1', x: 2, y: 4 },
      { id: 2, gemId: 'diamond-1', x: 12, y: 8 },
      { id: 3, gemId: 'topaz-1', x: 15, y: 3 },
      { id: 4, gemId: 'ruby-1', x: 4, y: 4 },
      { id: 5, gemId: 'opal-1', x: 4, y: 5 },
    ];

    dispatchGameAction(game, { type: 'combineAt', x: 2, y: 4 });

    expect(game.towers).toHaveLength(1);
    expect(game.towers[0].gemId).toBe('silver');
    expect(game.towers[0].x).toBe(2);
    expect(game.towers[0].y).toBe(4);
    expect(game.stones).toHaveLength(2);
    expect(game.draft).toHaveLength(0);
    expect(game.phase).toBe('attack');
  });

  it('blocks mixed draft and settled tower recipes during one-build-phase creation', () => {
    const game = createGame(gameConfig);
    game.pendingGemId = null;
    game.draftQueue.length = 0;
    game.phase = 'build';
    game.towers.push(tower(1, 2, 4, 'sapphire', 1));
    game.draft = [
      { id: 1, gemId: 'diamond-1', x: 3, y: 4 },
      { id: 2, gemId: 'topaz-1', x: 2, y: 5 },
      { id: 3, gemId: 'ruby-1', x: 4, y: 4 },
      { id: 4, gemId: 'opal-1', x: 4, y: 5 },
      { id: 5, gemId: 'emerald-1', x: 5, y: 5 },
    ];

    dispatchGameAction(game, { type: 'combineAt', x: 2, y: 4 });

    expect(game.towers).toHaveLength(1);
    expect(game.towers[0].gemId).toBe('sapphire-1');
    expect(game.draft).toHaveLength(5);
    expect(game.stones).toHaveLength(0);
  });
});
