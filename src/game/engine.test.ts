import { describe, expect, it } from 'vitest';
import { gameConfig } from './config';
import { createGame, createSnapshot, dispatchGameAction, tickGame } from './engine';
import type { EnemyState, GemFamily, GemTier, TowerState, WaveDefinition } from './types';

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
    color: '#fca5a5',
    skills: [],
    invisible: false,
    flying: false,
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

describe('game engine', () => {
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

  it('supports build actions and local shell skills', () => {
    const game = createGame(gameConfig);
    game.shells = 20;
    game.gold = 2000;
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

  it('continues into repeat mode after the required 50 waves', () => {
    const game = placeAndKeepDraft(createGame({ ...gameConfig, waves: emptyWaves(50) }));
    game.waveIndex = 49;
    dispatchGameAction(game, { type: 'startWave' });
    tickGame(game, 0.2);
    const snapshot = createSnapshot(game);
    expect(game.waveIndex).toBe(50);
    expect(game.status).toBe('ready');
    expect(game.phase).toBe('build');
    expect(game.stats.completedRequiredWaves).toBe(true);
    expect(snapshot.wave).toBe(51);
    expect(snapshot.currentWave?.wave).toBe(1);
    expect(snapshot.currentWaveSkills).toContain('rush');
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
      { id: 2, gemId: 'diamond-1', x: 3, y: 4 },
      { id: 3, gemId: 'topaz-1', x: 2, y: 5 },
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
