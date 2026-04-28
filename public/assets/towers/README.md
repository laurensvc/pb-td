# Tower art

## Base gems (`base/{family}/`)

**Implemented:** PNGs under `public/assets/towers/base/{family}/`. The app loads them from `/assets/towers/base/...` (tries `{gemId}.png`, then `{family}.png`) and draws them **before** the `gems.png` atlas.

**Naming (first match wins):**

1. **Per tier:** `{family}-{tier}.png` (e.g. `ruby-3.png` in `base/ruby/`) → only that `ruby-3` tower/draft.
2. **Whole family:** `{family}.png` (e.g. `ruby.png` in `base/ruby/`) → all `ruby-1` … `ruby-6` use that image until you add tier files.

Recipe towers stay under `named/` and still use the atlas (or future named PNGs).

## Recipe & special towers (`named/{tower-id}/`)

Examples:

- `named/silver/` — e.g. `silver_basic.png` → game tower **`silver`**
- `named/silver-knight/` — e.g. `silver_knight.png` → **`silver-knight`**

Use the **exact kebab-case id** from `gameConfig.gems` / recipes as the folder name.

You can also keep **both** Silver-line portraits under `named/silver/` (`silver_basic.png`, `silver_knight.png`) for artist convenience; still keep a `named/silver-knight/` folder (even empty) so tooling that maps id → path stays consistent, or copy the same art into both folders.
