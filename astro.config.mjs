import { defineConfig } from 'astro/config';

// Archivo is self-hosted by hand (public/fonts, see global.css): Astro's fonts config drops the wdth axis.
export default defineConfig({
  output: 'static',
  vite: { server: { proxy: { '/api': 'http://localhost:8787' } } },
});
