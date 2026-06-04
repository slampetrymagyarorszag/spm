import { defineField, defineType } from 'sanity';

export const slammer = defineType({
  name: 'slammer',
  title: 'Slammer',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Név', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'name' }, validation: (r) => r.required() }),
    defineField({ name: 'photo', title: 'Fotó', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'hometown', title: 'Város', type: 'string' }),
    defineField({ name: 'bio', title: 'Bemutatkozás', type: 'blockContent' }),
    defineField({ name: 'achievements', title: 'Eredmények', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'videos', title: 'Videók (YouTube URL)', type: 'array', of: [{ type: 'url' }] }),
    defineField({
      name: 'social', title: 'Közösségi linkek', type: 'object',
      fields: [
        defineField({ name: 'facebook', type: 'url', title: 'Facebook' }),
        defineField({ name: 'instagram', type: 'url', title: 'Instagram' }),
      ],
    }),
  ],
  preview: { select: { title: 'name', subtitle: 'hometown', media: 'photo' } },
});
