import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Cinzel', 'Georgia', 'serif'],
        body: ['Alegreya Sans', 'Segoe UI', 'sans-serif'],
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
      },
      boxShadow: {
        forge: '0 24px 80px rgb(0 0 0 / 0.36)',
        insetGlow: 'inset 0 1px 0 rgb(255 255 255 / 0.14)',
      },
    },
  },
  plugins: [],
} satisfies Config;
