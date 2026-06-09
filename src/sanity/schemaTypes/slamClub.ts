import { defineField, defineType } from 'sanity';

// Slam klub egy városban (pl. Slam Poetry Szeged) — a Slammerek oldal „Slam klubok"
// fülén jelenik meg, kattintható Facebook-linkkel. Látogatók is beküldhetnek újat;
// a szerkesztő a Studióban hagyja jóvá.
export const slamClub = defineType({
  name: 'slamClub',
  title: 'Slam klub',
  type: 'document',
  fields: [
    defineField({ name: 'city', title: 'Város', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'name', title: 'Klub neve', type: 'string', description: 'Pl. „Slam Poetry Szeged". Üresen hagyva a város jelenik meg.' }),
    defineField({ name: 'facebookUrl', title: 'Facebook (vagy más) link', type: 'url', validation: (r) => r.required() }),
    defineField({ name: 'submitterEmail', title: 'Beküldő email', type: 'string', readOnly: true }),
    defineField({ name: 'submittedAt', title: 'Beküldve', type: 'datetime', readOnly: true }),
    defineField({
      name: 'approved', title: 'Jóváhagyva — megjelenhet az oldalon', type: 'boolean', initialValue: false,
      description: 'Kapcsold BE, hogy a klub megjelenjen a Slammerek → Slam klubok fülön.',
    }),
  ],
  orderings: [{ title: 'Város szerint', name: 'city', by: [{ field: 'city', direction: 'asc' }] }],
  preview: {
    select: { title: 'city', name: 'name', approved: 'approved' },
    prepare: ({ title, name, approved }: any) => ({
      title: name || title || 'Slam klub',
      subtitle: (approved ? '✅ Jóváhagyva' : '⏳ Elbírálásra vár') + (title ? ` · ${title}` : ''),
    }),
  },
});
