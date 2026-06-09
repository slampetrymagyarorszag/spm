import { defineField, defineType } from 'sanity';

// Opcionális, per-dokumentum SEO-felülírás. Ha üresen marad, a frontend az
// automatikus értékeket használja (cím, bevezető/excerpt, borítókép).
export const seo = defineType({
  name: 'seo',
  title: 'SEO / megosztás (opcionális)',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  description: 'Csak akkor töltsd ki, ha felül akarod írni az automatikus értékeket.',
  fields: [
    defineField({
      name: 'metaTitle',
      title: 'Meta cím',
      type: 'string',
      description: 'A böngészőfül és a Google-találat címe. Üresen hagyva a dokumentum címe.',
      validation: (r) => r.max(70).warning('A 60–70 karakter alatti cím a legjobb a Google-ban.'),
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta leírás',
      type: 'text',
      rows: 2,
      description: 'A Google-találat és a közösségi megosztás leírása.',
      validation: (r) => r.max(160).warning('A 150–160 karakter alatti leírás a legjobb.'),
    }),
    defineField({
      name: 'shareImage',
      title: 'Megosztókép (OG kép)',
      type: 'image',
      options: { hotspot: true },
      description: 'Facebookon/Twitteren megjelenő kép. Üresen hagyva a borítókép vagy az oldal alap-képe.',
    }),
  ],
});
