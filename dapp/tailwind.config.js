/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Professional Dark Green Palette (darker, more saturated)
        neon: {
          50: '#d1fae5',
          100: '#a7f3d0',
          200: '#6ee7b7',
          300: '#34d399',
          400: '#10b981',
          500: '#10B981',  // Main green (darker, professional)
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        cyber: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',  // Green accent
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        dark: {
          950: '#000000',  // Pure black (main background)
          900: '#050505',  // Almost black (cards, headers)
          850: '#0a0a0a',  // Very dark gray (elevated cards)
          800: '#0f0f0f',  // Dark gray
          700: '#141414',  // Medium dark gray
          600: '#1a1a1a',  // Lighter dark gray
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'neon-sm': '0 0 10px rgba(16, 185, 129, 0.3)',
        'neon': '0 0 20px rgba(16, 185, 129, 0.5)',
        'neon-md': '0 0 30px rgba(16, 185, 129, 0.6)',
        'neon-lg': '0 0 40px rgba(16, 185, 129, 0.7)',
        'neon-xl': '0 0 60px rgba(16, 185, 129, 0.8)',
        'cyber': '0 0 15px rgba(16, 185, 129, 0.4)',
      },
      animation: {
        'pulse-neon': 'pulse-neon 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        'pulse-neon': {
          '0%, 100%': {
            opacity: '1',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)'
          },
          '50%': {
            opacity: '0.8',
            boxShadow: '0 0 30px rgba(16, 185, 129, 0.8)'
          },
        },
        'glow': {
          'from': {
            textShadow: '0 0 10px rgba(16, 185, 129, 0.5), 0 0 20px rgba(16, 185, 129, 0.3)',
          },
          'to': {
            textShadow: '0 0 20px rgba(16, 185, 129, 0.8), 0 0 30px rgba(16, 185, 129, 0.5)',
          },
        },
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}
