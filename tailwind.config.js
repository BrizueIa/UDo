/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        theme: {
          base: 'var(--color-bg-base)',
          sidebar: 'var(--color-bg-sidebar)',
          column: 'var(--color-bg-column)',
          card: 'var(--color-bg-card)',
          hover: 'var(--color-bg-hover)',
          border: 'var(--color-border)',
          text: 'var(--color-text-main)',
          muted: 'var(--color-text-muted)',
          accent: 'var(--color-accent)',
          'accent-glow': 'var(--color-accent-glow)',
          'accent-hover': 'var(--color-accent-hover)',
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif'
        ],
        mono: [
          'JetBrains Mono',
          'Fira Code',
          'monospace'
        ]
      }
    },
  },
  plugins: [],
}
