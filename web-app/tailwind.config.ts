import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#0B0F19',
          surface: '#111827',
          primary: '#3B82F6',
          accent: '#22D3EE',
          'text-primary': '#E5E7EB',
          'text-secondary': '#9CA3AF',
          border: '#1F2937',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
