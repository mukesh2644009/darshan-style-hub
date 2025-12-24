/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fdf4f3',
          100: '#fce8e6',
          200: '#f9d5d1',
          300: '#f4b5ae',
          400: '#ec8b80',
          500: '#e06456',
          600: '#cc4637',
          700: '#ab372a',
          800: '#8e3126',
          900: '#762e25',
          950: '#40140f',
        },
        accent: {
          50: '#f6f5f0',
          100: '#e9e6d8',
          200: '#d5cfb4',
          300: '#bdb389',
          400: '#a99a68',
          500: '#9a885a',
          600: '#84704c',
          700: '#6b5940',
          800: '#5b4b39',
          900: '#4f4134',
          950: '#2c231b',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

