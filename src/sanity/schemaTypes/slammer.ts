import { defineField, defineType } from 'sanity';
import { slugify } from '../lib/slugify';

export const slammer = defineType({
  name: 'slammer',
  title: 'Slammer',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Név', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'name', slugify }, validation: (r) => r.required() }),
    defineField({
      name: 'photo', title: 'Fotó', type: 'image',
      options: { hotspot: true, metadata: ['blurhash', 'lqip', 'palette'] },
      fields: [{ name: 'alt', type: 'string', title: 'Alt szöveg (akadálymentesség)' }],
    }),
    defineField({ name: 'hometown', title: 'Város', type: 'string' }),
    defineField({ name: 'featured', title: 'Kiemelt a főoldalon', type: 'boolean', initialValue: false, description: 'Bekapcsolva megjelenik a főoldal kiemelt slammer-galériájában (max 10).' }),
    defineField({ name: 'featuredOrder', title: 'Kiemelés sorrendje', type: 'number', description: 'Kisebb szám = előrébb. Üresen hagyva név szerint rendeződik.' }),
    defineField({ name: 'bio', title: 'Bemutatkozás', type: 'blockContent' }),
    defineField({ name: 'bioEn', title: 'Bemutatkozás (English)', type: 'blockContent', description: 'Opcionális. Ha üres, az angol oldalon a magyar bio jelenik meg.' }),
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
