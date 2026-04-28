/**
 * Creates `public/assets/towers` and `public/assets/monsters` folder trees from game config.
 * Safe to re-run; adds .gitkeep + README where missing, does not remove user PNGs.
 */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { gameConfig, gemFamilies } from '../src/game/config';

const root = join(process.cwd(), 'public', 'assets');
const towersBase = join(root, 'towers', 'base');
const towersNamed = join(root, 'towers', 'named');
const monstersRoot = join(root, 'monsters');

function ensureDir(dir: string): void {
  mkdirSync(dir, { recursive: true });
}

function touchGitkeep(dir: string): void {
  const p = join(dir, '.gitkeep');
  if (!existsSync(p)) writeFileSync(p, '');
}

function writeIfMissing(file: string, body: string): void {
  if (!existsSync(file)) writeFileSync(file, body);
}

for (const family of gemFamilies) {
  const dir = join(towersBase, family);
  ensureDir(dir);
  touchGitkeep(dir);
  writeIfMissing(
    join(dir, 'README.md'),
    `# ${family}\n\nPlace \`${family}-1.png\` … \`${family}-6.png\` here (or your naming — document in parent \`public/assets/towers/README.md\`).\n`,
  );
}

for (const gem of gameConfig.gems) {
  if (gem.classification === 'gem') continue;
  const dir = join(towersNamed, gem.id);
  ensureDir(dir);
  touchGitkeep(dir);
  writeIfMissing(
    join(dir, 'README.md'),
    `# ${gem.name}\n\nGame id: \`${gem.id}\`\n\nSuggested portrait: \`${gem.id}.png\` or line-specific names (e.g. \`silver_basic.png\`).\n`,
  );
}

for (const enemy of gameConfig.enemies) {
  const dir = join(monstersRoot, enemy.id);
  ensureDir(dir);
  touchGitkeep(dir);
  writeIfMissing(
    join(dir, 'README.md'),
    `# ${enemy.name}\n\nEnemy id: \`${enemy.id}\`\n\nSee \`../README.md\` for suggested animation filenames.\n`,
  );
}

console.log(
  `Synced asset folders: ${gemFamilies.length} tower families, ` +
    `${gameConfig.gems.filter((g) => g.classification !== 'gem').length} named towers, ` +
    `${gameConfig.enemies.length} monsters.`,
);
