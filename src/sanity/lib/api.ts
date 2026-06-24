import { SITE_SETTINGS_QUERY } from './queries';

export type SiteSettings = {
  title: string;
  accentColor?: string;
  contactEmail?: string;
  logoUrl?: string;
  nav?: { label: string; href: string }[];
  social?: { facebook?: string; youtube?: string; instagram?: string; tiktok?: string };
  impressum?: { orgName?: string; address?: string; email?: string; taxNumber?: string; annualReportsUrl?: string; annualReports?: { label?: string; fileUrl?: string }[] };
  home?: {
    heroSticker?: string; heroTitle?: string; heroLead?: string;
    primaryCtaLabel?: string; primaryCtaHref?: string;
    secondaryCtaLabel?: string; secondaryCtaHref?: string;
    heroStickerEn?: string; heroTitleEn?: string; heroLeadEn?: string;
    primaryCtaLabelEn?: string; secondaryCtaLabelEn?: string;
  };
  monthlyContest?: {
    enabled?: boolean;
    monthLabel?: string;
    buttonLabel?: string;
    intro?: string;
    opensAt?: string;
    closesAt?: string;
  };
  emails?: EmailSettings;
  championshipCtaEnabled?: boolean;
  championshipCtaLabel?: string;
  championshipCtaUrl?: string;
  championshipCtaFrom?: string;
  championshipCtaTo?: string;
};

export type EmailSettings = {
  generalEmail?: string;
  pressEmail?: string;
  applicationsEmail?: string;
  notifyEmail?: string;
  notifyOnSubmissions?: boolean;
};

// Csak a form-címzettek (szerver-oldali endpointokhoz, kis lekérdezés).
export async function getEmailSettings(client: Fetcher): Promise<EmailSettings> {
  return (await client.fetch(`*[_type == "siteSettings"][0].emails`)) ?? {};
}

type Fetcher = { fetch: (query: string, params?: Record<string, any>) => Promise<any> };

// Üres dataset esetén nincs siteSettings dokumentum, ezért null is lehet a válasz.
// A hívók (pl. BaseLayout) kötelesek kezelni a null esetet.
export async function getSiteSettings(client: Fetcher): Promise<SiteSettings | null> {
  return (await client.fetch(SITE_SETTINGS_QUERY)) as SiteSettings | null;
}

export type PostListItem = {
  _id: string; title: string; slug: string; publishedAt: string;
  author?: string; excerpt?: string; cover?: any;
  titleEn?: string; excerptEn?: string;
};
export type Seo = { metaTitle?: string; metaDescription?: string; shareImage?: any };
export type Post = PostListItem & { tags?: string[]; body?: any; bodyEn?: any; seo?: Seo };

import { POSTS_QUERY, POST_BY_SLUG_QUERY } from './queries';

export async function getPosts(client: Fetcher): Promise<PostListItem[]> {
  return (await client.fetch(POSTS_QUERY)) ?? [];
}
export async function getPostBySlug(client: Fetcher, slug: string): Promise<Post | null> {
  return (await client.fetch(POST_BY_SLUG_QUERY, { slug })) ?? null;
}

export type SlammerListItem = { _id: string; name: string; slug: string; hometown?: string; photo?: any; active?: boolean };
export type Slammer = SlammerListItem & { bio?: any; bioEn?: any; achievements?: string[]; videos?: string[]; social?: { facebook?: string; instagram?: string } };

import { SLAMMERS_QUERY, SLAMMER_BY_SLUG_QUERY, SLAMMERS_FEATURED_QUERY } from './queries';

export async function getSlammers(client: Fetcher): Promise<SlammerListItem[]> {
  return (await client.fetch(SLAMMERS_QUERY)) ?? [];
}
export async function getFeaturedSlammers(client: Fetcher): Promise<SlammerListItem[]> {
  return (await client.fetch(SLAMMERS_FEATURED_QUERY)) ?? [];
}
export async function getSlammerBySlug(client: Fetcher, slug: string): Promise<Slammer | null> {
  return (await client.fetch(SLAMMER_BY_SLUG_QUERY, { slug })) ?? null;
}

export type EventListItem = {
  _id: string; title: string; slug: string; startsAt: string;
  cover?: any; accentColor?: string; location?: { name?: string; address?: string; mapUrl?: string };
  titleEn?: string;
};
export type EventDetail = EventListItem & {
  description?: any; ticketUrl?: string; facebookEventUrl?: string;
  registrationEnabled?: boolean; championshipRegistration?: boolean; registrationDeadline?: string;
  performers?: { _id: string; name: string; slug: string; photo?: any }[];
  descriptionEn?: any;
};

import { EVENTS_QUERY, EVENT_BY_SLUG_QUERY } from './queries';

export async function getEvents(client: Fetcher): Promise<EventListItem[]> {
  return (await client.fetch(EVENTS_QUERY)) ?? [];
}
export async function getEventBySlug(client: Fetcher, slug: string): Promise<EventDetail | null> {
  return (await client.fetch(EVENT_BY_SLUG_QUERY, { slug })) ?? null;
}

export type MediaItem = {
  _id: string; title: string; kind: 'video' | 'playlist' | 'image' | 'album';
  youtubeUrl?: string; playlistUrl?: string; image?: any; albumUrl?: string; albumCover?: any; year?: number;
};
import { MEDIA_QUERY, MEDIA_CONFIG_QUERY } from './queries';
export async function getMedia(client: Fetcher): Promise<MediaItem[]> {
  return (await client.fetch(MEDIA_QUERY)) ?? [];
}

export type MediaConfig = {
  youtubePlaylists?: { title?: string; playlistId?: string }[];
  downloads?: { title: string; description?: string; url?: string; fileUrl?: string }[];
};
export async function getMediaConfig(client: Fetcher): Promise<MediaConfig> {
  return (await client.fetch(MEDIA_CONFIG_QUERY)) ?? {};
}

export type EventTip = { _id: string; eventName: string; description?: string; facebookUrl?: string };
import { EVENT_TIPS_QUERY, SLAMMER_APPLICATIONS_QUERY } from './queries';
export async function getEventTips(client: Fetcher): Promise<EventTip[]> {
  return (await client.fetch(EVENT_TIPS_QUERY)) ?? [];
}

export type SlammerApplication = { _id: string; realName?: string; stageName: string; description?: string; youtubeUrl?: string; photo?: any };
export async function getApprovedSlammerApplications(client: Fetcher): Promise<SlammerApplication[]> {
  return (await client.fetch(SLAMMER_APPLICATIONS_QUERY)) ?? [];
}

export type SlamClub = { _id: string; city: string; name?: string; facebookUrl: string };
import { SLAM_CLUBS_QUERY } from './queries';
export async function getSlamClubs(client: Fetcher): Promise<SlamClub[]> {
  return (await client.fetch(SLAM_CLUBS_QUERY)) ?? [];
}

export type PageDoc = { title: string; lead?: string; body?: any; titleEn?: string; leadEn?: string; bodyEn?: any; seo?: Seo };
import { PAGE_BY_SLUG_QUERY } from './queries';
export async function getPageBySlug(client: Fetcher, slug: string): Promise<PageDoc | null> {
  return (await client.fetch(PAGE_BY_SLUG_QUERY, { slug })) ?? null;
}
