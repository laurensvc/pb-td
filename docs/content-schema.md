# Project Facet — Content Schema

Type definitions and JSON shapes for `packages/content` (PF-0.3).  
Validated with Zod at build time once the package is scaffolded.

---

## GemDefinition

```ts
type GemFamily =
  | 'flame' | 'tide' | 'gale' | 'stone'
  | 'thorn' | 'radiant' | 'umbral' | 'arcane';

type GemTier = 1 | 2 | 3 | 4 | 5;

type GemDefinition = {
  id: string;                    // e.g. "flame-t3"
  family: GemFamily;
  tier: GemTier;
  displayName: string;
  damage: number;                // milli-damage in sim; display / 1000
  attacksPerSecond: number;
  rangeTiles: number;
  targeting: TargetingMode[];
  damageTags: DamageTag[];
  effects: string[];
  mergeResultId?: string;        // e.g. "flame-t4"
};
```

---

## BoardLayout

```ts
type BoardLayout = {
  id: string;
  width: 28;
  height: 20;
  spawn: { x: number; y: number };
  exit: { x: number; y: number };
  blocked: [number, number][];   // permanent blocked cells
};
```

All cells not `spawn`, `exit`, or `blocked` are **buildable**.

---

## WaveSchedule

```ts
type WaveSegment = {
  enemyId: string;
  count: number;
  intervalTicks?: number;
};

type WaveDefinition = {
  wave: number;
  segments: WaveSegment[];
  bossId?: string;
  preview?: string;
};

type WaveSchedule = {
  id: string;
  totalWaves: number;
  waves: WaveDefinition[];
};
```

---

## CombinationRecipe

```ts
type CombinationRecipe = {
  id: string;
  displayName: string;
  familyA: GemFamily;
  familyB: GemFamily;
  minTier: GemTier;
  goldCost: number;
  dustCost?: number;
  resultTierRule: 'lower_input';
};
```

---

## Sample gem (Flame T1)

```json
{
  "id": "flame-t1",
  "family": "flame",
  "tier": 1,
  "displayName": "Ember Shard",
  "damage": 8000,
  "attacksPerSecond": 1.0,
  "rangeTiles": 2.5,
  "targeting": ["nearest"],
  "damageTags": ["fire"],
  "effects": ["burn-light"],
  "mergeResultId": "flame-t2"
}
```

---

## Package layout (PF-0.6)

```text
packages/content/
├── package.json
├── src/
│   ├── index.ts
│   ├── schemas.ts
│   └── validate.ts
└── data/
    ├── boards/default-28x20.json
    ├── waves/standard-24.json
    ├── waves/slice-6.json
    ├── gems/
    └── combinations.json
```

**Phase 0 test:** `validateContentPack()` returns `{ ok: true }` for all data files.
