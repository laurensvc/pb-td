import { describe, expect, it } from 'vitest';
import { TOTAL_WAVES, areaTierKey, BOARD_HEIGHT, BOARD_WIDTH } from './content';
import { hexWorldCenter } from './hexGrid';
import { createDefaultSave } from './save';
import type { GameState, GemFamilyId, GemLevel } from './types';
import {
  canPlaceRawGemAt,
  canPlaceGemAt,
  canPlaceRockAt,
  createGame,
  createSnapshot,
  dispatchGameAction,
  isTierUnlocked,
  tickGame,
} from './engine';
import { canMergeGems, getGemCombatStats, mergedLevel } from './gems';

function runFor(seconds: number, step: (dt: number) => void): void {
  for (let elapsed = 0; elapsed < seconds; elapsed += 0.05) {
    step(0.05);
  }
}

function addBoardGem(
  game: GameState,
  q: number,
  r: number,
  family: GemFamilyId = 'kinetic',
  level: GemLevel = 1,
): void {
  const center = hexWorldCenter(q, r);
  game.gems.push({
    id: game.nextGemId++,
    family,
    level,
    x: center.x,
    y: center.y,
    cooldownLeft: 0,
    kills: 0,
    damageDone: 0,
    targeting: 'first',
  });
}

function skipBuildPhaseToReady(game: GameState): void {
  if (game.buildStep === 'rocks') placeFiveRawGems(game);
  if (game.buildStep === 'prospect' && game.rawGems[0]) {
    dispatchGameAction(game, { type: 'commitRawGem', rawGemId: game.rawGems[0].id });
  }
  if (game.buildStep !== 'ready') {
    game.buildStep = 'ready';
  }
}

function placeFiveRawGems(game: GameState): void {
  for (let r = 0; r < BOARD_HEIGHT && game.rawGems.length < 5; r++) {
    for (let q = 0; q < BOARD_WIDTH && game.rawGems.length < 5; q++) {
      const point = hexWorldCenter(q, r);
      if (canPlaceRawGemAt(game, point.x, point.y)) {
        dispatchGameAction(game, { type: 'placeRawGem', x: point.x, y: point.y });
      }
    }
  }
}

function startWaveWhenReady(game: GameState): void {
  if (game.status === 'idle' || game.status === 'betweenWaves') {
    if (game.buildStep !== 'ready') skipBuildPhaseToReady(game);
    dispatchGameAction(game, { type: 'startWave' });
  }
}

describe('gem td simulation', () => {
  it('has 24 waves per area tier', () => {
    const game = createGame();
    expect(game.waveIndex).toBe(0);
    const area = game.areaId;
    dispatchGameAction(game, { type: 'startArea', areaId: area, tierId: 'normal' });
    expect(TOTAL_WAVES).toBe(24);
  });

  it('reports 24 total waves in snapshot and preview', () => {
    const game = createGame();
    const snapshot = createSnapshot(game);
    expect(snapshot.totalWaves).toBe(24);
    expect(snapshot.wave).toBeLessThanOrEqual(24);
  });

  it('honors an injected run seed for deterministic offers', () => {
    const a = createGame(createDefaultSave(), { runSeed: 4242 });
    const b = createGame(createDefaultSave(), { runSeed: 4242 });
    expect(a.runSeed).toBe(4242);
    expect(a.offers).toEqual(b.offers);
  });

  it('moves enemies along the path and fails when enough enemies leak', () => {
    const game = createGame();
    for (let wave = 0; wave < 25 && game.status !== 'lost'; wave++) {
      startWaveWhenReady(game);
      runFor(30, (dt) => tickGame(game, dt));
    }
    expect(game.status).toBe('lost');
    expect(game.leakedEnemies).toBeGreaterThan(0);
    expect(game.lives).toBe(0);
  });

  it('keeps non-power save data after a failed attempt and retry', () => {
    const game = createGame();
    game.save.clearedAreaTiers.push('a1:normal');
    startWaveWhenReady(game);
    runFor(30, (dt) => tickGame(game, dt));
    for (let wave = 0; wave < 25 && game.status !== 'lost'; wave++) {
      startWaveWhenReady(game);
      runFor(30, (dt) => tickGame(game, dt));
    }
    expect(game.status).toBe('lost');
    dispatchGameAction(game, { type: 'retry' });

    expect(game.status).toBe('idle');
    expect(game.save.clearedAreaTiers).toEqual(['a1:normal']);
    expect(game.gold).toBeGreaterThan(0);
  });

  it('fires placed gems during a running wave', () => {
    const game = createGame();
    game.buildStep = 'ready';
    addBoardGem(game, 2, 5);
    dispatchGameAction(game, { type: 'startWave' });
    runFor(4, (dt) => tickGame(game, dt));

    expect(game.gems.length).toBeGreaterThan(0);
    const combat =
      game.projectiles.length + game.gems.reduce((total, gem) => total + gem.damageDone, 0);
    expect(combat).toBeGreaterThan(0);
  });

  it('places rocks for free during the rock build step', () => {
    const game = createGame();
    const startGold = game.gold;
    dispatchGameAction(game, { type: 'placeRock', ...hexWorldCenter(0, 0) });
    expect(game.rocks).toHaveLength(1);
    expect(game.gold).toBe(startGold);
    const probe = hexWorldCenter(2, 1);
    expect(canPlaceRockAt(game, probe.x, probe.y)).toBeTypeOf('boolean');
  });

  it('merges same family and level gems during build phase', () => {
    const game = createGame();
    game.buildStep = 'ready';
    addBoardGem(game, 2, 5, 'kinetic', 1);
    addBoardGem(game, 3, 5, 'kinetic', 1);
    const [a, b] = game.gems;
    expect(canMergeGems(a!, b!, game.greatUnlocked)).toBe(true);
    dispatchGameAction(game, { type: 'selectMergeSource', gemId: a!.id });
    dispatchGameAction(game, { type: 'mergeGems', targetGemId: b!.id });
    expect(game.gems).toHaveLength(1);
    expect(game.gems[0]!.level).toBe(mergedLevel(1));
    expect(game.mergeUndoStack).toHaveLength(1);
  });

  it('blocks starting a wave until build step is ready', () => {
    const game = createGame();
    expect(game.buildStep).toBe('rocks');
    dispatchGameAction(game, { type: 'startWave' });
    expect(game.status).toBe('idle');
    skipBuildPhaseToReady(game);
    dispatchGameAction(game, { type: 'startWave' });
    expect(game.status).toBe('running');
  });

  it('scales gem stats by level', () => {
    const save = createDefaultSave();
    const l1 = getGemCombatStats(save, 'kinetic', 1);
    const l5 = getGemCombatStats(save, 'kinetic', 5);
    expect(l5.damage).toBeGreaterThan(l1.damage);
    expect(l5.range).toBeGreaterThan(l1.range);
  });

  it('unlocks hard tier from cleared normal tier without account power currency', () => {
    const save = createDefaultSave();
    const game = createGame({
      ...save,
      clearedAreaTiers: [areaTierKey('a1', 'normal')],
    });

    expect(isTierUnlocked(game.save, 'a1', 'hard')).toBe(true);

    dispatchGameAction(game, { type: 'startArea', areaId: 'a1', tierId: 'hard' });
    expect(game.tierId).toBe('hard');
  });

  it('places rocks on rock parity cells and blocks invalid mazes', () => {
    const game = createGame();
    dispatchGameAction(game, { type: 'placeRock', ...hexWorldCenter(0, 0) });
    expect(game.rocks).toHaveLength(1);
    dispatchGameAction(game, { type: 'placeRock', ...hexWorldCenter(1, 0) });
    expect(game.rocks).toHaveLength(1);
    const offMaze = hexWorldCenter(27, 10);
    expect(canPlaceRockAt(game, offMaze.x, offMaze.y)).toBe(false);
  });

  it('rejects gem placement on occupied or wrong parity cells', () => {
    const game = createGame();
    game.inventory.push({ id: game.nextInventoryGemId++, family: 'kinetic', level: 1 });
    dispatchGameAction(game, { type: 'selectInventoryGem', gemId: game.inventory[0]!.id });
    const rockCell = hexWorldCenter(0, 0);
    expect(canPlaceGemAt(game, rockCell.x, rockCell.y)).toBe(false);
    dispatchGameAction(game, { type: 'placeGem', ...hexWorldCenter(2, 5) });
    const occupied = hexWorldCenter(2, 5);
    expect(canPlaceGemAt(game, occupied.x, occupied.y)).toBe(false);
  });

  it('exposes next wave preview during build phase', () => {
    const game = createGame();
    const snapshot = createSnapshot(game);
    expect(snapshot.nextWavePreview.length).toBeGreaterThan(0);
    expect(snapshot.buildStep).toBe('rocks');
  });

  it('exposes raw gem quality odds during build phase', () => {
    const game = createGame();
    const snapshot = createSnapshot(game);
    expect(snapshot.rawGemBuildLevel).toBe(1);
    expect(snapshot.rawGemQualityOdds.map((entry) => entry.chance)).toEqual([70, 25, 5, 0, 0]);
  });

  it('does not double-spawn split enemies on projectile kill', () => {
    const game = createGame();
    game.status = 'running';
    game.enemies.push({
      id: 1,
      definitionId: 'shifter',
      name: 'Phase Shifter',
      x: 2,
      y: 3,
      pathProgress: 0.5,
      checkpointIndex: 1,
      hp: 1,
      maxHp: 88,
      shield: 0,
      maxShield: 0,
      speed: 1,
      rewardGold: 1,
      color: '#fff',
      alive: true,
      leaked: false,
      flying: false,
      invisible: true,
      magicImmune: false,
      physicalImmune: false,
      revealedUntil: 0,
      poisonDps: 0,
      poisonUntil: 0,
      slowDebuffs: [],
      armorDebuffs: [],
      slowUntil: 0,
      slowFactor: 0,
      armorReduction: 0,
    });
    const before = game.nextEnemyId;
    game.projectiles.push({
      id: 1,
      gemId: 0,
      family: 'kinetic',
      targetId: 1,
      effectLevel: 1,
      x: 2,
      y: 3,
      damage: 99,
      speed: 10,
      color: '#fff',
      active: true,
    });
    tickGame(game, 0.05);
    const spawned = game.enemies.filter((e) => e.definitionId === 'scout').length;
    expect(spawned).toBe(2);
    expect(game.nextEnemyId).toBe(before + 2);
  });

  it('commits one raw gem and turns the other four into stone blocks', () => {
    const game = createGame();
    placeFiveRawGems(game);
    expect(game.rawGems).toHaveLength(5);
    expect(game.buildStep).toBe('prospect');
    const committed = game.rawGems[0]!;
    dispatchGameAction(game, { type: 'commitRawGem', rawGemId: committed.id });
    expect(game.rawGems).toHaveLength(0);
    expect(game.gems).toHaveLength(1);
    expect(game.gems[0]!.family).toBe(committed.family);
    expect(game.rocks).toHaveLength(4);
    expect(game.buildStep).toBe('ready');
  });

  it('consumes four identical connected gems for a two-level merge', () => {
    const game = createGame();
    game.buildStep = 'ready';
    addBoardGem(game, 2, 5, 'kinetic', 1);
    addBoardGem(game, 3, 5, 'kinetic', 1);
    addBoardGem(game, 3, 4, 'kinetic', 1);
    addBoardGem(game, 2, 4, 'kinetic', 1);
    const [source, target] = game.gems;

    dispatchGameAction(game, { type: 'selectMergeSource', gemId: source!.id });
    dispatchGameAction(game, { type: 'mergeGems', targetGemId: target!.id });

    expect(game.gems).toHaveLength(1);
    expect(game.gems[0]!.id).toBe(target!.id);
    expect(game.gems[0]!.level).toBe(3);
    expect(game.mergeUndoStack).toHaveLength(1);
  });

  it('removes a placed raw gem and reopens the placement phase from prospect', () => {
    const game = createGame();
    placeFiveRawGems(game);
    expect(game.buildStep).toBe('prospect');
    const removed = game.rawGems[0]!;
    dispatchGameAction(game, { type: 'removeRawGem', rawGemId: removed.id });
    expect(game.rawGems).toHaveLength(4);
    expect(game.buildStep).toBe('rocks');
  });

  it('reverts quest progress and great unlock when undoing a merge', () => {
    const game = createGame();
    game.buildStep = 'ready';
    game.quests = [
      {
        id: 'quest-merge',
        templateId: 'merge',
        label: 'Merge 2 gems',
        target: 2,
        progress: 1,
        completed: false,
        rewardGold: 15,
        unlockGreat: 'kinetic',
      },
    ];
    addBoardGem(game, 2, 5, 'kinetic', 1);
    addBoardGem(game, 3, 5, 'kinetic', 1);
    const [a, b] = game.gems;
    const goldBefore = game.gold;
    dispatchGameAction(game, { type: 'selectMergeSource', gemId: a!.id });
    dispatchGameAction(game, { type: 'mergeGems', targetGemId: b!.id });
    expect(game.mergeCount).toBe(1);
    expect(game.quests[0]!.completed).toBe(true);
    expect(game.greatUnlocked).toContain('kinetic');
    expect(game.gold).toBeGreaterThan(goldBefore);

    dispatchGameAction(game, { type: 'undoMerge' });
    expect(game.gems).toHaveLength(2);
    expect(game.mergeCount).toBe(0);
    expect(game.quests[0]!.completed).toBe(false);
    expect(game.quests[0]!.progress).toBe(1);
    expect(game.greatUnlocked).not.toContain('kinetic');
    expect(game.gold).toBe(goldBefore);
  });
});
