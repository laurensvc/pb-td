import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@facet/content': path.resolve(rootDir, '../../packages/content/src/index.ts'),
      '@facet/protocol': path.resolve(rootDir, '../../packages/protocol/src/index.ts'),
      '@facet/sim': path.resolve(rootDir, '../../packages/sim/src/index.ts'),
    },
  },
})
