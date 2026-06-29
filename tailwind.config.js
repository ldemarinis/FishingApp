/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        ocean: {
          950: '#040d1a',
          900: '#0c1a2e',
          800: '#112240',
          700: '#1a3558',
          600: '#234a74',
          500: '#2d6196',
          400: '#3a7fbe',
          300: '#5ba3e0',
          200: '#8cc4f0',
          100: '#c2e2f9',
        },
        tide: {
          high: '#3a7fbe',
          low: '#d97706',
          rising: '#22c55e',
          falling: '#ef4444',
        },
        moon: {
          full: '#fef08a',
          new: '#374151',
        },
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
