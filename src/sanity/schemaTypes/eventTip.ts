import { defineField, defineType } from 'sanity';

// Látogatók által beküldött esemény-tipp. A szerkesztő a Studióban elbírálja,
// és az „Jóváhagyva" kapcsolóval megjeleníti az oldalon (Események → Közösségi tippek).
export const eventTip = defineType({
  name: 'eventTip',
  title: 'Beküldött esemény',
  type: 'document',
  fields: [
    defineField({ name: 'eventName', title: 'Rendezvény neve', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'description', title: 'Leírás', type: 'text', rows: 3 }),
    defineField({ name: 'facebookUrl', title: 'Facebook esemény link', type: 'url' }),
    defineField({ name: 'submitterEmail', title: 'Beküldő email', type: 'string', readOnly: true, description: 'A beküldő által megadott email (opcionális volt).' }),
    defineField({ name: 'submittedAt', title: 'Beküldve', type: 'datetime', readOnly: true }),
    defineField({
      name: 'approved',
      title: 'Jóváhagyva — megjelenhet az oldalon',
      type: 'boolean',
      initialValue: false,
      description: 'Kapcsold BE, hogy a tipp megjelenjen az Események oldalon a „Közösségi tippek" között. Előtte nyugodtan javítsd a nevet/leírást.',
    }),
  ],
  orderings: [{ title: 'Legújabb', name: 'newest', by: [{ field: 'submittedAt', direction: 'desc' }] }],
  preview: {
    select: { title: 'eventName', approved: 'approved', submittedAt: 'submittedAt' },
    prepare: ({ title, approved, submittedAt }: { title?: string; approved?: boolean; submittedAt?: string }) => ({
      title: title || 'Beküldött esemény',
      subtitle:
        (approved ? '✅ Jóváhagyva' : '⏳ Elbírálásra vár') +
        (submittedAt ? ' · ' + new Date(submittedAt).toLocaleDateString('hu-HU') : ''),
    }),
  },
});
