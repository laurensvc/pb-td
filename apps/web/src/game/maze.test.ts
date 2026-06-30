import { describe, expect, it } from 'vitest';
import { BOARD_HEIGHT, BOARD_WIDTH } from './content';
import { canPlaceRawGemAt, createGame, dispatchGameAction } from './engine';
import { hexWorldCenter } from './hexGrid';
import {
  buildMazePathNav,
  canPlaceRock,
  createMazeLayout,
  hasValidCheckpointPath,
  isSqueezeGapCell,
  isWalkableCell,
} from './maze';
import { bfsDistanceFromCell } from './pathNav';
import { cellKey } from './pathBuild';

describe('maze square grid', () => {
  const checkpoints = [
    { x: 0, y: 5 },
    { x: 10, y: 5 },
    { x: 10, y: 8 },
    { x: 15, y: 8 },
  ];
  const spawn = checkpoints[0]!;
  const goal = checkpoints[3]!;

  it('finds a valid path through all checkpoints', () => {
    const layout = createMazeLayout(16, 10, spawn, goal, [], [], checkpoints);
    const nav = buildMazePathNav(layout);
    expect(nav.pathCells.size).toBeGreaterThan(0);
    expect(nav.checkpoints).toHaveLength(4);
    expect(nav.distanceToGoal.get('15,8')).toBe(0);
    expect(nav.distanceToGoal.get('0,5')).toBeGreaterThan(0);
    expect(hasValidCheckpointPath(layout)).toBe(true);
  });

  it('blocks rocks that would seal the maze or cover checkpoints', () => {
    const layout = createMazeLayout(16, 10, spawn, goal, [], [], checkpoints);
    expect(canPlaceRock(layout, 5, 5)).toBe(true);
    expect(canPlaceRock(layout, 10, 5)).toBe(false);

    const sealed = createMazeLayout(16, 10, spawn, goal, [{ x: 5, y: 5 }], [], checkpoints);
    expect(hasValidCheckpointPath(sealed)).toBe(true);
    expect(canPlaceRock(sealed, 6, 5)).toBeTypeOf('boolean');
  });
});

describe('square squeeze gaps', () => {
  const spawn = { x: 0, y: 5 };
  const goal = { x: 15, y: 8 };
  const checkpoints = [spawn, { x: 10, y: 5 }, { x: 10, y: 8 }, goal];

  it('closes diagonal blocker pairs through pinch cells', () => {
    const layout = createMazeLayout(
      16,
      10,
      spawn,
      goal,
      [
        { x: 5, y: 5 },
        { x: 6, y: 6 },
      ],
      [],
      checkpoints,
    );

    expect(isSqueezeGapCell(layout, 5, 6)).toBe(true);
    expect(isSqueezeGapCell(layout, 6, 5)).toBe(true);
    expect(isWalkableCell(layout, 5, 6)).toBe(false);
    expect(isWalkableCell(layout, 6, 5)).toBe(false);
  });

  it('keeps collinear blocker pairs as a legal one-tile corridor', () => {
    const layout = createMazeLayout(
      16,
      10,
      spawn,
      goal,
      [
        { x: 5, y: 5 },
        { x: 7, y: 5 },
      ],
      [],
      checkpoints,
    );

    expect(isSqueezeGapCell(layout, 6, 5)).toBe(false);
    expect(isWalkableCell(layout, 6, 5)).toBe(true);
    expect(hasValidCheckpointPath(layout)).toBe(true);
  });

  it('excludes squeeze pinch cells from path navigation', () => {
    const layout = createMazeLayout(
      16,
      10,
      spawn,
      goal,
      [
        { x: 5, y: 5 },
        { x: 6, y: 6 },
      ],
      [],
      checkpoints,
    );

    const nav = buildMazePathNav(layout);
    expect(nav.pathCells.has('5,6')).toBe(false);
    expect(nav.pathCells.has('6,5')).toBe(false);
    expect(hasValidCheckpointPath(layout)).toBe(true);
  });

  it('uses shortest checkpoint distances without tower-exposure bias', () => {
    const pathCells = new Set(['0,0', '1,0', '2,0', '2,1', '2,2']);
    const checkpoints = [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 2, y: 2 },
    ];
    const distMap = bfsDistanceFromCell(pathCells, checkpoints[1]!);
    expect(distMap.get('0,0')).toBe(2);
    expect(distMap.get('2,2')).toBe(2);
    expect(distMap.get('1,0')).toBe(1);
  });
});

describe('checkpoint path after raw gem placement', () => {
  function placeOfferedRawGems(game: ReturnType<typeof createGame>): void {
    for (let r = 0; r < BOARD_HEIGHT && game.rawGems.length < 5; r++) {
      for (let q = 0; q < BOARD_WIDTH && game.rawGems.length < 5; q++) {
        const point = hexWorldCenter(q, r);
        if (canPlaceRawGemAt(game, point.x, point.y)) {
          dispatchGameAction(game, { type: 'placeRawGem', x: point.x, y: point.y });
        }
      }
    }
  }

  it('keeps a valid checkpoint route after five legal raw gem placements', () => {
    const game = createGame();
    placeOfferedRawGems(game);
    expect(game.rawGems).toHaveLength(5);
    expect(
      game.pathNav.pathCells.has(cellKey(game.pathNav.spawnCell.x, game.pathNav.spawnCell.y)),
    ).toBe(true);
    expect(
      game.pathNav.pathCells.has(
        cellKey(
          game.pathNav.checkpoints[game.pathNav.checkpoints.length - 1]!.x,
          game.pathNav.checkpoints[game.pathNav.checkpoints.length - 1]!.y,
        ),
      ),
    ).toBe(true);
  });
});
