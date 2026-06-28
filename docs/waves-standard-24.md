# Standard 24-wave schedule

**File target:** `packages/content/data/waves/standard-24.json` (PF-0.4)

| Wave | Segments | Boss | Act lesson |
|-----:|----------|------|------------|
| 1 | 8× runner | — | Basic routing |
| 2 | 10× runner | — | First merges |
| 3 | 20× swarm | — | AoE intro |
| 4 | 6× runner, 4× bulwark | — | Armour hint |
| 5 | 8× runner, 6× flyer | — | Anti-air teaser |
| 6 | 4× bulwark, 1× burrower | The Burrower | Mini-boss |
| 7 | 12× runner, 8× swarm | — | Act II |
| 8 | 10× bulwark | — | Armour shred |
| 9 | 15× bulwark | — | Heavy armour |
| 10 | 10× wisp | — | Resistances |
| 11 | 20× swarm, 6× leech | — | Focus fire |
| 12 | 6× bulwark, 1× tempest | The Tempest | Major boss |
| 13 | 12× mixed | — | Combo decisions |
| 14 | 10× wisp, 10× bulwark | — | Diversity |
| 15 | 18× mixed resist | — | Counter-building |
| 16 | 8× siege | — | Leak threat |
| 17 | 15× swarm, 8× flyer | — | Mixed lanes |
| 18 | 20× mixed | — | Multi-pressure |
| 19 | 10× elite runner | — | Optimization |
| 20 | 12× flyer, 8× wisp | — | Elite air |
| 21 | 15× bulwark, 6× leech | — | Sustain DPS |
| 22 | 1× warden, 12× swarm | The Warden | Shield boss |
| 23 | 18× mixed | — | Pre-final tune |
| 24 | 8× bulwark, 1× colossus | The Final Colossus | Final |

### Phase 1 slice (`slice-6.json`)

Waves 1–6 from table above only; boss on wave 6.

### JSON shape (wave 1 example)

```json
{
  "wave": 1,
  "segments": [{ "enemyId": "runner", "count": 8, "intervalTicks": 15 }],
  "preview": "8 Runners — test your maze length"
}
```

Enemy IDs map to archetypes in [backlog.md](./backlog.md#enemy-archetypes).
