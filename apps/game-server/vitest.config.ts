import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@facet/web/game': path.resolve(__dirname, '../web/src/game/index.ts'),
    },
  },
});
