import { defineField, defineType } from 'sanity';

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Oldal beállítások',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Oldal címe', type: 'string', initialValue: 'Slam Poetry Magyarország' }),
    defineField({ name: 'logo', title: 'Logó', type: 'image' }),
    defineField({ name: 'accentColor', title: 'Alap accent szín (hex)', type: 'string', initialValue: '#b13bd6' }),
    defineField({
      name: 'nav',
      title: 'Főmenü',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          defineField({ name: 'label', title: 'Felirat', type: 'string' }),
          defineField({ name: 'href', title: 'Link', type: 'string' }),
        ],
      }],
    }),
    defineField({
      name: 'social',
      title: 'Közösségi linkek',
      type: 'object',
      fields: [
        defineField({ name: 'facebook', title: 'Facebook', type: 'url' }),
        defineField({ name: 'youtube', title: 'YouTube', type: 'url' }),
        defineField({ name: 'instagram', title: 'Instagram', type: 'url' }),
      ],
    }),
    defineField({ name: 'contactEmail', title: 'Kapcsolati email', type: 'string' }),
    defineField({
      name: 'impressum', title: 'Impresszum', type: 'object',
      description: 'A lábléc impresszum blokkja.',
      fields: [
        defineField({ name: 'orgName', title: 'Egyesület neve', type: 'string', initialValue: 'Slam Poetry Magyarország Egyesület' }),
        defineField({ name: 'address', title: 'Székhely / cím', type: 'text', rows: 2, description: 'Hol található az egyesület (székhely).' }),
        defineField({ name: 'taxNumber', title: 'Adószám / nyilvántartási szám (opcionális)', type: 'string' }),
        defineField({ name: 'annualReportsUrl', title: 'Éves beszámolók linkje', type: 'url', description: 'Link az egyesület éves beszámolóihoz.' }),
      ],
    }),
    defineField({ name: 'championshipCtaEnabled', title: 'Országos bajnokság CTA — bekapcsolva', type: 'boolean', initialValue: false }),
    defineField({ name: 'championshipCtaLabel', title: 'CTA felirat', type: 'string', initialValue: 'Jelentkezem az országos bajnokságra' }),
    defineField({ name: 'championshipCtaUrl', title: 'CTA cél (URL vagy /esemenyek/slug)', type: 'string' }),
    defineField({ name: 'championshipCtaFrom', title: 'CTA megjelenés -tól', type: 'datetime' }),
    defineField({ name: 'championshipCtaTo', title: 'CTA megjelenés -ig', type: 'datetime' }),
  ],
  preview: { prepare: () => ({ title: 'Oldal beállítások' }) },
});
