import { buildFlyingPath } from './flying-path.js';
import { advanceFlyingCreep, advanceGroundCreep, } from './movement.js';
import { tickStatusEffects } from './status-effects.js';
import { pickMvpTower, resetWaveDamage, tickTowerCombat, } from './tower-combat.js';
import { awardMvpStack } from './tower-stats.js';
import { createWaveSpawner, isWaveCleared, registerCreepResolved, tickWaveSpawner, } from './wave-spawner.js';
export class CombatSession {
    content;
    level;
    routeId;
    pathCache;
    flyingPath;
    rng;
    creeps;
    towers;
    spawner;
    towerRuntime = new Map();
    mvpStacks = new Map();
    tickCount = 0;
    leaksThisWave = 0;
    killsThisWave = 0;
    waveCleared = false;
    onLeak;
    constructor(config) {
        this.content = config.content;
        this.level = config.level;
        this.routeId = config.routeId;
        this.pathCache = config.pathCache;
        this.towers = config.towers;
        this.rng = config.rng;
        this.creeps = config.existingCreeps ?? [];
        this.flyingPath = buildFlyingPath(config.content.board, config.routeId);
        this.onLeak = config.onLeak;
        this.spawner = createWaveSpawner(config.content, config.level);
        for (const tower of this.towers) {
            if (tower.mvpStacks > 0) {
                this.mvpStacks.set(tower.id, tower.mvpStacks);
            }
        }
    }
    get spawnerState() {
        return this.spawner;
    }
    tick(dt, combatActive) {
        const events = [];
        if (combatActive && !this.waveCleared) {
            const spawnResult = tickWaveSpawner(this.spawner, this.content, dt, this.pathCache, this.flyingPath);
            for (const creep of spawnResult.spawned) {
                this.creeps.push(creep);
                events.push({
                    type: 'creep_spawned',
                    creepId: creep.id,
                    enemyId: creep.enemyId,
                    waveNumber: creep.waveNumber,
                });
            }
            if (spawnResult.spawnJustCompleted) {
                events.push({ type: 'wave_spawn_complete', waveNumber: this.level });
            }
        }
        const damageConfig = { matrix: this.content.armorDamageMatrix, rng: this.rng };
        for (const creep of this.creeps) {
            if (creep.state !== 'moving')
                continue;
            const poison = tickStatusEffects(creep, dt, damageConfig);
            if (poison.poisonDamage > 0) {
                creep.hp -= poison.poisonDamage;
                if (poison.sourceTowerId) {
                    const runtime = this.towerRuntime.get(poison.sourceTowerId);
                    if (runtime)
                        runtime.waveDamageDealt += poison.poisonDamage;
                }
                if (creep.hp <= 0) {
                    creep.state = 'dead';
                    this.handleCreepResolved(creep, poison.sourceTowerId ?? 'poison', events);
                }
            }
            const leaked = creep.mobility === 'flying'
                ? advanceFlyingCreep(creep, this.flyingPath, dt)
                : this.pathCache
                    ? advanceGroundCreep(creep, this.pathCache, dt)
                    : false;
            if (leaked && creep.state === 'moving') {
                creep.state = 'dead';
                this.leaksThisWave += 1;
                events.push({
                    type: 'creep_leaked',
                    creepId: creep.id,
                    waveNumber: creep.waveNumber,
                    lifeCost: creep.lifeCost,
                });
                this.onLeak?.(creep);
                registerCreepResolved(this.spawner);
            }
        }
        if (combatActive && !this.waveCleared) {
            const combatResult = tickTowerCombat(this.content, this.towers, this.towerRuntime, this.creeps, this.mvpStacks, dt, damageConfig, this.pathCache);
            events.push(...combatResult.events);
            for (const kill of combatResult.kills) {
                this.killsThisWave += 1;
                const tower = this.towers.find((t) => t.id === kill.killerTowerId);
                if (tower)
                    tower.killCount += 1;
                registerCreepResolved(this.spawner);
            }
        }
        this.creeps = this.creeps.filter((c) => c.state === 'moving');
        if (combatActive && !this.waveCleared && isWaveCleared(this.spawner)) {
            const otherWaveCreeps = this.spawner.concurrent
                ? 0
                : this.creeps.filter((c) => c.waveNumber !== this.level).length;
            if (otherWaveCreeps === 0) {
                this.waveCleared = true;
                events.push({ type: 'wave_cleared', waveNumber: this.level });
                const mvpId = pickMvpTower(this.towerRuntime);
                if (mvpId) {
                    const stacks = awardMvpStack(this.mvpStacks.get(mvpId) ?? 0);
                    this.mvpStacks.set(mvpId, stacks);
                    const tower = this.towers.find((t) => t.id === mvpId);
                    if (tower)
                        tower.mvpStacks = stacks;
                    events.push({ type: 'mvp_awarded', towerId: mvpId, stacks });
                }
                resetWaveDamage(this.towerRuntime);
            }
        }
        this.tickCount += 1;
        return {
            events,
            snapshot: this.buildSnapshot(),
            waveCleared: this.waveCleared,
        };
    }
    handleCreepResolved(creep, killerTowerId, events) {
        this.killsThisWave += 1;
        const tower = this.towers.find((t) => t.id === killerTowerId);
        if (tower)
            tower.killCount += 1;
        registerCreepResolved(this.spawner);
        events.push({
            type: 'creep_killed',
            creepId: creep.id,
            killerTowerId,
            gold: creep.goldReward,
        });
    }
    buildSnapshot() {
        const mvpId = pickMvpTower(this.towerRuntime);
        return {
            tick: this.tickCount,
            waveNumber: this.level,
            activeCreepCount: this.creeps.length,
            spawnComplete: this.spawner.spawnComplete,
            leaksThisWave: this.leaksThisWave,
            killsThisWave: this.killsThisWave,
            mvpTowerId: mvpId,
            creeps: this.creeps.map((c) => ({
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
export function createCombatSession(config) {
    return new CombatSession(config);
}
