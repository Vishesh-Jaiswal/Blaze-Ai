/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Core futuristic palette
        ink: {
          900: '#05060f',
          800: '#080a18',
          700: '#0b0e22',
          600: '#10142e',
          500: '#161b3d',
        },
        electric: {
          50: '#e9f2ff',
          100: '#cfe2ff',
          200: '#9cc4ff',
          300: '#5fa1ff',
          400: '#2f80ff',
          500: '#0b63f6',
          600: '#0a4fd1',
          700: '#0b3fa3',
          800: '#0d3580',
          900: '#0f2e63',
        },
        cyanglow: {
          300: '#7df9ff',
          400: '#34e3ff',
          500: '#06c8ff',
        },
        violetglow: {
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        'grid-faint':
          'linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)',
        'radial-glow':
          'radial-gradient(circle at 50% 0%, rgba(47,128,255,0.25), transparent 60%)',
        'electric-gradient':
          'linear-gradient(135deg, #2f80ff 0%, #06c8ff 50%, #8b5cf6 100%)',
      },
      boxShadow: {
        glow: '0 0 40px rgba(47,128,255,0.35)',
        'glow-sm': '0 0 18px rgba(47,128,255,0.4)',
        'glow-cyan': '0 0 40px rgba(6,200,255,0.35)',
        'glow-violet': '0 0 40px rgba(139,92,246,0.35)',
        glass: '0 8px 32px rgba(0,0,0,0.37)',
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-18px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
          '50%': { transform: 'translateY(-30px) translateX(12px)' },
        },
        'spin-slow': {
          to: { transform: 'rotate(360deg)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'gradient-pan': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float-slow 11s ease-in-out infinite',
        'spin-slow': 'spin-slow 24s linear infinite',
        'pulse-glow': 'pulse-glow 4s ease-in-out infinite',
        shimmer: 'shimmer 2.5s infinite',
        'gradient-pan': 'gradient-pan 8s ease infinite',
        'fade-up': 'fade-up 0.6s ease-out forwards',
      },
    },
  },
  plugins: [],
};
