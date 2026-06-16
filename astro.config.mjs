// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  output: "static",
  site: "https://kiez-power.de",
  base: "/",
  integrations: [sitemap()],
});
