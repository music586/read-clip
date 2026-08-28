import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const clips = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/clips',
    generateId: ({ entry }) => entry.replace(/\\/g, '/'),
  }),
});

export const collections = { clips };
