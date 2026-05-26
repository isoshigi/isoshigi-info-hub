import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
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
  schema: commonSchema,
});

const scraps = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/scraps' }),
  schema: commonSchema,
});

const slides = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/slides' }),
  schema: commonSchema.extend({
    theme: z.string().optional(),
  }),
});

const stories = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/stories' }),
  schema: commonSchema.extend({
    storyFlow: z.array(z.object({
      collection: z.enum(['articles', 'slides', 'stories']),
      slug: z.string(),
    })).min(1),
  }),
});

export const collections = { articles, scraps, slides, stories };
