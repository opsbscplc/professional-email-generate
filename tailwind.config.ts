import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // Production optimizations for Tailwind v3
  ...(process.env.NODE_ENV === 'production' && {
    safelist: [
      // Keep glass morphism classes
      'backdrop-blur-xs',
      'backdrop-blur-sm',
      'backdrop-blur-md',
      'backdrop-blur-lg',
      'backdrop-blur-xl',
      'backdrop-blur-2xl',
      'backdrop-blur-3xl',
      'bg-opacity-10',
      'bg-opacity-20',
      'border-opacity-20',
      'border-opacity-30',
      // Keep animation classes
      'animate-fade-in',
      'animate-slide-up',
      'animate-glass-shimmer',
      // Keep dynamic classes that might be generated
      'glass-bg',
      'glass-border',
      'glass-shadow',
    ],
  }),
  theme: {
    extend: {
      colors: {
        'glass-bg': 'rgba(255, 255, 255, 0.1)',
        'glass-border': 'rgba(255, 255, 255, 0.2)',
        'glass-shadow': 'rgba(0, 0, 0, 0.1)',
        'accent-primary': '#007AFF',
        'accent-secondary': '#5856D6',
        'text-primary': '#1D1D1F',
        'text-secondary': '#86868B',
      },
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
        '3xl': '40px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'glass-shimmer': 'glassShimmer 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glassShimmer: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '0.8' },
        },
      },
    },
  },
  plugins: [],
}
export default config