import { describe, expect, it } from 'vitest';
import { gameConfig } from '../../game/config';
import { createGame } from '../../game/engine';
import type { EnemyState } from '../../game/types';
import { computeBoardLayout, pointToEnemyId, pointToTile } from './boardGeometry';

describe('Phaser board geometry', () => {
  it('scales the board to the available bounds while preserving map proportions', () => {
    const game = createGame(gameConfig);
    const layout = computeBoardLayout(game, { x: 16, y: 112, width: 900, height: 620 });

    expect(layout.cellSize).toBeGreaterThan(0);
    expect(layout.boardWidth).toBe(layout.cellSize * game.config.map.width);
    expect(layout.boardHeight).toBe(layout.cellSize * game.config.map.height);
    expect(layout.offsetX).toBeGreaterThanOrEqual(16);
    expect(layout.offsetY).toBeGreaterThanOrEqual(112);
  });

  it('maps pointer coordinates to tiles and rejects points outside the board', () => {
    const game = createGame(gameConfig);
    const layout = computeBoardLayout(game, { x: 0, y: 0, width: 640, height: 640 });
    const x = layout.offsetX + layout.cellSize * 4 + layout.cellSize / 2;
    const y = layout.offsetY + layout.cellSize * 7 + layout.cellSize / 2;

    expect(pointToTile(layout, game, x, y)).toEqual({ x: 4, y: 7 });
    expect(pointToTile(layout, game, layout.offsetX - 1, y)).toBeNull();
  });

  it('selects the topmost live enemy inside the hit radius', () => {
    const game = createGame(gameConfig);
    const layout = computeBoardLayout(game, { x: 0, y: 0, width: 640, height: 640 });
    const x = layout.offsetX + 5.5 * layout.cellSize;
    const y = layout.offsetY + 5.5 * layout.cellSize;

    expect(pointToEnemyId(layout, [enemy(1, 5, 5), enemy(2, 5, 5)], x, y)).toBe(2);
    expect(pointToEnemyId(layout, [enemy(3, 14, 5)], x, y)).toBeNull();
  });
});

function enemy(id: number, x: number, y: number): EnemyState {
  return {
    id,
    definitionId: 'frenzied-pig',
    name: 'Target',
    x,
    y,
    hp: 100,
    maxHp: 100,
    speed: 1,
    reward: 0,
    armor: 0,
    checkpointIndex: 0,
    path: [],
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
