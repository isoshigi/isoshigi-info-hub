import { getCollection, type CollectionEntry } from 'astro:content';
import { filterDrafts } from './draftFilter';
import type { ContentType } from './types';

export type ContentEntry = {
  entry: CollectionEntry<'articles'> | CollectionEntry<'scraps'> | CollectionEntry<'slides'> | CollectionEntry<'stories'>;
  type: ContentType;
  href: string;
};

export async function getAllContents(): Promise<ContentEntry[]> {
  const [articles, scraps, slides, stories] = await Promise.all([
    getCollection('articles', filterDrafts),
    getCollection('scraps', filterDrafts),
    getCollection('slides', filterDrafts),
    getCollection('stories', filterDrafts),
  ]);

  return [
    ...articles.map((entry) => ({ entry, type: 'article' as const, href: `/articles/${entry.id}` })),
    ...scraps.map((entry) => ({ entry, type: 'scrap' as const, href: `/scraps/${entry.id}` })),
    ...slides.map((entry) => ({ entry, type: 'slide' as const, href: `/slides/${entry.id}` })),
    ...stories.map((entry) => ({ entry, type: 'story' as const, href: `/stories/${entry.id}` })),
  ].sort((a, b) => b.entry.data.publishedAt.getTime() - a.entry.data.publishedAt.getTime());
}
