import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const rawBase = process.env.BASE_PATH || '/';
const base = rawBase === '/' ? '/' : `/${rawBase.replace(/^\/+|\/+$/g, '')}`;
const site = process.env.SITE_URL || 'http://localhost:4321';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  integrations: [sitemap()],
});
