import { defineField, defineType } from 'sanity';
import { slugify } from '../lib/slugify';

export const post = defineType({
  name: 'post',
  title: 'Hír / Blog',
  type: 'document',
  groups: [{"name": "content", "title": "Hír szövege", "default": true}, {"name": "publish", "title": "Megjelenés"}, {"name": "english", "title": "Angol változat"}, {"name": "sharing", "title": "Megosztás és keresők"}],
  initialValue: () => ({ publishedAt: new Date().toISOString(), author: 'Slam Poetry Magyarország' }),
  fields: [
    defineField({ name: 'title', group: 'content', title: 'Cím', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', group: 'publish', title: 'Webcím azonosítója', type: 'slug', options: { source: 'title', slugify }, validation: (r) => r.required() }),
    defineField({ name: 'publishedAt', group: 'publish', title: 'Megjelenés', type: 'datetime', validation: (r) => r.required() }),
    defineField({ name: 'author', group: 'publish', title: 'Szerző', type: 'string' }),
    defineField({
      name: 'cover', group: 'content', title: 'Borítókép', type: 'image',
      options: { hotspot: true, metadata: ['blurhash', 'lqip', 'palette'] },
      fields: [{ name: 'alt', type: 'string', title: 'Képleírás (akadálymentesség)', description: 'Rövid leírás a képről.' }],
    }),
    defineField({ name: 'excerpt', group: 'content', title: 'Bevezető', type: 'text', rows: 3 }),
    defineField({ name: 'tags', group: 'publish', title: 'Címkék', type: 'array', of: [{ type: 'string' }], options: { layout: 'tags' } }),
    defineField({ name: 'body', group: 'content', title: 'Tartalom', type: 'blockContent' }),
    defineField({ name: 'titleEn', group: 'english', title: 'Cím (English)', type: 'string', description: 'Opcionális angol cím. Ha üres, az angol oldalon a magyar jelenik meg.' }),
    defineField({ name: 'excerptEn', group: 'english', title: 'Bevezető (English)', type: 'text', rows: 3 }),
    defineField({ name: 'bodyEn', group: 'english', title: 'Tartalom (English)', type: 'blockContent' }),
    defineField({ name: 'seo', group: 'sharing', title: 'SEO / megosztás', type: 'seo' }),
  ],
  orderings: [{ title: 'Legújabb', name: 'newest', by: [{ field: 'publishedAt', direction: 'desc' }] }],
  preview: { select: { title: 'title', date: 'publishedAt', media: 'cover' }, prepare: ({title,date,media}: any) => ({title: title || 'Cím nélkül', subtitle: date ? new Date(date).toLocaleString('hu-HU', {timeZone:'Europe/Budapest', dateStyle:'medium', timeStyle:'short'}) : 'Nincs időpont megadva', media}) },
});
