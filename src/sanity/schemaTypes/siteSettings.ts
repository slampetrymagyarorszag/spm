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
  ],
  preview: { prepare: () => ({ title: 'Oldal beállítások' }) },
});
