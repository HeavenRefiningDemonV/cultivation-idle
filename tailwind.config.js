/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Ink wash grayscale palette
        'ink-black': '#0a0a0a',
        'ink-darkest': '#1a1a1a',
        'ink-dark': '#2d2d2d',
        'ink-medium': '#4a4a4a',
        'ink-light': '#6b6b6b',
        'ink-paper': '#e8e8e8',
        'ink-white': '#f5f5f5',

        // Accent colors
        'qi-blue': '#7dd3fc',
        'qi-glow': '#bae6fd',
        'qi-dark': '#0284c7',
        'breakthrough-red': '#ff6b6b',
        'breakthrough-pink': '#fca5a5',
        'gold-accent': '#fbbf24',
        'gold-bright': '#fcd34d',

        // Element colors (for spirit roots)
        'element-fire': '#ef4444',
        'element-water': '#3b82f6',
        'element-earth': '#92400e',
        'element-metal': '#9ca3af',
        'element-wood': '#22c55e',
      },
      fontFamily: {
        'cinzel': ['Cinzel', 'serif'],
        'inter': ['Inter', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'ink-wash': 'radial-gradient(ellipse at center, #2d2d2d 0%, #0a0a0a 100%)',
        'mist': 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)',
      },
      boxShadow: {
        'qi-glow': '0 0 20px rgba(125, 211, 252, 0.5)',
        'breakthrough': '0 0 30px rgba(252, 165, 165, 0.6)',
        'inner-dark': 'inset 0 2px 8px rgba(0, 0, 0, 0.6)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { opacity: '0.5' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
