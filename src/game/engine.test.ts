import { describe, expect, it } from 'vitest';
import { gameConfig } from './config';
import { createGame, createSnapshot, dispatchGameAction, tickGame } from './engine';
import { buildOccupancy } from './pathfinding';
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
    upgradeLevels: { damage: 0, speed: 0, range: 0 },
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

function buyRuby(game = createGame(gameConfig), x = 2, y = 4) {
  const item = game.config.towerShop.find((shopItem) => shopItem.gemId === 'ruby-1');
  if (!item) throw new Error('Missing ruby shop item');
  dispatchGameAction(game, { type: 'selectShopTower', gemId: item.gemId });
  dispatchGameAction(game, { type: 'placeShopTower', x, y });
  return { game, item };
}

function runOneTowerTargetMode(mode: TargetMode, enemies: EnemyState[], manualTargetId?: number) {
  const game = createGame(gameConfig);
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
  it('starts in build mode with five banked maze blocks and no draft', () => {
    const game = createGame(gameConfig);
    const snapshot = createSnapshot(game);
    expect(game.phase).toBe('build');
    expect(game.bankedMazeBlocks).toBe(5);
    expect(game.pendingGemId).toBeNull();
    expect(game.draft).toHaveLength(0);
    expect(snapshot.canStartWave).toBe(true);
  });

  it('places free maze blocks, spends banked blocks, and rejects path-blocking placements', () => {
    const game = createGame(gameConfig);
    dispatchGameAction(game, { type: 'placeMazeBlock', x: 2, y: 4 });
    expect(game.stones).toContainEqual({ x: 2, y: 4 });
    expect(game.bankedMazeBlocks).toBe(4);

    game.bankedMazeBlocks = 1;
    for (let y = 0; y < game.config.map.height; y++) {
      if (y !== 8) game.stones.push({ x: 12, y });
    }
    game.occupied = buildOccupancy(game.config.map, game.towers, game.stones);
    dispatchGameAction(game, { type: 'placeMazeBlock', x: 12, y: 8 });
    expect(game.bankedMazeBlocks).toBe(1);
  });

  it('banks five free blocks after each completed wave up to the configured cap', () => {
    const game = createGame({ ...gameConfig, waves: emptyWaves(4) });
    game.bankedMazeBlocks = 14;
    dispatchGameAction(game, { type: 'startWave' });
    tickGame(game, 0.2);
    expect(game.waveIndex).toBe(1);
    expect(game.status).toBe('ready');
    expect(game.phase).toBe('build');
    expect(game.bankedMazeBlocks).toBe(15);
  });

  it('buys a shop tower on empty space and charges family-based cost', () => {
    const game = createGame(gameConfig);
    const startingGold = game.gold;
    const { item } = buyRuby(game, 3, 4);
    expect(game.towers).toHaveLength(1);
    expect(game.towers[0].gemId).toBe('ruby-1');
    expect(game.gold).toBe(startingGold - item.cost);
  });

  it('replaces a maze block when placing a shop tower on it', () => {
    const game = createGame(gameConfig);
    dispatchGameAction(game, { type: 'placeMazeBlock', x: 4, y: 4 });
    expect(game.stones).toHaveLength(1);
    buyRuby(game, 4, 4);
    expect(game.towers).toHaveLength(1);
    expect(game.stones).toHaveLength(0);
  });

  it('rejects unaffordable shop placement and active-wave building', () => {
    const game = createGame(gameConfig);
    game.gold = 0;
    dispatchGameAction(game, { type: 'selectShopTower', gemId: 'diamond-1' });
    dispatchGameAction(game, { type: 'placeShopTower', x: 4, y: 4 });
    expect(game.towers).toHaveLength(0);

    game.gold = 1000;
    game.status = 'running';
    game.phase = 'attack';
    dispatchGameAction(game, { type: 'placeShopTower', x: 4, y: 4 });
    expect(game.towers).toHaveLength(0);
  });

  it('upgrades tower tier and separate stats with escalating costs', () => {
    const game = createGame(gameConfig);
    game.gold = 5000;
    buyRuby(game, 5, 5);
    const tower = game.towers[0];
    const baseCooldown = tower.cooldown;

    dispatchGameAction(game, { type: 'upgradeTowerTier', x: 5, y: 5 });
    expect(tower.gemId).toBe('ruby-2');
    expect(tower.tier).toBe(2);

    dispatchGameAction(game, { type: 'upgradeTowerStat', x: 5, y: 5, stat: 'damage' });
    dispatchGameAction(game, { type: 'upgradeTowerStat', x: 5, y: 5, stat: 'speed' });
    dispatchGameAction(game, { type: 'upgradeTowerStat', x: 5, y: 5, stat: 'range' });
    expect(tower.upgradeLevels).toEqual({ damage: 1, speed: 1, range: 1 });
    expect(tower.damage).toBeGreaterThan(8);
    expect(tower.cooldown).toBeLessThan(baseCooldown);
    expect(tower.range).toBeGreaterThan(5);
  });

  it('enforces max stat upgrade levels', () => {
    const game = createGame(gameConfig);
    game.gold = 100000;
    buyRuby(game, 5, 5);
    for (let i = 0; i < 8; i++) {
      dispatchGameAction(game, { type: 'upgradeTowerStat', x: 5, y: 5, stat: 'damage' });
    }
    expect(game.towers[0].upgradeLevels.damage).toBe(game.config.towerUpgradeCosts.maxStatLevel);
    dispatchGameAction(game, { type: 'selectTile', x: 5, y: 5 });
    expect(createSnapshot(game).selectedTowerUpgradeCosts?.damage).toBeNull();
  });

  it('spawns enemies and advances an attack wave through checkpoint paths', () => {
    const { game } = buyRuby();
    expect(game.checkpointPaths.length).toBeGreaterThanOrEqual(5);
    dispatchGameAction(game, { type: 'startWave' });
    tickGame(game, 0.2);
    expect(game.enemies.length).toBeGreaterThan(0);
    expect(createSnapshot(game).status).toBe('running');
  });

  it('continues into repeat mode after the required 50 waves', () => {
    const { game } = buyRuby(createGame({ ...gameConfig, waves: emptyWaves(50) }));
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

  it('moves flying enemies directly to the castle while ground enemies use checkpoints', () => {
    const { game } = buyRuby(
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
});
