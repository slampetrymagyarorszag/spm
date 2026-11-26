import { defineField, defineType } from 'sanity';
import { slugify } from '../lib/slugify';
export const page = defineType({
  name: 'page', title: 'Oldal', type: 'document',
  groups: [{"name": "content", "title": "Oldal szövege", "default": true}, {"name": "english", "title": "Angol változat"}, {"name": "sharing", "title": "Megosztás és keresők"}],
  fields: [
    defineField({ name: 'title', group: 'content', title: 'Cím', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', group: 'content', title: 'Webcím azonosítója', type: 'slug', options: { source: 'title', slugify }, validation: (r) => r.required() }),
    defineField({ name: 'lead', group: 'content', title: 'Bevezető', type: 'text', rows: 2 }),
    defineField({ name: 'body', group: 'content', title: 'Tartalom', type: 'blockContent' }),
    defineField({ name: 'titleEn', group: 'english', title: 'Cím (English)', type: 'string' }),
    defineField({ name: 'leadEn', group: 'english', title: 'Bevezető (English)', type: 'text', rows: 2 }),
    defineField({ name: 'bodyEn', group: 'english', title: 'Tartalom (English)', type: 'blockContent' }),
    defineField({ name: 'seo', group: 'sharing', title: 'SEO / megosztás', type: 'seo' }),
  ],
  preview: { select: { title: 'title', subtitle: 'slug.current' } },
});
