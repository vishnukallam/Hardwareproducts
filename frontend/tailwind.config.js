/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Material 3 + Gaming dark palette
        surface: {
          DEFAULT: '#0A0A0F',
          1: '#12121A',
          2: '#1A1A26',
          3: '#222234',
          4: '#2A2A40',
          5: '#32324C',
        },
        primary: {
          DEFAULT: '#7C4DFF',
          dark: '#6535E8',
          light: '#9B6FFF',
          container: '#1E1040',
          on: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#03DAC6',
          dark: '#00B8A9',
          light: '#66FFF0',
          container: '#002A27',
          on: '#000000',
        },
        tertiary: {
          DEFAULT: '#FF6B35',
          dark: '#E55A25',
          light: '#FF9068',
          container: '#3D1800',
        },
        error: {
          DEFAULT: '#CF6679',
          container: '#93000A',
        },
        outline: {
          DEFAULT: '#938F99',
          variant: '#49454F',
        },
        'on-surface': '#E6E1E5',
        'on-surface-variant': '#CAC4D0',
      },
      fontFamily: {
        display: ['"Orbitron"', 'sans-serif'],
        body: ['"Rajdhani"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        'm3-xs': '4px',
        'm3-sm': '8px',
        'm3-md': '12px',
        'm3-lg': '16px',
        'm3-xl': '24px',
        'm3-full': '50px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'scan-line': 'scanLine 8s linear infinite',
        'particle-drift': 'particleDrift 15s linear infinite',
        'gradient-shift': 'gradientShift 8s ease infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'card-hover': 'cardHover 0.3s ease forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(124, 77, 255, 0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(124, 77, 255, 0.8), 0 0 80px rgba(124, 77, 255, 0.3)' },
        },
        scanLine: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        particleDrift: {
          '0%': { transform: 'translate(0, 0) rotate(0deg)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translate(var(--tx), var(--ty)) rotate(360deg)', opacity: '0' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backdropBlur: {
        'm3': '20px',
      },
      boxShadow: {
        'm3-1': '0px 1px 2px rgba(0,0,0,0.3), 0px 1px 3px 1px rgba(0,0,0,0.15)',
        'm3-2': '0px 1px 2px rgba(0,0,0,0.3), 0px 2px 6px 2px rgba(0,0,0,0.15)',
        'm3-3': '0px 4px 8px 3px rgba(0,0,0,0.15), 0px 1px 3px rgba(0,0,0,0.3)',
        'm3-4': '0px 6px 10px 4px rgba(0,0,0,0.15), 0px 2px 3px rgba(0,0,0,0.3)',
        'm3-5': '0px 8px 12px 6px rgba(0,0,0,0.15), 0px 4px 4px rgba(0,0,0,0.3)',
        'glow-primary': '0 0 30px rgba(124, 77, 255, 0.5)',
        'glow-secondary': '0 0 30px rgba(3, 218, 198, 0.5)',
        'glow-tertiary': '0 0 30px rgba(255, 107, 53, 0.5)',
      }
    },
  },
  plugins: [],
}
