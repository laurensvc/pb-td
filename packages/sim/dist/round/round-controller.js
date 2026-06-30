import { FIRST_LETHAL_LEAK_LEVEL, GEM_FOOTPRINT, MAX_GEM_CHANCE_LEVEL_V1, MAX_WAVE_LEVEL, PLACEMENT_CHARGES_PER_ROUND, SIM_HZ, STARTING_GOLD, gemChanceUpgradeCost, } from '../constants.js';
import { GemRoller } from '../build/gem-roller.js';
import { computeSelectionActions, resolveSelection, } from '../build/selection-resolver.js';
import { addStructure, createSimBoard, removeStructures } from '../board/sim-board.js';
import { validatePlacement } from '../placement/placement-validator.js';
import { ensurePathCache } from '../pathfinding/path-cache.js';
import { SeededRng } from '../rng/seeded-rng.js';
import { CombatSession } from '../combat/combat-session.js';
let entityCounter = 0;
function nextEntityId(prefix) {
    entityCounter += 1;
    return `${prefix}-${entityCounter}`;
}
export function resetEntityIdCounter() {
    entityCounter = 0;
}
function defaultTowerFields() {
    return {
        targetingMode: 'closest_to_goal',
        holdFire: false,
        mvpStacks: 0,
    };
}
export class RoundController {
    content;
    simBoard;
    rng;
    routeId;
    playerId;
    phase = 'countdown';
    level = 1;
    gold = STARTING_GOLD;
    placementCharges = 0;
    chanceLevel = 1;
    candidates = [];
    towers = [];
    rocks = [];
    pathCache = null;
    combatSession = null;
    lastCombatSnapshot = null;
    pendingEvents = [];
    gemRoller;
    constructor(content, config) {
        this.content = content;
        this.simBoard = createSimBoard(content.board);
        this.rng = new SeededRng(config.seed);
        this.routeId = config.routeId ?? content.board.defaultRouteId;
        this.playerId = config.playerId ?? 'player-1';
        this.gemRoller = new GemRoller(content, this.rng);
        for (const tower of this.towers) {
            this.syncStructure(tower.id, tower.gx, tower.gy, 'tower');
        }
        for (const rock of this.rocks) {
            this.syncStructure(rock.id, rock.gx, rock.gy, 'rock');
        }
        this.rebuildPath();
    }
    get state() {
        return {
            playerId: this.playerId,
            phase: this.phase,
            level: this.level,
            gold: this.gold,
            placementCharges: this.placementCharges,
            chanceLevel: this.chanceLevel,
            candidates: [...this.candidates],
            towers: this.towers.map((t) => ({ ...t })),
            rocks: this.rocks.map((r) => ({ ...r })),
            activeCreepCount: this.combatSession?.creeps.length ?? 0,
            leaksThisWave: this.lastCombatSnapshot?.leaksThisWave ?? 0,
        };
    }
    /** Fixed-step sim tick — movement always runs; tower combat only in combat phase. */
    tick(dt = 1 / SIM_HZ) {
        const events = [];
        if (this.combatSession) {
            const combatActive = this.phase === 'combat';
            const result = this.combatSession.tick(dt, combatActive);
            events.push(...result.events);
            this.lastCombatSnapshot = result.snapshot;
            for (const event of result.events) {
                if (event.type === 'creep_killed') {
                    this.gold += event.gold;
                }
            }
            if (combatActive && result.waveCleared) {
                this.completeWave();
            }
        }
        this.pendingEvents.push(...events);
        return { events, snapshot: this.lastCombatSnapshot };
    }
    drainEvents() {
        const drained = this.pendingEvents;
        this.pendingEvents = [];
        return drained;
    }
    setTowerTargeting(towerId, mode) {
        const tower = this.towers.find((t) => t.id === towerId);
        if (tower)
            tower.targetingMode = mode;
    }
    setTowerHoldFire(towerId, holdFire) {
        const tower = this.towers.find((t) => t.id === towerId);
        if (tower)
            tower.holdFire = holdFire;
    }
    upgradeGemChance() {
        if (this.phase !== 'placement' && this.phase !== 'selection') {
            return { ok: false, reason: 'wrong_phase' };
        }
        const maxLevel = this.content.gemProbability.levels.reduce((max, entry) => Math.max(max, entry.level), 1) ?? MAX_GEM_CHANCE_LEVEL_V1;
        if (this.chanceLevel >= maxLevel) {
            return { ok: false, reason: 'max_level' };
        }
        const cost = gemChanceUpgradeCost(this.chanceLevel);
        if (this.gold < cost) {
            return { ok: false, reason: 'insufficient_gold' };
        }
        this.gold -= cost;
        this.chanceLevel += 1;
        return { ok: true, newLevel: this.chanceLevel };
    }
    beginPlacementPhase() {
        if (this.phase !== 'countdown' && this.phase !== 'combat' && this.phase !== 'placement') {
            throw new Error(`Cannot begin placement from phase: ${this.phase}`);
        }
        this.phase = 'placement';
        this.placementCharges = PLACEMENT_CHARGES_PER_ROUND;
        this.candidates = [];
        this.setTowersActive(false);
    }
    skipCountdown() {
        if (this.phase === 'countdown') {
            this.beginPlacementPhase();
        }
    }
    placeCandidate(gx, gy) {
        const validation = validatePlacement(this.content.board, this.simBoard, gx, gy, {
            routeId: this.routeId,
            phase: 'placement',
            placementCharges: this.placementCharges,
        });
        if (!validation.ok) {
            return { ok: false, reason: validation.reason };
        }
        const roll = this.gemRoller.roll(this.chanceLevel);
        const candidate = {
            id: nextEntityId('candidate'),
            gemId: roll.gemId,
            type: roll.type,
            quality: roll.quality,
            gx,
            gy,
        };
        this.candidates.push(candidate);
        addStructure(this.simBoard, {
            id: candidate.id,
            gx,
            gy,
            kind: 'candidate',
            footprint: GEM_FOOTPRINT,
        });
        this.placementCharges -= 1;
        this.rebuildPath();
        if (this.placementCharges === 0) {
            this.phase = 'selection';
        }
        return { ok: true, candidate };
    }
    getSelectionActions() {
        if (this.phase !== 'selection')
            return [];
        return computeSelectionActions(this.content, this.candidates);
    }
    resolveSelection(action) {
        if (this.phase !== 'selection') {
            throw new Error('Selection only allowed in selection phase');
        }
        const resolution = resolveSelection(this.content, this.candidates, action, () => nextEntityId('entity'));
        const consumed = new Set(resolution.consumedCandidateIds);
        removeStructures(this.simBoard, consumed);
        this.candidates = this.candidates.filter((c) => !consumed.has(c.id));
        if (resolution.tower) {
            const tower = {
                id: resolution.tower.id,
                gemId: resolution.tower.gemId,
                specialId: resolution.tower.specialId,
                gx: resolution.tower.gx,
                gy: resolution.tower.gy,
                active: true,
                killCount: 0,
                ...defaultTowerFields(),
            };
            this.towers.push(tower);
            addStructure(this.simBoard, {
                id: tower.id,
                gx: tower.gx,
                gy: tower.gy,
                kind: tower.specialId ? 'special' : 'tower',
                footprint: GEM_FOOTPRINT,
            });
        }
        for (const rock of resolution.rocks) {
            this.rocks.push(rock);
            addStructure(this.simBoard, {
                id: rock.id,
                gx: rock.gx,
                gy: rock.gy,
                kind: 'rock',
                footprint: GEM_FOOTPRINT,
            });
        }
        this.rebuildPath();
        this.setTowersActive(true);
        this.phase = 'combat';
        this.startCombatSession();
    }
    completeWave() {
        if (this.phase !== 'combat') {
            throw new Error('completeWave only valid during combat');
        }
        const wave = this.content.waves.find((w) => w.waveNumber === this.level);
        const reward = wave?.rewardGold ?? 5 + this.level * 2;
        this.gold += reward;
        const retainCreeps = this.combatSession?.spawnerState.concurrent === true
            ? this.combatSession.creeps.filter((c) => c.waveNumber !== this.level)
            : [];
        if (this.level >= MAX_WAVE_LEVEL) {
            this.phase = 'finished';
            this.combatSession = null;
            return;
        }
        this.level += 1;
        if (retainCreeps.length > 0 && this.combatSession) {
            this.combatSession = new CombatSession({
                content: this.content,
                level: this.level,
                routeId: this.routeId,
                pathCache: this.pathCache,
                towers: this.towers,
                rng: this.rng,
                existingCreeps: retainCreeps,
                onLeak: () => this.registerLeak(),
            });
            this.phase = 'combat';
            this.setTowersActive(true);
            return;
        }
        this.combatSession = null;
        this.beginPlacementPhase();
    }
    registerLeak() {
        if (this.phase !== 'combat' && this.phase !== 'placement' && this.phase !== 'selection') {
            return;
        }
        if (this.level >= FIRST_LETHAL_LEAK_LEVEL) {
            this.phase = 'lost';
            this.combatSession = null;
        }
    }
    startCombatSession() {
        const existingCreeps = this.combatSession?.creeps ?? [];
        this.combatSession = new CombatSession({
            content: this.content,
            level: this.level,
            routeId: this.routeId,
            pathCache: this.pathCache,
            towers: this.towers,
            rng: this.rng,
            existingCreeps,
            onLeak: () => this.registerLeak(),
        });
    }
    setTowersActive(active) {
        for (const tower of this.towers) {
            tower.active = active;
        }
    }
    syncStructure(id, gx, gy, kind) {
        addStructure(this.simBoard, { id, gx, gy, kind, footprint: GEM_FOOTPRINT });
    }
    rebuildPath() {
        this.pathCache = ensurePathCache(this.content.board, this.simBoard, this.routeId, this.pathCache);
    }
}
