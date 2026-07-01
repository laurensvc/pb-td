/** Wave-1 clear replay used for golden hash regression. */
export const WAVE1_CLEAR_REPLAY = {
    seed: 42,
    steps: [
        { type: 'skipCountdown' },
        { type: 'place', gx: 28, gy: 24 },
        { type: 'place', gx: 32, gy: 24 },
        { type: 'place', gx: 36, gy: 24 },
        { type: 'place', gx: 40, gy: 24 },
        { type: 'place', gx: 44, gy: 24 },
        { type: 'keep', candidateIndex: 0 },
        { type: 'tickUntilPhase', phase: 'placement', maxTicks: 8000 },
    ],
};
export function contentWithTinyWave1(content) {
    return {
        ...content,
        waves: content.waves.map((wave, index) => index === 0
            ? {
                ...wave,
                clearCount: 1,
                spawn: {
                    entries: [{ enemyId: 'stone-grunt', count: 1 }],
                    spawnIntervalMs: 0,
                    groupDelayMs: 0,
                    concurrent: false,
                },
            }
            : wave),
    };
}
