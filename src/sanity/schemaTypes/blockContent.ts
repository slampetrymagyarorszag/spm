import { defineType, defineArrayMember } from 'sanity';

export const blockContent = defineType({
  name: 'blockContent',
  title: 'Szöveg',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        { title: 'Normál', value: 'normal' },
        { title: 'Cím', value: 'h2' },
        { title: 'Alcím', value: 'h3' },
        { title: 'Idézet', value: 'blockquote' },
      ],
      marks: {
        decorators: [
          { title: 'Félkövér', value: 'strong' },
          { title: 'Dőlt', value: 'em' },
        ],
        annotations: [
          { name: 'link', type: 'object', title: 'Link', fields: [{ name: 'href', type: 'url', title: 'URL' }] },
        ],
      },
    }),

    // Beágyazott kép — feltöltés, hotspot-kivágás, alt + képaláírás.
    defineArrayMember({
      type: 'image',
      name: 'image',
      title: 'Kép',
      options: { hotspot: true, metadata: ['blurhash', 'lqip', 'palette'] },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alt szöveg (akadálymentesség)',
          description: 'Rövid leírás a képről — vakok felolvasójának és a Google-nak.',
          validation: (r: any) => r.warning('Az alt szöveg fontos az akadálymentességhez és a SEO-hoz.'),
        },
        { name: 'caption', type: 'string', title: 'Képaláírás' },
      ],
    }),

    // YouTube videó beágyazása a szöveg közé.
    defineArrayMember({
      type: 'object',
      name: 'youtube',
      title: 'YouTube videó',
      fields: [
        {
          name: 'url',
          type: 'url',
          title: 'YouTube link',
          description: 'Illeszd be a videó linkjét (youtube.com/watch?... vagy youtu.be/...).',
          validation: (r: any) => r.required(),
        },
        { name: 'caption', type: 'string', title: 'Felirat (opcionális)' },
      ],
      preview: {
        select: { url: 'url', caption: 'caption' },
        prepare: ({ url, caption }: { url?: string; caption?: string }) => ({
          title: caption || 'YouTube videó',
          subtitle: url,
        }),
      },
    }),

    // Kiemelt doboz (callout / idézet / figyelmeztetés).
    defineArrayMember({
      type: 'object',
      name: 'callout',
      title: 'Kiemelt doboz',
      fields: [
        {
          name: 'tone',
          type: 'string',
          title: 'Stílus',
          options: {
            list: [
              { title: 'Kiemelés (accent)', value: 'accent' },
              { title: 'Idézet', value: 'quote' },
              { title: 'Információ', value: 'info' },
            ],
            layout: 'radio',
          },
          initialValue: 'accent',
        },
        { name: 'text', type: 'text', rows: 3, title: 'Szöveg', validation: (r: any) => r.required() },
        { name: 'attribution', type: 'string', title: 'Forrás / szerző (opcionális)' },
      ],
      preview: {
        select: { text: 'text', tone: 'tone' },
        prepare: ({ text, tone }: { text?: string; tone?: string }) => ({
          title: text || 'Kiemelt doboz',
          subtitle: `Doboz — ${tone ?? 'accent'}`,
        }),
      },
    }),

    // Gomb / CTA a szövegben.
    defineArrayMember({
      type: 'object',
      name: 'button',
      title: 'Gomb (CTA)',
      fields: [
        { name: 'label', type: 'string', title: 'Felirat', validation: (r: any) => r.required() },
        { name: 'href', type: 'url', title: 'Cél URL', validation: (r: any) => r.required().uri({ allowRelative: true, scheme: ['http', 'https', 'mailto', 'tel'] }) },
        {
          name: 'style',
          type: 'string',
          title: 'Megjelenés',
          options: { list: [{ title: 'Kitöltött (accent)', value: 'solid' }, { title: 'Körvonalas', value: 'outline' }], layout: 'radio' },
          initialValue: 'solid',
        },
      ],
      preview: {
        select: { label: 'label', href: 'href' },
        prepare: ({ label, href }: { label?: string; href?: string }) => ({ title: label || 'Gomb', subtitle: href }),
      },
    }),

    // Elválasztó vonal.
    defineArrayMember({
      type: 'object',
      name: 'divider',
      title: 'Elválasztó',
      fields: [{ name: 'note', type: 'string', hidden: true }],
      preview: { prepare: () => ({ title: '— Elválasztó vonal —' }) },
    }),
  ],
});
