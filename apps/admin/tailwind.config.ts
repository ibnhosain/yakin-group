import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50:  '#eff4ff',
          100: '#dbe6fe',
          200: '#bfd0fe',
          300: '#93b3fd',
          400: '#6089f8',
          500: '#3d64f4',
          600: '#2847e8',
          700: '#1f36d4',
          800: '#1f2fac',
          900: '#0f2d5e',
          950: '#0a1c3b',
        },
        emerald: {
          500: '#0d7c5f',
          600: '#0a6550',
        },
        gold: {
          400: '#e5a93a',
          500: '#c9902a',
        },
      },
      fontFamily: {
        sans: ['Hind Siliguri', 'Inter', 'system-ui', 'sans-serif'],
        bengali: ['Hind Siliguri', 'Noto Sans Bengali', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
