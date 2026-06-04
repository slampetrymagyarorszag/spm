import { defineField, defineType } from 'sanity';
import { slugify } from '../lib/slugify';
export const event = defineType({
  name: 'event', title: 'Esemény', type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Cím', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title', slugify }, validation: (r) => r.required() }),
    defineField({ name: 'startsAt', title: 'Kezdés', type: 'datetime', validation: (r) => r.required() }),
    defineField({ name: 'cover', title: 'Borítókép', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'accentColor', title: 'Esemény accent szín (hex)', type: 'string' }),
    defineField({ name: 'location', title: 'Helyszín', type: 'location' }),
    defineField({ name: 'description', title: 'Leírás', type: 'blockContent' }),
    defineField({ name: 'performers', title: 'Fellépők', type: 'array', of: [{ type: 'reference', to: [{ type: 'slammer' }] }] }),
    defineField({ name: 'ticketUrl', title: 'Jegy URL', type: 'url' }),
    defineField({ name: 'facebookEventUrl', title: 'Facebook esemény URL', type: 'url' }),
    defineField({ name: 'registrationEnabled', title: 'Jelentkezés engedélyezve', type: 'boolean', initialValue: false }),
    defineField({ name: 'registrationEmail', title: 'Jelentkezés címzettje', type: 'string', initialValue: 'contest@slampoetry.hu' }),
    defineField({ name: 'registrationDeadline', title: 'Jelentkezési határidő', type: 'datetime' }),
  ],
  orderings: [{ title: 'Kezdés szerint', name: 'starts', by: [{ field: 'startsAt', direction: 'desc' }] }],
  preview: { select: { title: 'title', subtitle: 'startsAt', media: 'cover' } },
});
