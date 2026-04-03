/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)',
        secondary: 'var(--secondary)',
        danger: 'var(--danger)',
        warning: 'var(--warning)',
        dark: 'var(--bg-dark)',
        card: 'var(--bg-card)',
        input: 'var(--bg-input)',
      },
    },
  },
  plugins: [],
}
