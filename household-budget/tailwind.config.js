/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-pretendard)', 'system-ui', 'sans-serif'],
      },
      colors: {
        cream: {
          50: '#fdfcf7',
          100: '#f9f5eb',
          200: '#f0e9d2',
        },
        sage: {
          400: '#7a9e7e',
          500: '#5d8a62',
          600: '#4a7050',
        },
        clay: {
          400: '#c4856a',
          500: '#b06a4e',
          600: '#8f5239',
        },
        warm: {
          100: '#fef3e2',
          200: '#fde8c8',
          300: '#f9d4a0',
        }
      }
    },
  },
  plugins: [],
}
