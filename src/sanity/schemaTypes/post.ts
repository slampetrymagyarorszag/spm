import { defineField, defineType } from 'sanity';

export const post = defineType({
  name: 'post',
  title: 'Hír / Blog',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Cím', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' }, validation: (r) => r.required() }),
    defineField({ name: 'publishedAt', title: 'Megjelenés', type: 'datetime', validation: (r) => r.required() }),
    defineField({ name: 'author', title: 'Szerző', type: 'string' }),
    defineField({ name: 'cover', title: 'Borítókép', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'excerpt', title: 'Bevezető', type: 'text', rows: 3 }),
    defineField({ name: 'tags', title: 'Címkék', type: 'array', of: [{ type: 'string' }], options: { layout: 'tags' } }),
    defineField({ name: 'body', title: 'Tartalom', type: 'blockContent' }),
  ],
  orderings: [{ title: 'Legújabb', name: 'newest', by: [{ field: 'publishedAt', direction: 'desc' }] }],
  preview: { select: { title: 'title', subtitle: 'publishedAt', media: 'cover' } },
});
