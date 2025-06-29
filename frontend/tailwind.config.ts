import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}"
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      colors: {
        background: '#4B0082',
        foreground: '#ffffff',
        primary: {
          DEFAULT: '#ffffff',
          foreground: '#4B0082'
        },
        secondary: {
          DEFAULT: '#e5e7eb',
          foreground: '#4B0082'
        },
        accent: {
          DEFAULT: '#fbbf24',
          foreground: '#4B0082'
        },
        muted: {
          DEFAULT: 'rgba(255, 255, 255, 0.08)',
          foreground: '#e5e7eb'
        },
        border: 'rgba(255, 255, 255, 0.2)',
        input: 'rgba(255, 255, 255, 0.08)',
        ring: '#ffffff',
        card: {
          DEFAULT: 'rgba(255, 255, 255, 0.08)',
          foreground: '#ffffff'
        },
        popover: {
          DEFAULT: 'rgba(255, 255, 255, 0.16)',
          foreground: '#ffffff'
        },
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff'
        },
        glass: {
          light: 'rgba(255, 255, 255, 0.08)',
          medium: 'rgba(255, 255, 255, 0.12)',
          dark: 'rgba(255, 255, 255, 0.16)',
          border: 'rgba(255, 255, 255, 0.2)',
          'border-light': 'rgba(255, 255, 255, 0.15)',
          'border-medium': 'rgba(255, 255, 255, 0.25)'
        },
        saas: {
          blue: '#4F46E5',
          purple: '#8B5CF6',
          'light-blue': '#60A5FA',
          'light-purple': '#A78BFA'
        }
      },
      borderRadius: {
        lg: '16px',
        md: '12px',
        sm: '8px'
      },
      keyframes: {},
      animation: {}
    }
  },
  plugins: [],
};

export default config;