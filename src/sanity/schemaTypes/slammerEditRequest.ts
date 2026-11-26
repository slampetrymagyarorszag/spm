import { defineField, defineType } from 'sanity';
import { SlammerChangesInput } from '../components/SlammerChangesInput';

// Egy slammer saját profiljáról beküldött módosítási kérés (bio, linkek, új fotó),
// vagy kérés, hogy ne szerepeljen az oldalon. A szerkesztő a Studióban átvezeti.
export const slammerEditRequest = defineType({
  name: 'slammerEditRequest',
  title: 'Slammer-módosítási kérés',
  type: 'document',
  fieldsets: [{name:'original', title:'Eredeti beküldés és kapcsolati adatok', options:{collapsible:true,collapsed:true}}],
  fields: [
    defineField({ name: 'reviewControl', title: 'Változtatások átvezetése', type: 'string', components: { input: SlammerChangesInput } }),
    defineField({ name: 'slammer', title: 'Kapcsolódó profil', type: 'reference', weak: true, to: [{ type: 'slammer' }], readOnly: true, hidden: true }),
    ...['appliedAt', 'closedAt', 'appliedSlammerId'].map(name => defineField({ name, title: name, type: 'string', readOnly: true, hidden: true })),
    defineField({ name: 'appliedFields', title: 'Átvezetett mezők', type: 'array', of: [{ type: 'string' }], hidden: true, readOnly: true }),
    defineField({ name: 'slammerName', fieldset:'original', title: 'Melyik slammer', type: 'string', readOnly: true }),
    defineField({ name: 'slammerSlug', title: 'Profil címazonosítója', type: 'string', readOnly: true, hidden: true }),
    defineField({
      name: 'removeRequest', fieldset:'original', title: '❗ Kéri, hogy ne szerepeljen az oldalon', type: 'boolean', readOnly: true, initialValue: false,
    }),
    defineField({
      name: 'activeRequest', fieldset:'original', title: 'Aktív slammernek jelölte magát', type: 'boolean', readOnly: true, initialValue: false,
      description: 'A fenti összehasonlításnál jóváhagyható; üres jelölés nem kapcsolja ki a meglévő aktív státuszt.',
    }),
    defineField({ name: 'bioChange', fieldset:'original', title: 'Kért bio-módosítás', type: 'text', rows: 5, readOnly: true }),
    defineField({ name: 'linksChange', fieldset:'original', title: 'Kért link-módosítás', type: 'text', rows: 3, readOnly: true }),
    defineField({ name: 'videoLinks', fieldset:'original', title: 'Beküldött YouTube-linkek', type: 'array', of: [{ type: 'url' }], readOnly: true }),
    defineField({ name: 'newPhoto', fieldset:'original', title: 'Beküldött új fotó', type: 'image', readOnly: true }),
    defineField({ name: 'submitterEmail', fieldset:'original', title: 'Beküldő email', type: 'string', readOnly: true }),
    defineField({ name: 'submittedAt', fieldset:'original', title: 'Beküldve', type: 'datetime', readOnly: true }),
    defineField({
      name: 'handled', fieldset:'original', title: 'Lezárva', type: 'boolean', initialValue: false, readOnly: true,
      description: 'A fenti ellenőrző felületen történő átvezetés vagy lezárás automatikusan frissíti.',
    }),
  ],
  orderings: [{ title: 'Legújabb', name: 'newest', by: [{ field: 'submittedAt', direction: 'desc' }] }],
  preview: {
    select: { name: 'slammerName', fieldset:'original', remove: 'removeRequest', handled: 'handled', submittedAt: 'submittedAt', media: 'newPhoto' },
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
