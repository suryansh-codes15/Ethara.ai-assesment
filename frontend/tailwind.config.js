/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Syne', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        void:    '#02020a',
        surface: '#0d0d1a',
        brand:   '#7c3aed',
        brand2:  '#4f46e5',
        cyan:    '#06b6d4',
      },
      animation: {
        'shimmer':     'shimmer 2.5s linear infinite',
        'float':       'float 4s ease-in-out infinite',
        'pulse-glow':  'pulseGlow 2s ease-in-out infinite',
        'aurora':      'aurora 12s ease-in-out infinite alternate',
      },
      keyframes: {
        shimmer:   { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        float:     { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } },
        pulseGlow: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.5 } },
        aurora:    { '0%': { transform: 'translate(0,0) scale(1)' }, '100%': { transform: 'translate(5%,5%) scale(1.1)' } },
      },
    },
  },
  plugins: [],
}
