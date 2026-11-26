export const SITE_URL = 'https://slampoetry.hu';
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const DISCOVERY_QUERY = `*[
  !(_id in path("drafts.**")) && defined(slug.current) && (
    (_type == "post" && publishedAt <= now()) ||
    (_type == "event" && (!defined(showFrom) || showFrom <= now())) ||
    _type == "slammer"
  )
] | order(_updatedAt desc)[0...1000]{_type, title, titleEn, name, "slug":slug.current, _updatedAt, publishedAt, startsAt, excerpt}`;

export type DiscoveryDocument = {
  _type: string; slug: string; title?: string; titleEn?: string; name?: string;
  _updatedAt?: string; publishedAt?: string; startsAt?: string; excerpt?: string;
};
const routes = ['', 'mi-az-a-slam-poetry', 'esemenyek', 'slammerek', 'slam-klubok', 'hirek', 'mediatar', 'oktatas', 'egyesulet', 'kapcsolat'];
const sections: Record<string, string> = { post: 'hirek', event: 'esemenyek', slammer: 'slammerek' };
export const xmlEscape = (value: string) => value.replace(/[<>&"']/g, char => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[char]!));
const publicDocuments = (docs: DiscoveryDocument[]) => docs.filter(doc => sections[doc._type] && typeof doc.slug === 'string' && /^[\p{L}\p{N}_-]+$/u.test(doc.slug));
const documentUrl = (doc: DiscoveryDocument) => `${SITE_URL}/${sections[doc._type]}/${encodeURIComponent(doc.slug)}`;
const timestamp = (value?: string) => value && /(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value)) ? value : undefined;

export function buildSitemap(docs: DiscoveryDocument[]): string {
  const entries = new Map<string, string | undefined>(routes.map(path => [path ? `/${path}` : '/', undefined]));
  for (const doc of publicDocuments(docs)) entries.set(`/${sections[doc._type]}/${encodeURIComponent(doc.slug)}`, timestamp(doc._updatedAt));
  const xml = [...entries].flatMap(([path, lastmod]) => {
    const hu = `${SITE_URL}${path}`;
    const en = `${SITE_URL}/en${path === '/' ? '' : path}`;
    const alternatives = `<xhtml:link rel="alternate" hreflang="hu" href="${xmlEscape(hu)}"/><xhtml:link rel="alternate" hreflang="en" href="${xmlEscape(en)}"/>`;
    return [hu, en].map(url => `<url><loc>${xmlEscape(url)}</loc>${lastmod ? `<lastmod>${xmlEscape(lastmod)}</lastmod>` : ''}${alternatives}</url>`);
  }).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${xml}</urlset>`;
}

export function buildRss(docs: DiscoveryDocument[]): string {
  const items = publicDocuments(docs).filter(doc => doc._type === 'post')
    .sort((a, b) => String(b.publishedAt ?? '').localeCompare(String(a.publishedAt ?? ''))).slice(0, 30)
    .map(doc => `<item><title>${xmlEscape(doc.title || '')}</title><link>${xmlEscape(documentUrl(doc))}</link><guid isPermaLink="true">${xmlEscape(documentUrl(doc))}</guid><description>${xmlEscape(doc.excerpt || '')}</description>${timestamp(doc.publishedAt) ? `<pubDate>${new Date(doc.publishedAt!).toUTCString()}</pubDate>` : ''}</item>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Slam Poetry Magyarország – Hírek</title><link>${SITE_URL}/hirek</link><description>Az SPM hivatalos hírei és beszámolói.</description><language>hu</language>${items}</channel></rss>`;
}

export function buildLlmsFull(docs: DiscoveryDocument[]): string {
  const visible = publicDocuments(docs);
  const news = visible.filter(d => d._type === 'post').sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt))).slice(0, 30);
  const events = visible.filter(d => d._type === 'event').sort((a, b) => String(b.startsAt).localeCompare(String(a.startsAt))).slice(0, 20);
  const profiles = visible.filter(d => d._type === 'slammer').sort((a, b) => String(a.name).localeCompare(String(b.name), 'hu')).slice(0, 200);
  const section = (title: string, items: DiscoveryDocument[]) => `## ${title}\n\n${items.map(d => `- [${String(d.title || d.name || '').replace(/[\r\n]/g, ' ').slice(0, 240)}](${documentUrl(d)})${d.publishedAt || d.startsAt ? ` — ${d.publishedAt || d.startsAt}` : ''}${d.excerpt ? `\n  ${d.excerpt.replace(/[\r\n]/g, ' ').slice(0, 500)}` : ''}`).join('\n')}\n\n`;
  return ('# Slam Poetry Magyarország — nyilvános tartalomjegyzék\n\n' +
    '> A slampoetry.hu hivatalos, publikált híreinek, eseményeinek és slammerprofiljainak kivonata. A teljes és aktuális információ az egyes forrásoldalakon található.\n\n' +
    `Webhelykalauz: ${SITE_URL}/llms.txt\nSitemap: ${SITE_URL}/sitemap-index.xml\nHírfolyam: ${SITE_URL}/rss.xml\n\n` +
    section('Legfrissebb hírek', news) + section('Események', events) + section('Slammerek', profiles)).slice(0, 60000);
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export function articleAuthor(name: string) {
  return name === 'Slam Poetry Magyarország'
    ? { '@type': 'Organization', '@id': ORGANIZATION_ID, name }
    : { '@type': 'Person', name };
}
