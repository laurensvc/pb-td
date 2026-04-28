import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Share Tech Mono', 'ui-monospace', 'monospace'],
        body: ['Inter', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        basalt: '#15120f',
        soot: '#262019',
        ember: '#d27633',
        brass: '#d7ae64',
        vellum: '#f3e5bd',
        verdigris: '#57c4b4',
        ruby: '#e15c65',
        sapphire: '#6491ff',
        topaz: '#f0c84e',
        emerald: '#55cf87',
        amethyst: '#ad7bf2',
        onyx: '#9b91a4',
        'arcade-yellow': '#ffe45c',
        'arcade-cyan': '#4de8ff',
        'arcade-red': '#ff4d6d',
        'arcade-violet': '#b86bff',
        'arcade-green': '#69ff8f',
        'tactical-ink': '#d8eef4',
        'tactical-muted': '#7f9ca8',
        'tactical-cyan': '#8beaff',
        'tactical-green': '#8df7b0',
        'tactical-amber': '#f3ca72',
        'tactical-red': '#ff6f86',
        'tactical-violet': '#b8a5ff',
      },
      boxShadow: {
        forge: '0 24px 80px rgb(0 0 0 / 0.36)',
        insetGlow: 'inset 0 1px 0 rgb(255 255 255 / 0.14)',
        arcade: '4px 4px 0 rgb(0 0 0 / 0.45)',
        pixel: '4px 4px 0 rgb(0 0 0 / 0.5)',
      },
    },
  },
  plugins: [],
} satisfies Config;
