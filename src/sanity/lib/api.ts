import { SITE_SETTINGS_QUERY } from './queries';

export type SiteSettings = {
  title: string;
  accentColor?: string;
  contactEmail?: string;
  logoUrl?: string;
  nav?: { label: string; href: string }[];
  social?: { facebook?: string; youtube?: string; instagram?: string };
};

type Fetcher = { fetch: (query: string, params?: Record<string, any>) => Promise<any> };

// Üres dataset esetén nincs siteSettings dokumentum, ezért null is lehet a válasz.
// A hívók (pl. BaseLayout) kötelesek kezelni a null esetet.
export async function getSiteSettings(client: Fetcher): Promise<SiteSettings | null> {
  return (await client.fetch(SITE_SETTINGS_QUERY)) as SiteSettings | null;
}

export type PostListItem = {
  _id: string; title: string; slug: string; publishedAt: string;
  author?: string; excerpt?: string; cover?: any;
};
export type Post = PostListItem & { tags?: string[]; body?: any };

import { POSTS_QUERY, POST_BY_SLUG_QUERY } from './queries';

export async function getPosts(client: Fetcher): Promise<PostListItem[]> {
  return (await client.fetch(POSTS_QUERY)) ?? [];
}
export async function getPostBySlug(client: Fetcher, slug: string): Promise<Post | null> {
  return (await (client as any).fetch(POST_BY_SLUG_QUERY, { slug })) ?? null;
}
