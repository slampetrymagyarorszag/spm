import { defineField, defineType } from 'sanity';

// Látogató által beküldött slammer-jelentkezés. A szerkesztő a Studióban elbírálja,
// és az „Jóváhagyva" kapcsolóval megjeleníti a Slammerek oldalon (Közösségi beküldések).
export const slammerApplication = defineType({
  name: 'slammerApplication',
  title: 'Beküldött slammer',
  type: 'document',
  fields: [
    defineField({ name: 'realName', title: 'Név', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'stageName', title: 'Művésznév', type: 'string' }),
    defineField({ name: 'photo', title: 'Fotó', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'description', title: 'Bemutatkozás', type: 'text', rows: 4 }),
    defineField({ name: 'youtubeUrl', title: 'YouTube link', type: 'url' }),
    defineField({ name: 'submitterEmail', title: 'Beküldő email', type: 'string', readOnly: true }),
    defineField({ name: 'submittedAt', title: 'Beküldve', type: 'datetime', readOnly: true }),
    defineField({
      name: 'approved',
      title: 'Átnézve / rendben',
      type: 'boolean',
      initialValue: false,
      description:
        'Tartalmi ellenőrzés jelölésére. A közzétételhez használd a „Slammerré alakítás” gombot — az átteszi a beküldést a fő Slammerek bázisba, teljes szerkesztéssel.',
    }),
    defineField({
      name: 'promoted', title: 'Slammerré alakítva', type: 'boolean', readOnly: true, initialValue: false,
      description: 'A „Slammerré alakítás” gomb állítja be. Ha BE van, a beküldés már a fő bázisba került.',
    }),
    defineField({ name: 'promotedSlammerId', title: 'Létrehozott slammer azonosító', type: 'string', readOnly: true }),
  ],
  orderings: [{ title: 'Legújabb', name: 'newest', by: [{ field: 'submittedAt', direction: 'desc' }] }],
  preview: {
    select: { title: 'stageName', realName: 'realName', media: 'photo', promoted: 'promoted' },
    prepare: ({ title, realName, media, promoted }: any) => ({
      title: title || realName || 'Beküldött slammer',
      subtitle: (promoted ? '✅ Slammerré alakítva' : '⏳ Elbírálásra vár') + (realName && title ? ` · ${realName}` : ''),
      media,
    }),
  },
});
