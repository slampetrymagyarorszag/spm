import { defineField, defineType } from 'sanity';
import { slugify } from '../lib/slugify';

export const slammer = defineType({
  name: 'slammer',
  title: 'Slammer',
  type: 'document',
  groups: [{"name": "profile", "title": "Profil", "default": true}, {"name": "media", "title": "Videók és linkek"}, {"name": "homepage", "title": "Főoldali kiemelés"}, {"name": "english", "title": "Angol változat"}],
  fields: [
    defineField({ name: 'name', group: 'profile', title: 'Név', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', group: 'profile', title: 'Webcím azonosítója', type: 'slug', options: { source: 'name', slugify }, validation: (r) => r.required() }),
    defineField({
      name: 'photo', group: 'profile', title: 'Fotó', type: 'image',
      options: { hotspot: true, metadata: ['blurhash', 'lqip', 'palette'] },
      fields: [{ name: 'alt', type: 'string', title: 'Képleírás (akadálymentesség)' }],
    }),
    defineField({ name: 'hometown', group: 'profile', title: 'Város', type: 'string' }),
    defineField({
      name: 'active', group: 'profile', title: 'Aktív slammer', type: 'boolean', initialValue: false,
      description: 'Ha BE van kapcsolva, a Slammerek oldalon az „Aktív slammerek” csoportba kerül (ABC sorrendben, elöl). A slammer maga is jelezheti a profilján a „módosítás” űrlapon.',
    }),
    defineField({ name: 'featured', group: 'homepage', title: 'Kiemelt a főoldalon', type: 'boolean', initialValue: false, description: 'Bekapcsolva megjelenik a főoldal kiemelt slammer-galériájában (max 10).' }),
    defineField({ name: 'featuredOrder', group: 'homepage', title: 'Kiemelés sorrendje', type: 'number', description: 'Kisebb szám = előrébb. Üresen hagyva név szerint rendeződik.' }),
    defineField({ name: 'bio', group: 'profile', title: 'Bemutatkozás', type: 'blockContent' }),
    defineField({ name: 'bioEn', group: 'english', title: 'Bemutatkozás (English)', type: 'blockContent', description: 'Opcionális. Ha üres, az angol oldalon a magyar bio jelenik meg.' }),
    defineField({ name: 'achievements', group: 'profile', title: 'Eredmények', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'videos', group: 'media', title: 'Videók (YouTube URL)', type: 'array', of: [{ type: 'url' }] }),
    defineField({
      name: 'social', group: 'media', title: 'Közösségi linkek', type: 'object',
      fields: [
        defineField({ name: 'facebook', type: 'url', title: 'Facebook' }),
        defineField({ name: 'instagram', type: 'url', title: 'Instagram' }),
      ],
    }),
  ],
  preview: { select: { title: 'name', subtitle: 'hometown', media: 'photo' } },
});
