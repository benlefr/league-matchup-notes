import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({
    onwarn: (warning, handler) => {
      // Ignore A11y warnings
      if (warning.code.startsWith('a11y-')) return;
      // Ignore unused CSS warnings
      if (warning.code === 'css-unused-selector') return;
      handler(warning);
    }
  })],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    copyPublicDir: false
  },
  publicDir: false,
  server: {
    port: 5173
  }
});
