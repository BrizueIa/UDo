import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        tailwindcss({
          content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
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
                },
              },
              fontFamily: {
                sans: [
                  'Inter',
                  '-apple-system',
                  'BlinkMacSystemFont',
                  'Segoe UI',
                  'Roboto',
                  'sans-serif',
                ],
                mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
              },
            },
          },
          plugins: [],
        }),
        autoprefixer(),
      ],
    },
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
  envPrefix: ['VITE_', 'TAURI_ENV_*'],
  build: {
    target: process.env.TAURI_ENV_PLATFORM == 'windows' ? 'chrome105' : 'safari13',
    minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
});
