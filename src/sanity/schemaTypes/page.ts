import { defineField, defineType } from 'sanity';
import { slugify } from '../lib/slugify';
export const page = defineType({
  name: 'page', title: 'Oldal', type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Cím', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title', slugify }, validation: (r) => r.required() }),
    defineField({ name: 'lead', title: 'Bevezető', type: 'text', rows: 2 }),
    defineField({ name: 'body', title: 'Tartalom', type: 'blockContent' }),
  ],
  preview: { select: { title: 'title', subtitle: 'slug.current' } },
});
