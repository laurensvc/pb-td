import { SIM_HZ } from '../constants.js';
import { buildFlyingPath } from './flying-path.js';
import { resetCreepIdCounter } from './creep-factory.js';
import { advanceFlyingCreep, advanceGroundCreep } from './movement.js';
import { createWaveSpawner, isWaveCleared, registerCreepResolved, tickWaveSpawner, } from './wave-spawner.js';
import { pickMvpTower, resetWaveDamage, tickTowerCombat, } from './tower-combat.js';
import { tickStatusEffects } from './status-effects.js';
import { awardMvpStack } from './tower-stats.js';
export class MatchSimulator {
    match;
    content;
    creeps = [];
    waveSpawner = null;
    flyingPath;
    towerRuntime = new Map();
    mvpStacks = new Map();
    tickCount = 0;
    leaksThisWave = 0;
    killsThisWave = 0;
    waveActive = false;
    constructor(match, content, config = {}) {
        this.match = match;
        this.content = content;
        this.flyingPath = buildFlyingPath(content.board, match.routeId);
        if (config.mvpStacks) {
            for (const [towerId, stacks] of Object.entries(config.mvpStacks)) {
                this.mvpStacks.set(towerId, stacks);
            }
        }
    }
    startWave() {
        if (this.match.phase !== 'combat') {
            throw new Error('Cannot start wave outside combat phase');
        }
        resetCreepIdCounter();
        this.creeps = [];
        this.leaksThisWave = 0;
        this.killsThisWave = 0;
        this.tickCount = 0;
        this.waveSpawner = createWaveSpawner(this.content, this.match.level);
        resetWaveDamage(this.towerRuntime);
        this.waveActive = true;
    }
    tick(dt = 1 / SIM_HZ) {
        const events = [];
        if (this.match.phase !== 'combat' || !this.waveActive || !this.waveSpawner) {
            return { events, snapshot: this.buildSnapshot(), waveComplete: false };
        }
        const pathCache = this.match.pathCache;
        const damageConfig = {
            matrix: this.content.armorDamageMatrix,
            rng: this.match.rng,
        };
        this.tickCount += 1;
        const spawnResult = tickWaveSpawner(this.waveSpawner, this.content, dt, pathCache, this.flyingPath);
        for (const creep of spawnResult.spawned) {
            this.creeps.push(creep);
            events.push({
                type: 'creep_spawned',
                creepId: creep.id,
                enemyId: creep.enemyId,
                waveNumber: this.match.level,
            });
        }
        if (spawnResult.spawnJustCompleted) {
            events.push({ type: 'wave_spawn_complete', waveNumber: this.match.level });
        }
        for (const creep of this.creeps) {
            if (creep.state !== 'moving')
                continue;
            const status = tickStatusEffects(creep, dt, damageConfig);
            if (status.poisonDamage > 0) {
                creep.hp -= status.poisonDamage;
                if (creep.hp <= 0) {
                    creep.state = 'dead';
                    registerCreepResolved(this.waveSpawner);
                    this.killsThisWave += 1;
                    if (status.sourceTowerId) {
                        const runtime = this.towerRuntime.get(status.sourceTowerId);
                        if (runtime)
                            runtime.waveDamageDealt += status.poisonDamage;
                    }
                    events.push({
                        type: 'creep_killed',
                        creepId: creep.id,
                        killerTowerId: status.sourceTowerId ?? 'poison',
                        gold: creep.goldReward,
                    });
                    this.match.gold += creep.goldReward;
                }
            }
        }
        for (const creep of this.creeps) {
            if (creep.state !== 'moving')
                continue;
            let reachedGoal = false;
            if (creep.mobility === 'flying') {
                reachedGoal = advanceFlyingCreep(creep, this.flyingPath, dt);
            }
            else if (pathCache) {
                reachedGoal = advanceGroundCreep(creep, pathCache, dt);
            }
            if (reachedGoal) {
                creep.state = 'dead';
                registerCreepResolved(this.waveSpawner);
                this.leaksThisWave += creep.lifeCost;
                events.push({
                    type: 'creep_leaked',
                    creepId: creep.id,
                    waveNumber: this.match.level,
                    lifeCost: creep.lifeCost,
                });
                this.match.registerLeak();
            }
        }
        const combatResult = tickTowerCombat(this.content, this.match.towers, this.towerRuntime, this.creeps, this.mvpStacks, dt, damageConfig, pathCache);
        events.push(...combatResult.events);
        for (const kill of combatResult.kills) {
            registerCreepResolved(this.waveSpawner);
            this.killsThisWave += 1;
            this.match.gold += kill.gold;
            const tower = this.match.towers.find((t) => t.id === kill.killerTowerId);
            if (tower)
                tower.killCount += 1;
        }
        let waveComplete = false;
        if (isWaveCleared(this.waveSpawner)) {
            this.waveActive = false;
            waveComplete = true;
            events.push({ type: 'wave_cleared', waveNumber: this.match.level });
            const mvpId = pickMvpTower(this.towerRuntime);
            if (mvpId) {
                const next = awardMvpStack(this.mvpStacks.get(mvpId) ?? 0);
                this.mvpStacks.set(mvpId, next);
                events.push({ type: 'mvp_awarded', towerId: mvpId, stacks: next });
            }
            this.match.completeWave();
        }
        return { events, snapshot: this.buildSnapshot(), waveComplete };
    }
    buildSnapshot() {
        const mvpId = pickMvpTower(this.towerRuntime);
        return {
            tick: this.tickCount,
            waveNumber: this.match.level,
            activeCreepCount: this.creeps.filter((c) => c.state === 'moving').length,
            spawnComplete: this.waveSpawner?.spawnComplete ?? false,
            leaksThisWave: this.leaksThisWave,
            killsThisWave: this.killsThisWave,
            mvpTowerId: mvpId,
            creeps: this.creeps
                .filter((c) => c.state === 'moving')
                .map((c) => ({
                id: c.id,
                enemyId: c.enemyId,
                hp: c.hp,
                maxHp: c.maxHp,
                pathProgress: c.pathProgress,
                worldPos: { ...c.worldPos },
                mobility: c.mobility,
            })),
        };
    }
}
export function runCombatUntilWaveEnd(sim, maxTicks = 60_000) {
    let last = { events: [], snapshot: sim.buildSnapshot(), waveComplete: false };
    for (let i = 0; i < maxTicks; i++) {
        last = sim.tick();
        if (last.waveComplete || sim.match.phase !== 'combat')
            break;
    }
    return last;
}
export { resetCreepIdCounter };
