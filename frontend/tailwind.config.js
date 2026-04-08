/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f6ee',
          100: '#ccecdb',
          200: '#99d9b6',
          300: '#66c691',
          400: '#33b36d',
          500: '#00A650', // FP Bright Green
          600: '#008540',
          700: '#006738', // FP Dark Green
          800: '#004224',
          900: '#002112',
        },
        secondary: '#006738',
        accent: '#f59e0b',
        background: '#f8fafc'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
