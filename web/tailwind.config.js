/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: { DEFAULT: '#c9a84c', light: '#e0c872', dark: '#a68a3a', muted: 'rgba(201,168,76,0.15)' },
        teal: { DEFAULT: '#2a9d8f' },
        crimson: { DEFAULT: '#c0392b' },
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        body: ['Outfit', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
