import { describe, expect, it } from 'vitest';
import { buildSitemap, buildRss, buildLlmsFull, serializeJsonLd, articleAuthor } from '../src/lib/discovery';
const docs = [
  { _type: 'post', title: 'Eredmény & beszámoló', slug: 'eredmeny', publishedAt: '2026-11-25T12:00:00Z', _updatedAt: '2026-11-26T10:00:00Z', excerpt: 'A <döntő> összefoglalója.' },
  { _type: 'event', title: 'Decemberi klub', slug: 'decemberi-klub', startsAt: '2026-12-02T18:00:00Z', _updatedAt: '2026-11-26T10:00:00Z' },
  { _type: 'slammer', name: 'Gyenge Veroni', slug: 'gyenge-veroni' },
];
describe('public discovery feeds', () => {
  it('includes detail URLs in both languages with real modification times', () => {
    const xml = buildSitemap(docs);
    expect(xml).toContain('https://slampoetry.hu/hirek/eredmeny');
    expect(xml).toContain('https://slampoetry.hu/en/esemenyek/decemberi-klub');
    expect(xml).toContain('https://slampoetry.hu/slammerek/gyenge-veroni');
    expect(xml).toContain('<lastmod>2026-11-26T10:00:00Z</lastmod>');
    expect(xml).not.toContain('/admin');
    expect(xml).not.toContain('formSubmission');
    expect(xml).not.toContain('/impresszum');
  });
  it('excludes private and invalid document types even if provided accidentally', () => {
    const xml = buildSitemap([{ _type: 'formSubmission', slug: 'private' }, { _type: 'post', slug: '../admin' }]);
    expect(xml).not.toContain('private');
    expect(xml).not.toContain('../admin');
  });
  it('escapes XML, keeps dates, and only emits news in RSS', () => {
    const rss = buildRss(docs);
    expect(rss).toContain('Eredmény &amp; beszámoló');
    expect(rss).toContain('A &lt;döntő&gt; összefoglalója.');
    expect(rss).toContain('<pubDate>Wed, 25 Nov 2026 12:00:00 GMT</pubDate>');
    expect(rss).not.toContain('Decemberi klub');
  });
  it('gives a bounded source-linked overview of current public content', () => {
    const text = buildLlmsFull(docs);
    expect(text).toContain('https://slampoetry.hu/hirek/eredmeny');
    expect(text).toContain('2026-12-02T18:00:00Z');
    expect(text).not.toContain('undefined');
    expect(text.length).toBeLessThan(60000);
  });
});
it('prevents CMS text from closing a JSON-LD script element', () => {
  const output = serializeJsonLd({ name: '</script><script>alert(1)</script>' });
  expect(output).not.toContain('<');
  expect(JSON.parse(output).name).toContain('</script>');
});
it('identifies the editorial organization as Organization and named people as Person', () => {
  expect(articleAuthor('Slam Poetry Magyarország')).toMatchObject({ '@type': 'Organization' });
  expect(articleAuthor('Mészáros Péter')).toEqual({ '@type': 'Person', name: 'Mészáros Péter' });
});
