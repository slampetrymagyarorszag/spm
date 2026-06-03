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

// Üres dataset esetén nincs siteSettings dokumentum, ezért null is lehet a válasz.
// A hívók (pl. BaseLayout) kötelesek kezelni a null esetet.
export async function getSiteSettings(client: Fetcher): Promise<SiteSettings | null> {
  return (await client.fetch(SITE_SETTINGS_QUERY)) as SiteSettings | null;
}
