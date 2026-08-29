import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { adminTagsPlugin } from './scripts/admin-tags-plugin.mjs';
import remarkRemoveFirstHeading from './scripts/remark-remove-first-heading.mjs';
import { rehypeExternalLinks } from './scripts/rehype-external-links.mjs';

const rawBase = process.env.BASE_PATH || '/';
const base = rawBase === '/' ? '/' : `/${rawBase.replace(/^\/+|\/+$/g, '')}`;
const site = process.env.SITE_URL || 'http://localhost:4321';

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  markdown: {
    remarkPlugins: [remarkRemoveFirstHeading],
    rehypePlugins: [rehypeExternalLinks],
  },
  vite: { plugins: [adminTagsPlugin()] },
});
