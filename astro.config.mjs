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
  },
});
