import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

export const hasExplicitTimezone = (value: string): boolean =>
  /(?:Z|[+-]\d{2}:\d{2})$/i.test(value);

export const clipSchema = z.object({
  title: z.string().trim().min(1),
  source: z.string().trim().min(1),
  author: z.string().trim().min(1).optional(),
  url: z.string().url().optional(),
  tags: z.array(z.string().trim().min(1)).default([]),
  createdAt: z.string().datetime({ offset: true }).refine(hasExplicitTimezone, {
    message: 'createdAt must include Z or an explicit timezone offset',
  }),
  private: z.boolean().default(false),
});

const clips = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/clips' }),
  schema: clipSchema,
});

export const collections = { clips };
