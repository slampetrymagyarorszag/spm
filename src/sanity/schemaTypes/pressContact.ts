import { defineField, defineType } from 'sanity';

// Sajtólista: újságírók / szerkesztőségek elérhetőségei a sajtóközlemények kiküldéséhez.
// A `source` mező azért kötelező, mert személyes adatot kezelünk: utólag is tudni kell,
// honnan került fel egy cím a listára.
export const pressContact = defineType({
  name: 'pressContact',
  title: 'Sajtókapcsolat',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Név', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'email', title: 'Email', type: 'string',
      validation: (r) => r.required().email(),
    }),
    defineField({ name: 'outlet', title: 'Orgánum / szerkesztőség', type: 'string' }),
    defineField({
      name: 'tags', title: 'Címkék', type: 'array', of: [{ type: 'string' }],
      options: { layout: 'tags' },
      description: 'Pl. „orszagos”, „kulturalis”, „helyi”. Kiküldéskor címke szerint szűrhetsz.',
    }),
    defineField({
      name: 'subscribed', title: 'Feliratkozva', type: 'boolean', initialValue: true,
      description: 'Ha a címzett leiratkozik, ez automatikusan kikapcsol — ne kapcsold vissza kézzel.',
    }),
    defineField({ name: 'unsubscribedAt', title: 'Leiratkozás ideje', type: 'datetime', readOnly: true }),
    defineField({
      name: 'source', title: 'Honnan van a cím?', type: 'string',
      description: 'Pl. „nyilvános szerkesztőségi cím”, „személyes egyeztetés”, „ő kérte”. Adatvédelmi okból fontos.',
      validation: (r) => r.required(),
    }),
    defineField({ name: 'note', title: 'Megjegyzés', type: 'text', rows: 2 }),
  ],
  orderings: [{ title: 'Név szerint', name: 'byName', by: [{ field: 'name', direction: 'asc' }] }],
  preview: {
    select: { title: 'name', outlet: 'outlet', subscribed: 'subscribed', email: 'email' },
    prepare: ({ title, outlet, subscribed, email }: any) => ({
      title: title || email,
      subtitle: [outlet, email, subscribed === false ? '⛔ leiratkozott' : null].filter(Boolean).join(' · '),
    }),
  },
});
