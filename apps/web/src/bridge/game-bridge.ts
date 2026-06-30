import type { GameContent } from '@facet/content'
import type {
  GameCommand,
  GameEvent,
  GameSnapshot,
  SnapshotSelectionAction,
  WorldInputCommand,
} from '@facet/protocol'
import {
  FIRST_LETHAL_LEAK_LEVEL,
  RoundController,
  SIM_HZ,
  canPlaceFootprint,
  gemChanceUpgradeCost,
  snapFootprint,
  type CombatEvent,
  type SelectionAction,
} from '@facet/sim'

type Listener<T> = (value: T) => void

function selectionActionLabel(action: SelectionAction): string {
  switch (action.kind) {
    case 'keep':
      return 'Keep'
    case 'downgrade':
      return `Downgrade → ${action.resultGemId}`
    case 'duplicate-combine':
      return `Combine ×${action.count} → ${action.resultGemId}`
    case 'one-hit-special':
      return `Recipe: ${action.recipeId}`
    default:
      return 'Unknown'
  }
}

function toProtocolSelectionAction(action: SelectionAction): SnapshotSelectionAction {
  const label = selectionActionLabel(action)
  switch (action.kind) {
    case 'keep':
      return { kind: 'keep', candidateId: action.candidateId, label }
    case 'downgrade':
      return {
        kind: 'downgrade',
        candidateId: action.candidateId,
        resultGemId: action.resultGemId,
        label,
      }
    case 'duplicate-combine':
      return {
        kind: 'duplicate-combine',
        candidateId: action.candidateId,
        count: action.count,
        resultGemId: action.resultGemId,
        consumedCandidateIds: action.consumedCandidateIds,
        label,
      }
    case 'one-hit-special':
      return {
        kind: 'one-hit-special',
        candidateId: action.candidateId,
        recipeId: action.recipeId,
        outputTowerId: action.outputTowerId,
        consumedCandidateIds: action.consumedCandidateIds,
        label,
      }
  }
}

function mapCombatEvent(event: CombatEvent): GameEvent | null {
  switch (event.type) {
    case 'creep_spawned':
      return {
        type: 'creep.spawned',
        creepId: event.creepId,
        enemyId: event.enemyId,
        waveNumber: event.waveNumber,
      }
    case 'creep_killed':
      return {
        type: 'creep.killed',
        creepId: event.creepId,
        killerTowerId: event.killerTowerId,
        gold: event.gold,
      }
    case 'creep_leaked':
      return {
        type: 'creep.leaked',
        creepId: event.creepId,
        waveNumber: event.waveNumber,
        lifeCost: event.lifeCost,
      }
    case 'attack_missed':
      return {
        type: 'attack.missed',
        creepId: event.creepId,
        towerId: event.towerId,
      }
    case 'tower_fired':
      return {
        type: 'tower.fired',
        towerId: event.towerId,
        creepId: event.creepId,
        damage: event.damage,
      }
    case 'wave_spawn_complete':
      return { type: 'wave.spawnComplete', waveNumber: event.waveNumber }
    case 'wave_cleared':
      return { type: 'wave.cleared', waveNumber: event.waveNumber }
    case 'mvp_awarded':
      return { type: 'mvp.awarded', towerId: event.towerId, stacks: event.stacks }
    default:
      return null
  }
}

export interface GameBridgeConfig {
  seed?: number
  routeId?: string
}

export class GameBridge {
  readonly content: GameContent
  readonly controller: RoundController

  private snapshotListeners = new Set<Listener<GameSnapshot>>()
  private eventListeners = new Set<Listener<GameEvent>>()
  private snapshotVersion = 0
  private lastPhase: GameSnapshot['phase'] = 'countdown'
  private paused = false
  private rafId = 0
  private accumulator = 0
  private lastFrameMs = 0
  private hoverGx = 0
  private hoverGy = 0
  private hoverValid = false
  private hoverReason: string | undefined
  private selectedTowerId: string | null = null
  private waveDamage = 0
  private waveElapsed = 0
  private previousDps = 0
  private destroyed = false
  private cameraFocusListeners = new Set<(landmarkId: string) => void>()

  constructor(content: GameContent, config: GameBridgeConfig = {}) {
    this.content = content
    this.controller = new RoundController(content, {
      seed: config.seed ?? 42,
      routeId: config.routeId,
    })
    this.emitSnapshot()
  }

  getSnapshot(): GameSnapshot {
    return this.buildSnapshot()
  }

  onSnapshot(listener: Listener<GameSnapshot>): () => void {
    this.snapshotListeners.add(listener)
    listener(this.buildSnapshot())
    return () => this.snapshotListeners.delete(listener)
  }

  onEvent(listener: Listener<GameEvent>): () => void {
    this.eventListeners.add(listener)
    return () => this.eventListeners.delete(listener)
  }

  /** Presentation-only: Phaser registers to handle camera jumps without sim involvement. */
  onCameraFocus(listener: (landmarkId: string) => void): () => void {
    this.cameraFocusListeners.add(listener)
    return () => this.cameraFocusListeners.delete(listener)
  }

  start(): void {
    if (this.rafId !== 0) return
    this.lastFrameMs = performance.now()
    const loop = (now: number) => {
      if (this.destroyed) return
      const frameDt = Math.min((now - this.lastFrameMs) / 1000, 0.1)
      this.lastFrameMs = now
      if (!this.paused) {
        this.accumulator += frameDt
        const step = 1 / SIM_HZ
        while (this.accumulator >= step) {
          this.stepSim(step)
          this.accumulator -= step
        }
      }
      this.rafId = requestAnimationFrame(loop)
    }
    this.rafId = requestAnimationFrame(loop)
  }

  stop(): void {
    if (this.rafId !== 0) {
      cancelAnimationFrame(this.rafId)
      this.rafId = 0
    }
  }

  destroy(): void {
    this.destroyed = true
    this.stop()
    this.snapshotListeners.clear()
    this.eventListeners.clear()
    this.cameraFocusListeners.clear()
  }

  dispatch(command: GameCommand | WorldInputCommand): void {
    if (this.destroyed) return

    switch (command.type) {
      case 'game.skipCountdown':
        this.controller.skipCountdown()
        break
      case 'game.pause':
        this.paused = command.paused
        break
      case 'build.placeGem': {
        const result = this.controller.placeCandidate(command.gx, command.gy)
        if (!result.ok) {
          this.emitRejected('build.placeGem', result.reason)
        }
        break
      }
      case 'build.keepGem':
        this.resolveSelection({ kind: 'keep', candidateId: command.candidateId })
        break
      case 'build.downgrade':
        this.resolveSelection({
          kind: 'downgrade',
          candidateId: command.candidateId,
          resultGemId: command.resultGemId,
          resultType: '',
          resultQuality: '',
        })
        break
      case 'build.combine':
        this.resolveSelection({
          kind: 'duplicate-combine',
          candidateId: command.candidateId,
          count: command.count,
          resultGemId: command.resultGemId,
          consumedCandidateIds: command.consumedCandidateIds,
        })
        break
      case 'recipe.combine':
        this.resolveSelection({
          kind: 'one-hit-special',
          candidateId: command.candidateId,
          recipeId: command.recipeId,
          outputTowerId: command.outputTowerId,
          consumedCandidateIds: command.consumedCandidateIds,
        })
        break
      case 'economy.upgradeGemChance': {
        const result = this.controller.upgradeGemChance()
        if (!result.ok) {
          this.emitRejected('economy.upgradeGemChance', result.reason)
        }
        break
      }
      case 'tower.setTargetingMode':
        this.controller.setTowerTargeting(command.towerId, command.mode)
        break
      case 'tower.setHoldFire':
        this.controller.setTowerHoldFire(command.towerId, command.held)
        break
      case 'pointer.hoverFootprint':
        this.updateHover(command.gx, command.gy)
        return
      case 'pointer.placeAtHoveredFootprint':
        if (this.hoverValid) {
          this.dispatch({ type: 'build.placeGem', gx: this.hoverGx, gy: this.hoverGy })
        }
        return
      case 'pointer.selectStructure':
        this.selectedTowerId = this.controller.towers.some((t) => t.id === command.structureId)
          ? command.structureId
          : null
        break
      case 'camera.focusLandmark':
        for (const listener of this.cameraFocusListeners) {
          listener(command.landmarkId)
        }
        return
      default:
        break
    }

    this.emitSnapshot()
  }

  private resolveSelection(action: SelectionAction): void {
    try {
      this.controller.resolveSelection(action)
      this.waveDamage = 0
      this.waveElapsed = 0
    } catch {
      this.emitRejected('selection', 'illegal_action')
    }
  }

  private updateHover(gx: number, gy: number): void {
    const snapped = snapFootprint(gx, gy)
    this.hoverGx = snapped.gx
    this.hoverGy = snapped.gy

    const phase = this.controller.phase
    if (phase !== 'placement') {
      this.hoverValid = false
      this.hoverReason = 'wrong_phase'
      this.emitSnapshot()
      return
    }

    const validation = canPlaceFootprint(
      this.content.board,
      this.controller.simBoard,
      snapped.gx,
      snapped.gy,
      this.controller.routeId,
    )
    const hasCharges = this.controller.placementCharges > 0
    this.hoverValid = validation && hasCharges
    this.hoverReason = !hasCharges ? 'no_charges' : validation ? undefined : 'invalid'

    this.emitEvent({
      type: 'placement.validityChanged',
      valid: this.hoverValid,
      reason: this.hoverReason,
    })
    this.emitSnapshot()
  }

  private stepSim(dt: number): void {
    const prevPhase = this.controller.phase
    const result = this.controller.tick(dt)
    this.waveElapsed += dt

    for (const event of result.events) {
      if (event.type === 'tower_fired') {
        this.waveDamage += event.damage
      }
      if (event.type === 'wave_cleared') {
        this.previousDps = this.waveElapsed > 0 ? this.waveDamage / this.waveElapsed : 0
        this.waveDamage = 0
        this.waveElapsed = 0
      }
      const mapped = mapCombatEvent(event)
      if (mapped) this.emitEvent(mapped)
    }

    if (this.controller.phase !== prevPhase) {
      this.emitEvent({ type: 'phase.changed', phase: this.controller.phase })
    }

    this.emitSnapshot()
  }

  private buildSnapshot(): GameSnapshot {
    const state = this.controller.state
    const combat = this.controller.lastCombatSnapshot
    const board = this.content.board
    const maxChanceLevel = this.content.gemProbability.levels.reduce(
      (max, entry) => Math.max(max, entry.level),
      1,
    )
    const upgradeCost = gemChanceUpgradeCost(state.chanceLevel)
    const currentDps = this.waveElapsed > 0 ? this.waveDamage / this.waveElapsed : 0
    const wave = this.content.waves.find((w) => w.waveNumber === state.level)

    return {
      version: this.snapshotVersion,
      tick: combat?.tick ?? 0,
      phase: state.phase,
      level: state.level,
      gold: state.gold,
      placementCharges: state.placementCharges,
      chanceLevel: state.chanceLevel,
      chanceUpgradeCost: upgradeCost,
      canUpgradeChance: state.chanceLevel < maxChanceLevel && state.gold >= upgradeCost,
      candidates: state.candidates.map((c) => ({ ...c })),
      towers: state.towers.map((t) => ({ ...t })),
      rocks: state.rocks.map((r) => ({ ...r })),
      creeps: (combat?.creeps ?? []).map((c) => ({ ...c })),
      selectionActions: this.controller.getSelectionActions().map(toProtocolSelectionAction),
      hover:
        state.phase === 'placement'
          ? {
              gx: this.hoverGx,
              gy: this.hoverGy,
              valid: this.hoverValid,
              reason: this.hoverReason,
            }
          : null,
      buildOverlayVisible: state.phase === 'placement',
      pathVersion: this.controller.pathCache?.version ?? 0,
      dps: {
        current: state.phase === 'combat' ? currentDps : 0,
        previous: state.phase === 'combat' ? this.previousDps : currentDps || this.previousDps,
      },
      leaksThisWave: combat?.leaksThisWave ?? state.leaksThisWave,
      leakPolicy: state.level >= FIRST_LETHAL_LEAK_LEVEL ? 'lethal' : 'tolerant',
      nextWave: wave
        ? {
            waveNumber: wave.waveNumber,
            displayName: wave.displayName,
            announcement: wave.announcement,
            isBoss: wave.isBoss,
            isFlying: wave.isFlying,
            threatLevel: wave.threatLevel,
            abilities: wave.abilities,
            enemySummary: wave.spawn.entries.map((e) => `${e.count}× ${e.enemyId}`).join(', '),
          }
        : null,
      selectedTowerId: this.selectedTowerId,
      mvpTowerId: combat?.mvpTowerId ?? null,
      board: {
        width: board.width,
        height: board.height,
        tileSize: board.tileSize,
        worldWidth: board.width * board.tileSize,
        worldHeight: board.height * board.tileSize,
        cameraBounds: board.camera.bounds,
        startFocusLandmarkId: board.camera.startFocus,
      },
    }
  }

  private emitSnapshot(): void {
    this.snapshotVersion += 1
    const snapshot = this.buildSnapshot()
    if (snapshot.phase !== this.lastPhase) {
      this.lastPhase = snapshot.phase
    }
    for (const listener of this.snapshotListeners) {
      listener(snapshot)
    }
  }

  private emitEvent(event: GameEvent): void {
    for (const listener of this.eventListeners) {
      listener(event)
    }
  }

  private emitRejected(commandType: string, reason: string): void {
    this.emitEvent({ type: 'command.rejected', commandType, reason })
  }
}
