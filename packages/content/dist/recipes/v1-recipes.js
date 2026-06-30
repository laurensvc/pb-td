export const v1Recipes = [
    {
        id: 'silver',
        displayName: 'Silver',
        tier: 'basic',
        inputs: [
            { kind: 'gem', gemId: 'sapphire-chipped' },
            { kind: 'gem', gemId: 'diamond-chipped' },
            { kind: 'gem', gemId: 'topaz-chipped' },
        ],
        outputTowerId: 'silver',
        instantCombineInSingleRound: true,
    },
    {
        id: 'malachite',
        displayName: 'Malachite',
        tier: 'basic',
        inputs: [
            { kind: 'gem', gemId: 'opal-chipped' },
            { kind: 'gem', gemId: 'emerald-chipped' },
            { kind: 'gem', gemId: 'aquamarine-chipped' },
        ],
        outputTowerId: 'malachite',
        instantCombineInSingleRound: true,
    },
    {
        id: 'quartz',
        displayName: 'Quartz',
        tier: 'basic',
        inputs: [
            // v1 uses emerald-normal instead of emerald-flawless (flawless not in prob L1-3)
            { kind: 'gem', gemId: 'emerald-normal' },
            { kind: 'gem', gemId: 'ruby-normal' },
            { kind: 'gem', gemId: 'amethyst-flawed' },
        ],
        outputTowerId: 'quartz',
        instantCombineInSingleRound: true,
    },
];
