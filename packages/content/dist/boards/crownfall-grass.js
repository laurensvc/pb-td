const MAP_WIDTH = 148;
const MAP_HEIGHT = 148;
const BORDER = 2;
function borderRects() {
    return [
        { gx: 0, gy: 0, w: MAP_WIDTH, h: BORDER },
        { gx: 0, gy: MAP_HEIGHT - BORDER, w: MAP_WIDTH, h: BORDER },
        { gx: 0, gy: 0, w: BORDER, h: MAP_HEIGHT },
        { gx: MAP_WIDTH - BORDER, gy: 0, w: BORDER, h: MAP_HEIGHT },
    ];
}
/** Spawn-edge bypass strip per BOARD-AND-MAZE-SPEC.md §9.3 */
function spawnBypassStrip() {
    return { gx: 0, gy: 118, w: 20, h: 4 };
}
/** Diagonal unbuildable band (top-left to bottom-right corridor prevention) */
function diagonalBypass() {
    const rects = [];
    for (let i = 0; i < 30; i++) {
        rects.push({ gx: 2 + i, gy: 2 + i, w: 3, h: 3 });
    }
    return rects;
}
/** Goal approach lane — unbuildable final approach corridor */
function goalApproachLane() {
    return [
        { gx: 118, gy: 0, w: 8, h: 24 },
        { gx: 110, gy: 0, w: 8, h: 16 },
    ];
}
const landmarks = [
    {
        id: 'spawn',
        grid: { gx: 8, gy: 124 },
        padSize: 4,
        landmarkKey: 'env.spawn-gate',
    },
    {
        id: 'checkpoint-1',
        grid: { gx: 68, gy: 68 },
        padSize: 3,
        landmarkKey: 'env.checkpoint-1',
    },
    {
        id: 'checkpoint-2',
        grid: { gx: 108, gy: 48 },
        padSize: 3,
        landmarkKey: 'env.checkpoint-2',
    },
    {
        id: 'checkpoint-3',
        grid: { gx: 48, gy: 48 },
        padSize: 3,
        landmarkKey: 'env.checkpoint-3',
    },
    {
        id: 'checkpoint-4',
        grid: { gx: 108, gy: 88 },
        padSize: 3,
        landmarkKey: 'env.checkpoint-4',
    },
    {
        id: 'checkpoint-5',
        grid: { gx: 48, gy: 88 },
        padSize: 3,
        landmarkKey: 'env.checkpoint-5',
    },
    {
        id: 'goal',
        grid: { gx: 124, gy: 8 },
        padSize: 4,
        landmarkKey: 'env.goal-nexus',
    },
];
function landmarkPads() {
    return landmarks.map((lm) => ({
        gx: lm.grid.gx,
        gy: lm.grid.gy,
        w: lm.padSize,
        h: lm.padSize,
    }));
}
const crownfallSimpleLegs = [
    { from: 'spawn', to: 'checkpoint-1' },
    { from: 'checkpoint-1', to: 'checkpoint-2' },
    { from: 'checkpoint-2', to: 'checkpoint-1' },
    { from: 'checkpoint-1', to: 'goal' },
];
const crownfallFullLegs = [
    { from: 'spawn', to: 'checkpoint-1' },
    { from: 'checkpoint-1', to: 'checkpoint-2' },
    { from: 'checkpoint-2', to: 'checkpoint-1' },
    { from: 'checkpoint-1', to: 'checkpoint-3' },
    { from: 'checkpoint-3', to: 'checkpoint-1' },
    { from: 'checkpoint-1', to: 'checkpoint-4' },
    { from: 'checkpoint-4', to: 'checkpoint-1' },
    { from: 'checkpoint-1', to: 'checkpoint-5' },
    { from: 'checkpoint-5', to: 'checkpoint-1' },
    { from: 'checkpoint-1', to: 'goal' },
];
const flyingNodes = [
    'spawn',
    'checkpoint-1',
    'checkpoint-2',
    'checkpoint-1',
    'checkpoint-3',
    'checkpoint-1',
    'goal',
];
export const crownfallGrassBoard = {
    id: 'crownfall-grass',
    displayName: 'Crownfall Grass',
    tileSize: 32,
    width: 148,
    height: 148,
    terrain: {
        baseTileKey: 'terrain.grass-floor',
        decorKeys: ['terrain.grass-variant-a'],
    },
    landmarks: [...landmarks],
    routes: [
        {
            id: 'crownfall-simple',
            groundLegs: crownfallSimpleLegs,
            flyingNodes: [...flyingNodes],
        },
        {
            id: 'crownfall-full',
            groundLegs: crownfallFullLegs,
            flyingNodes: [...flyingNodes],
        },
    ],
    defaultRouteId: 'crownfall-simple',
    zones: {
        unbuildable: [...borderRects(), ...landmarkPads(), ...goalApproachLane()],
        forcedWalkable: [spawnBypassStrip()],
        goalApproachLane: goalApproachLane(),
        diagonalBypass: diagonalBypass(),
    },
    camera: {
        startFocus: 'checkpoint-1',
        bounds: [0, 0, MAP_WIDTH * 32, MAP_HEIGHT * 32],
    },
};
export function landmarkPadRects(board) {
    return board.landmarks.map((lm) => ({
        gx: lm.grid.gx,
        gy: lm.grid.gy,
        w: lm.padSize,
        h: lm.padSize,
    }));
}
