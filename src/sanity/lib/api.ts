import { SITE_SETTINGS_QUERY } from './queries';

export type SiteSettings = {
  title: string;
  accentColor?: string;
  contactEmail?: string;
  logoUrl?: string;
  nav?: { label: string; href: string }[];
  social?: { facebook?: string; youtube?: string; instagram?: string };
};

type Fetcher = { fetch: (query: string) => Promise<any> };

export async function getSiteSettings(client: Fetcher): Promise<SiteSettings> {
  return (await client.fetch(SITE_SETTINGS_QUERY)) as SiteSettings;
}
