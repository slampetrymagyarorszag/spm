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
  return (await client.fetch(POST_BY_SLUG_QUERY, { slug })) ?? null;
}

export type SlammerListItem = { _id: string; name: string; slug: string; hometown?: string; photo?: any };
export type Slammer = SlammerListItem & { bio?: any; achievements?: string[]; videos?: string[]; social?: { facebook?: string; instagram?: string } };

import { SLAMMERS_QUERY, SLAMMER_BY_SLUG_QUERY } from './queries';

export async function getSlammers(client: Fetcher): Promise<SlammerListItem[]> {
  return (await client.fetch(SLAMMERS_QUERY)) ?? [];
}
export async function getSlammerBySlug(client: Fetcher, slug: string): Promise<Slammer | null> {
  return (await client.fetch(SLAMMER_BY_SLUG_QUERY, { slug })) ?? null;
}

export type EventListItem = {
  _id: string; title: string; slug: string; startsAt: string;
  cover?: any; accentColor?: string; location?: { name?: string; address?: string; mapUrl?: string };
};
export type EventDetail = EventListItem & {
  description?: any; ticketUrl?: string; facebookEventUrl?: string;
  registrationEnabled?: boolean; registrationDeadline?: string;
  performers?: { _id: string; name: string; slug: string; photo?: any }[];
};

import { EVENTS_QUERY, EVENT_BY_SLUG_QUERY } from './queries';

export async function getEvents(client: Fetcher): Promise<EventListItem[]> {
  return (await client.fetch(EVENTS_QUERY)) ?? [];
}
export async function getEventBySlug(client: Fetcher, slug: string): Promise<EventDetail | null> {
  return (await client.fetch(EVENT_BY_SLUG_QUERY, { slug })) ?? null;
}

export type MediaItem = {
  _id: string; title: string; kind: 'video' | 'image' | 'album';
  youtubeUrl?: string; image?: any; albumUrl?: string; albumCover?: any; year?: number;
};
import { MEDIA_QUERY } from './queries';
export async function getMedia(client: Fetcher): Promise<MediaItem[]> {
  return (await client.fetch(MEDIA_QUERY)) ?? [];
}

export type PageDoc = { title: string; lead?: string; body?: any };
import { PAGE_BY_SLUG_QUERY } from './queries';
export async function getPageBySlug(client: Fetcher, slug: string): Promise<PageDoc | null> {
  return (await client.fetch(PAGE_BY_SLUG_QUERY, { slug })) ?? null;
}
