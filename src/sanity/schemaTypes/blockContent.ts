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
    defineArrayMember({ type: 'image', options: { hotspot: true } }),
  ],
});
