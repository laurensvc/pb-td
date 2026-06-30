import { createCreepFromWave } from './creep-factory.js';
import { initCreepPosition } from './movement.js';
export function createWaveSpawner(content, waveNumber) {
    const wave = content.waves.find((w) => w.waveNumber === waveNumber);
    if (!wave)
        throw new Error(`Unknown wave: ${waveNumber}`);
    const queue = [];
    for (const entry of wave.spawn.entries) {
        for (let i = 0; i < entry.count; i++) {
            queue.push({
                enemyId: entry.enemyId,
                hpMultiplier: entry.hpMultiplier ?? 1,
                speedMultiplier: entry.speedMultiplier ?? 1,
            });
        }
    }
    return {
        wave,
        waveNumber,
        queue,
        spawnIntervalSec: wave.spawn.spawnIntervalMs / 1000,
        groupDelaySec: wave.spawn.groupDelayMs / 1000,
        concurrent: wave.spawn.concurrent,
        elapsed: 0,
        timeSinceLastSpawn: 0,
        spawnComplete: queue.length === 0,
        spawnedCount: 0,
        resolvedCount: 0,
    };
}
export function tickWaveSpawner(spawner, content, dt, pathCache, flyingPath) {
    const spawned = [];
    let spawnJustCompleted = false;
    if (spawner.spawnComplete) {
        return { spawned, spawnJustCompleted };
    }
    spawner.elapsed += dt;
    spawner.timeSinceLastSpawn += dt;
    if (spawner.elapsed < spawner.groupDelaySec) {
        return { spawned, spawnJustCompleted };
    }
    const canSpawn = spawner.queue.length > 0 &&
        (spawner.spawnedCount === 0 || spawner.timeSinceLastSpawn >= spawner.spawnIntervalSec);
    if (canSpawn) {
        const next = spawner.queue.shift();
        const creep = createCreepFromWave(content, next.enemyId, spawner.wave, next.hpMultiplier, next.speedMultiplier, spawner.waveNumber);
        initCreepPosition(creep, pathCache, flyingPath);
        spawned.push(creep);
        spawner.spawnedCount += 1;
        spawner.timeSinceLastSpawn = 0;
        if (spawner.queue.length === 0) {
            spawner.spawnComplete = true;
            spawnJustCompleted = true;
        }
    }
    return { spawned, spawnJustCompleted };
}
export function registerCreepResolved(spawner) {
    spawner.resolvedCount += 1;
}
export function isWaveCleared(spawner) {
    return (spawner.spawnComplete &&
        spawner.resolvedCount >= spawner.spawnedCount);
}
export function canStartConcurrentWave(spawner, activeCreepsFromOtherWaves) {
    if (spawner.concurrent)
        return true;
    return activeCreepsFromOtherWaves === 0;
}
