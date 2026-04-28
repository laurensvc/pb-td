# Monster art

One folder per **enemy id** from `src/game/config.ts` (`enemies` array), e.g.:

- `frenzied-pig/` — early pig-like creep  
- `smart-robot/` — robot creep  

## Suggested frame naming (for a future packer)

| Pattern | Role |
|--------|------|
| `idle_01.png`, `idle_02.png` | Idle loop |
| `walk_01.png` … `walk_04.png` | Move / walk |
| `attack_01.png` … | Attack (optional) |
| `death_01.png` … | Death (optional) |

Until a packer reads these paths, the game uses `public/assets/sprites/monsters.png` + `sprites.json`.
