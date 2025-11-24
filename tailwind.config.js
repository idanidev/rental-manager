/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        terracotta: {
          50: '#fef5e7',
          100: '#fde8d1',
          200: '#fbd0a3',
          300: '#f9b175',
          400: '#f79247',
          500: '#d2691e',
          600: '#b85a1a',
          700: '#9e4b16',
          800: '#843c12',
          900: '#6a2d0e',
        },
        warm: {
          beige: '#F5E6D3',
          cream: '#FFF8DC',
          white: '#FFFBF5',
          gray: '#F8F6F0',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
