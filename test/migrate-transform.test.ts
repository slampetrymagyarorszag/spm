import { describe, it, expect } from 'vitest';
import { decodeEntities, stripHtml, htmlToPortableText, mapPost, mapPage } from '../scripts/migrate/transform.mjs';

describe('decodeEntities', () => {
  it('HTML entitásokat dekódol', () => {
    expect(decodeEntities('Cím &#8211; alc&iacute;m &amp; t&ouml;bb')).toBe('Cím – alcím & több');
  });
});

describe('stripHtml', () => {
  it('eltávolítja a tageket és dekódol', () => {
    expect(stripHtml('<p>Hell&oacute; <b>vil&aacute;g</b></p>').trim()).toBe('Helló világ');
  });
});

describe('htmlToPortableText', () => {
  it('bekezdéseket portable text blokká alakít', () => {
    const blocks = htmlToPortableText('<p>Első bekezdés.</p><p>Második.</p>');
    expect(Array.isArray(blocks)).toBe(true);
    expect(blocks.length).toBeGreaterThanOrEqual(2);
    expect(blocks[0]._type).toBe('block');
    const text = blocks[0].children.map((c) => c.text).join('');
    expect(text).toContain('Első bekezdés');
  });
  it('üres HTML-re üres tömböt ad', () => {
    expect(htmlToPortableText('')).toEqual([]);
    expect(htmlToPortableText('   ')).toEqual([]);
  });
});

describe('mapPost', () => {
  const wp = {
    id: 42, slug: 'teszt-cikk', date: '2019-10-29T10:00:00',
    title: { rendered: 'Teszt &#8211; cikk' },
    excerpt: { rendered: '<p>Kivonat sz&ouml;veg.</p>' },
    content: { rendered: '<p>Törzs.</p>' },
    _embedded: { author: [{ name: 'Bíró Dénes' }] },
  };
  it('a WP postot Sanity post dokumentummá képezi', () => {
    const doc = mapPost(wp);
    expect(doc._id).toBe('wp-post-42');
    expect(doc._type).toBe('post');
    expect(doc.title).toBe('Teszt – cikk');
    expect(doc.slug).toEqual({ _type: 'slug', current: 'teszt-cikk' });
    expect(doc.publishedAt).toBe('2019-10-29T10:00:00');
    expect(doc.author).toBe('Bíró Dénes');
    expect(doc.excerpt).toContain('Kivonat');
    expect(Array.isArray(doc.body)).toBe(true);
  });
});

describe('mapPage', () => {
  it('a WP oldalt Sanity page dokumentummá képezi', () => {
    const doc = mapPage({ id: 7, slug: 'egyesulet', title: { rendered: 'Egyes&uuml;let' }, content: { rendered: '<p>Rólunk.</p>' }, excerpt: { rendered: '' } });
    expect(doc._id).toBe('wp-page-7');
    expect(doc._type).toBe('page');
    expect(doc.title).toBe('Egyesület');
    expect(doc.slug).toEqual({ _type: 'slug', current: 'egyesulet' });
    expect(Array.isArray(doc.body)).toBe(true);
  });
});
