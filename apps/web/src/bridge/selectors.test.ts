import type { GameSnapshot } from '@facet/protocol'
import { describe, expect, it } from 'vitest'
import {
  selectBoardPresentationState,
  selectBuildControlsState,
  selectHudState,
  selectMinimapState,
  selectRecipeDictionaryState,
  selectWavePreviewState,
} from './selectors.js'
import { jsonEqual, retainIfEqual, shallowEqual } from './snapshot-diff.js'

function snapshot(overrides: Partial<GameSnapshot> = {}): GameSnapshot {
  return {
    version: 1,
    tick: 0,
    phase: 'placement',
    level: 1,
    gold: 10,
    placementCharges: 5,
    chanceLevel: 1,
    chanceUpgradeCost: 10,
    canUpgradeChance: true,
    candidates: [],
    towers: [],
    rocks: [],
    creeps: [],
    selectionActions: [],
    hover: null,
    buildOverlayVisible: true,
    pathVersion: 0,
    dps: { current: 0, previous: 0 },
    leaksThisWave: 0,
    leakPolicy: 'tolerant',
    nextWave: {
      waveNumber: 1,
      displayName: 'Wave 1',
      announcement: 'Test',
      isBoss: false,
      isFlying: false,
      threatLevel: 1,
      abilities: [],
      enemySummary: '1× grunt',
    },
    selectedTowerId: null,
    mvpTowerId: null,
    board: {
      width: 136,
      height: 136,
      tileSize: 32,
      worldWidth: 4352,
      worldHeight: 4352,
      cameraBounds: [0, 0, 4352, 4352],
      startFocusLandmarkId: 'spawn',
    },
    ...overrides,
  }
}

describe('selectors', () => {
  it('selectHudState formats DPS and leaks', () => {
    const hud = selectHudState(
      snapshot({ phase: 'combat', dps: { current: 12.34, previous: 0 }, leaksThisWave: 0 }),
    )
    expect(hud.dpsLabel).toBe('12.3')
    expect(hud.leaksLabel).toBe('0 leaks')
  })

  it('selectBuildControlsState exposes selected tower targeting', () => {
    const state = selectBuildControlsState(
      snapshot({
        selectedTowerId: 't1',
        towers: [
          {
            id: 't1',
            gemId: 'ruby-chipped',
            gx: 0,
            gy: 0,
            active: true,
            killCount: 0,
            targetingMode: 'highest_hp',
            holdFire: true,
            mvpStacks: 0,
          },
        ],
      }),
    )
    expect(state.selectedTower?.targetingMode).toBe('highest_hp')
    expect(state.selectedTower?.holdFire).toBe(true)
  })

  it('selectWavePreviewState hides during combat', () => {
    expect(selectWavePreviewState(snapshot({ phase: 'combat' })).visible).toBe(false)
    expect(selectWavePreviewState(snapshot({ phase: 'placement' })).visible).toBe(true)
  })

  it('selectRecipeDictionaryState returns sorted owned gem ids', () => {
    const state = selectRecipeDictionaryState(
      snapshot({
        candidates: [
          { id: 'c1', gemId: 'topaz-chipped', type: 'topaz', quality: 'chipped', gx: 0, gy: 0 },
        ],
        towers: [
          {
            id: 't1',
            gemId: 'ruby-chipped',
            gx: 4,
            gy: 0,
            active: true,
            killCount: 0,
            targetingMode: 'closest_to_goal',
            holdFire: false,
            mvpStacks: 0,
          },
        ],
      }),
    )
    expect(state.ownedGemIds).toEqual(['ruby-chipped', 'topaz-chipped'])
  })

  it('selectBoardPresentationState projects render fields', () => {
    const board = selectBoardPresentationState(snapshot({ pathVersion: 3 }))
    expect(board.pathVersion).toBe(3)
    expect(board.board.tileSize).toBe(32)
  })

  it('selectMinimapState maps landmarks towers and creeps', () => {
    const state = selectMinimapState(
      snapshot({
        towers: [
          {
            id: 't1',
            gemId: 'ruby-chipped',
            gx: 24,
            gy: 24,
            active: true,
            killCount: 0,
            targetingMode: 'closest_to_goal',
            holdFire: false,
            mvpStacks: 0,
          },
        ],
        creeps: [
          {
            id: 'c1',
            enemyId: 'stone-grunt',
            hp: 50,
            maxHp: 100,
            pathProgress: 0,
            worldPos: { x: 100, y: 200 },
            mobility: 'ground',
          },
        ],
      }),
    )
    expect(state.landmarks.length).toBeGreaterThan(0)
    expect(state.towers).toHaveLength(1)
    expect(state.creeps[0]).toEqual({ x: 100, y: 200 })
  })
})

describe('snapshot diff', () => {
  it('retainIfEqual keeps prior reference when equal', () => {
    const a = { gold: 10, phase: 'placement' as const }
    const b = { gold: 10, phase: 'placement' as const }
    const kept = retainIfEqual(a, b, shallowEqual)
    expect(kept).toBe(a)
  })

  it('retainIfEqual returns next when different', () => {
    const a = { gold: 10 }
    const b = { gold: 11 }
    const kept = retainIfEqual(a, b, shallowEqual)
    expect(kept).toBe(b)
  })

  it('jsonEqual compares nested selection actions', () => {
    const actions = [{ kind: 'keep' as const, candidateId: 'c1', label: 'Keep' }]
    expect(jsonEqual(actions, [...actions])).toBe(true)
    expect(jsonEqual(actions, [{ kind: 'keep', candidateId: 'c2', label: 'Keep' }])).toBe(false)
  })

  it('retainIfEqual detects creep movement in board presentation', () => {
    const creep = (x: number) => ({
      id: 'c1',
      enemyId: 'stone-grunt',
      hp: 50,
      maxHp: 100,
      pathProgress: 0,
      worldPos: { x, y: 200 },
      mobility: 'ground' as const,
    })

    let boardPresentation: ReturnType<typeof selectBoardPresentationState> | null = null
    let skipped = 0

    for (let x = 100; x <= 110; x++) {
      const nextBoard = selectBoardPresentationState(
        snapshot({ phase: 'combat', creeps: [creep(x)] }),
      )
      const board = retainIfEqual(boardPresentation, nextBoard, jsonEqual)
      if (board === boardPresentation && boardPresentation !== null) skipped += 1
      boardPresentation = board
    }

    expect(skipped).toBe(0)
  })

  it('jsonEqual can miss creep movement when worldPos is mutated in place', () => {
    const sharedPos = { x: 100, y: 200 }
    const prev = selectBoardPresentationState(
      snapshot({
        phase: 'combat',
        creeps: [
          {
            id: 'c1',
            enemyId: 'stone-grunt',
            hp: 50,
            maxHp: 100,
            pathProgress: 0,
            worldPos: sharedPos,
            mobility: 'ground',
          },
        ],
      }),
    )

    sharedPos.x = 105

    const next = selectBoardPresentationState(
      snapshot({
        phase: 'combat',
        creeps: [
          {
            id: 'c1',
            enemyId: 'stone-grunt',
            hp: 50,
            maxHp: 100,
            pathProgress: 0,
            worldPos: { x: 105, y: 200 },
            mobility: 'ground',
          },
        ],
      }),
    )

    expect(jsonEqual(prev, next)).toBe(true)
  })
})
