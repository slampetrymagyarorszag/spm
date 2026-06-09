import { defineField, defineType } from 'sanity';

// Látogató által beküldött slammer-jelentkezés. A szerkesztő a Studióban elbírálja,
// és az „Jóváhagyva" kapcsolóval megjeleníti a Slammerek oldalon (Közösségi beküldések).
export const slammerApplication = defineType({
  name: 'slammerApplication',
  title: 'Beküldött slammer',
  type: 'document',
  fields: [
    defineField({ name: 'realName', title: 'Név', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'stageName', title: 'Művésznév', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'photo', title: 'Fotó', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'description', title: 'Bemutatkozás', type: 'text', rows: 4 }),
    defineField({ name: 'youtubeUrl', title: 'YouTube link', type: 'url' }),
    defineField({ name: 'submitterEmail', title: 'Beküldő email', type: 'string', readOnly: true }),
    defineField({ name: 'submittedAt', title: 'Beküldve', type: 'datetime', readOnly: true }),
    defineField({
      name: 'approved',
      title: 'Jóváhagyva — megjelenhet az oldalon',
      type: 'boolean',
      initialValue: false,
      description:
        'Kapcsold BE, hogy a beküldés megjelenjen a Slammerek oldalon. Előtte nézd át a tartalmat (sértő/valótlan tartalmat ne tegyél közzé) — jogunkban áll nem kirakni.',
    }),
  ],
  orderings: [{ title: 'Legújabb', name: 'newest', by: [{ field: 'submittedAt', direction: 'desc' }] }],
  preview: {
    select: { title: 'stageName', realName: 'realName', media: 'photo', approved: 'approved' },
    prepare: ({ title, realName, media, approved }: any) => ({
      title: title || realName || 'Beküldött slammer',
      subtitle: (approved ? '✅ Jóváhagyva' : '⏳ Elbírálásra vár') + (realName ? ` · ${realName}` : ''),
      media,
    }),
  },
});
