import eslint from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const simBrowserFreeImportRule = [
  'error',
  {
    paths: [
      {
        name: 'phaser',
        message: '@facet/sim must not import Phaser (presentation layer only).',
      },
      {
        name: 'react',
        message: '@facet/sim must not import React (presentation layer only).',
      },
      {
        name: 'react-dom',
        message: '@facet/sim must not import React DOM (presentation layer only).',
      },
      {
        name: 'jsdom',
        message: '@facet/sim must not import DOM shims.',
      },
    ],
  },
]

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      'apps/web/dist/**',
      'pnpm-lock.yaml',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    files: [
      'packages/**/*.ts',
      'scripts/**/*.{js,mjs}',
      'vitest.config.ts',
      'apps/web/vitest.config.ts',
      'packages/*/vitest.config.ts',
    ],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['packages/sim/**/*.ts'],
    rules: {
      'no-restricted-imports': simBrowserFreeImportRule,
    },
  },
)
