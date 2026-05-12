// MY STUDIO — tailwind.config.ts
// PURPOSE: Tailwind CSS config with MY STUDIO design system colors

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#080808',
        'surface-1': '#111111',
        'surface-2': '#1a1a1a',
        border: '#2a2a2a',
        primary: '#6366f1',
        secondary: '#8b5cf6',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        'text-primary': '#f9fafb',
        'text-secondary': '#9ca3af',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export { config as default };
