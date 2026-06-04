import he from 'he';
const { decode } = he;
import { Schema } from '@sanity/schema';
import { htmlToBlocks } from '@sanity/block-tools';
import { JSDOM } from 'jsdom';

export function decodeEntities(s = '') {
  return decode(String(s)).replace(/ /g, ' ').trim();
}

export function stripHtml(s = '') {
  const text = String(s).replace(/<[^>]*>/g, '');
  return decodeEntities(text);
}

// Minimális blockContent séma a block-tools-hoz (standard block + image).
const schema = Schema.compile({
  name: 'migrate',
  types: [{ name: 'blockContent', type: 'array', of: [{ type: 'block' }, { type: 'image' }] }],
});
const blockContentType = schema.get('blockContent');

export function htmlToPortableText(html = '') {
  if (!html || !html.trim()) return [];
  return htmlToBlocks(html, blockContentType, {
    parseHtml: (h) => new JSDOM(h).window.document,
    // inline képeket elhagyjuk (a block-tools alapból kép-deserializer nélkül kihagyja az <img>-t)
  });
}

export function mapPost(wp) {
  return {
    _id: `wp-post-${wp.id}`,
    _type: 'post',
    title: decodeEntities(wp.title?.rendered ?? ''),
    slug: { _type: 'slug', current: wp.slug },
    publishedAt: wp.date,
    author: wp._embedded?.author?.[0]?.name ?? undefined,
    excerpt: stripHtml(wp.excerpt?.rendered ?? '').slice(0, 300) || undefined,
    body: htmlToPortableText(wp.content?.rendered ?? ''),
  };
}

export function mapPage(wp) {
  return {
    _id: `wp-page-${wp.id}`,
    _type: 'page',
    title: decodeEntities(wp.title?.rendered ?? ''),
    slug: { _type: 'slug', current: wp.slug },
    lead: stripHtml(wp.excerpt?.rendered ?? '').slice(0, 200) || undefined,
    body: htmlToPortableText(wp.content?.rendered ?? ''),
  };
}

// YouTube videó-URL-ek kinyerése a tartalom HTML-jéből (iframe src / link / youtu.be).
export function extractYouTubeUrls(html = '') {
  const ids = new Set();
  const re = /(?:youtube(?:-nocookie)?\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([A-Za-z0-9_-]{11})/g;
  let m;
  while ((m = re.exec(String(html))) !== null) ids.add(m[1]);
  return [...ids].map((id) => `https://www.youtube.com/watch?v=${id}`);
}

export function mapSlammer(wp) {
  const videos = extractYouTubeUrls(wp.content?.rendered ?? '');
  return {
    _id: `wp-slammer-${wp.id}`,
    _type: 'slammer',
    name: decodeEntities(wp.title?.rendered ?? ''),
    slug: { _type: 'slug', current: wp.slug },
    bio: htmlToPortableText(wp.content?.rendered ?? ''),
    ...(videos.length ? { videos } : {}),
  };
}
