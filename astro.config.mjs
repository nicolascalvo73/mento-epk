import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  build: {
    assets: '_assets',
  },
  image: {
    // Generate WebP and AVIF in build; serve responsive srcsets
    experimentalLayout: 'responsive',
  },
  vite: {
    css: {
      modules: {
        localsConvention: 'camelCase',
      },
    },
    // Chokidar's native fs events don't fire reliably for files under /mnt/c
    // (WSL <-> Windows filesystem), so HMR silently misses edits without this.
    server: {
      watch: {
        usePolling: true,
      },
    },
  },
});
