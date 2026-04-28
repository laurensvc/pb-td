# `public/assets/`

Static files served from the site root (`/assets/...`).

- **`sprites/`** — Packed atlases (`gems.png`, `monsters.png`, `sprites.json`) used by the canvas renderer and `spriteMetadata`.
- **`towers/`** — Authoring layout for tower art; base gems load from `towers/base/{family}/` at runtime (see `towers/README.md`).
- **`monsters/`** — One folder per enemy id for future frames / packer (see `monsters/README.md`).

Regenerate empty tower/monster folders after config changes:

```bash
pnpm assets:folders
```

Plain tree: [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md).
