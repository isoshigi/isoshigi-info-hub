import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const commonSchema = z.object({
  title: z.string(),
  description: z.string().max(200, { message: 'descriptionは200文字以内にしてください' }),
  publishedAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  tags: z.array(z.string()).optional().transform((tags) => {
    if (!tags) return undefined;
    const filtered = tags.filter((t) => t.trim() !== '');
    return [...new Set(filtered)];
  }),
  draft: z.boolean().default(false),
  coverImage: z.string().optional(),
});

const articles = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/articles' }),
  schema: commonSchema.extend({
    series: z.string().optional(),
    seriesOrder: z.number().optional(),
  }),
});

const events = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/events' }),
  schema: commonSchema.extend({
    eventName: z.string(),
    eventDate: z.coerce.date(),
    location: z.enum(['online', 'offline']).optional(),
  }),
});

export const collections = { articles, events };
