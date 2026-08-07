import { getCollection, type CollectionEntry } from 'astro:content';
import type { ContentType } from './types';
import { filterDrafts } from './draftFilter';

export type StoryCollection = 'articles' | 'slides' | 'stories';
export type StoryEntry =
  | CollectionEntry<'articles'>
  | CollectionEntry<'slides'>
  | CollectionEntry<'stories'>;

export type ResolvedFlowItem = {
  collection: StoryCollection;
  slug: string;
  type: ContentType;
  entry: StoryEntry;
  href: string;
};

const collectionToType: Record<StoryCollection, ContentType> = {
  articles: 'article',
  slides: 'slide',
  stories: 'story',
};

export async function resolveStoryFlow(
  flow: { collection: StoryCollection; slug: string }[],
  entryId: string,
): Promise<ResolvedFlowItem[]> {
  const [articles, slides, stories] = await Promise.all([
    getCollection('articles', filterDrafts),
    getCollection('slides', filterDrafts),
    getCollection('stories', filterDrafts),
  ]);

  const entryMap: Record<StoryCollection, Record<string, StoryEntry>> = {
    articles: Object.fromEntries(articles.map((e) => [e.id, e])),
    slides: Object.fromEntries(slides.map((e) => [e.id, e])),
    stories: Object.fromEntries(stories.map((e) => [e.id, e])),
  };

  return flow
    .map((item) => {
      const refEntry = entryMap[item.collection]?.[item.slug];
      if (!refEntry) {
        console.warn(`storyFlow: ${item.collection}/${item.slug} not found in story "${entryId}"`);
        return null;
      }
      return {
        ...item,
        type: collectionToType[item.collection],
        entry: refEntry,
        href: `/${item.collection}/${item.slug}`,
      };
    })
    .filter((item): item is ResolvedFlowItem => item !== null);
}
