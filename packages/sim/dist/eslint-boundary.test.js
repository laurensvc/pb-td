import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
describe('eslint sim browser-free boundary', () => {
    it('flags Phaser imports under packages/sim', async () => {
        const eslint = new ESLint({ cwd: repoRoot });
        const results = await eslint.lintText('import Phaser from "phaser"\n', {
            filePath: join(repoRoot, 'packages/sim/src/__boundary__.ts'),
        });
        expect(results).toHaveLength(1);
        expect(results[0]?.messages.some((message) => message.ruleId === 'no-restricted-imports' && message.message.includes('phaser'))).toBe(true);
    });
});
