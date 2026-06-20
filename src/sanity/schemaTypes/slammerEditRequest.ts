import { defineField, defineType } from 'sanity';

// Egy slammer saját profiljáról beküldött módosítási kérés (bio, linkek, új fotó),
// vagy kérés, hogy ne szerepeljen az oldalon. A szerkesztő a Studióban átvezeti.
export const slammerEditRequest = defineType({
  name: 'slammerEditRequest',
  title: 'Slammer-módosítási kérés',
  type: 'document',
  fields: [
    defineField({ name: 'slammerName', title: 'Melyik slammer', type: 'string', readOnly: true }),
    defineField({ name: 'slammerSlug', title: 'Slammer slug', type: 'string', readOnly: true }),
    defineField({
      name: 'removeRequest', title: '❗ Kéri, hogy ne szerepeljen az oldalon', type: 'boolean', readOnly: true, initialValue: false,
    }),
    defineField({ name: 'bioChange', title: 'Kért bio-módosítás', type: 'text', rows: 5, readOnly: true }),
    defineField({ name: 'linksChange', title: 'Kért link-módosítás', type: 'text', rows: 3, readOnly: true }),
    defineField({ name: 'newPhoto', title: 'Beküldött új fotó', type: 'image', readOnly: true }),
    defineField({ name: 'submitterEmail', title: 'Beküldő email', type: 'string', readOnly: true }),
    defineField({ name: 'submittedAt', title: 'Beküldve', type: 'datetime', readOnly: true }),
    defineField({
      name: 'handled', title: 'Elintézve', type: 'boolean', initialValue: false,
      description: 'Kapcsold BE, ha a kért módosítást átvezetted a slammer profilján (vagy elintézted a kérést).',
    }),
  ],
  orderings: [{ title: 'Legújabb', name: 'newest', by: [{ field: 'submittedAt', direction: 'desc' }] }],
  preview: {
    select: { name: 'slammerName', remove: 'removeRequest', handled: 'handled', submittedAt: 'submittedAt', media: 'newPhoto' },
    prepare: ({ name, remove, handled, submittedAt, media }: any) => ({
      title: (remove ? '❗ ' : '') + (name || 'Slammer-módosítás'),
      subtitle:
        (handled ? '✅ Elintézve' : '⏳ Nyitott') +
        (remove ? ' · TÖRLÉST KÉR' : '') +
        (submittedAt ? ' · ' + new Date(submittedAt).toLocaleDateString('hu-HU') : ''),
      media,
    }),
  },
});
