import { defineField, defineType } from 'sanity';
import { slugify } from '../lib/slugify';
export const event = defineType({
  name: 'event', title: 'Esemény', type: 'document',
  groups: [
    { name: 'main', title: 'Alapok', default: true },
    { name: 'details', title: 'Részletek (opcionális)' },
    { name: 'registration', title: 'Jelentkezés (opcionális)' },
  ],
  fields: [
    // — A legegyszerűbb felvitel: FB-link + cím + dátum —
    defineField({
      name: 'facebookEventUrl', title: 'Facebook esemény link', type: 'url', group: 'main',
      description: 'Illeszd be a Facebook-esemény linkjét. Az oldalon innen jelenik meg a beágyazott FB-eseménykártya (borító, leírás, „Érdekel" gomb) és egy gomb a Facebookra. Csak ezt és a dátumot kell megadni.',
    }),
    defineField({
      name: 'title', title: 'Cím', type: 'string', group: 'main', validation: (r) => r.required(),
      description: 'Rövid cím — ez jelenik meg a listában és a webcímben.',
    }),
    defineField({
      name: 'startsAt', title: 'Időpont', type: 'datetime', group: 'main', validation: (r) => r.required(),
      description: 'A dátum a „közelgő / korábbi" rendezéshez és a lista-kártyához kell.',
    }),
    defineField({ name: 'slug', title: 'Webcím (slug)', type: 'slug', group: 'main', options: { source: 'title', slugify }, validation: (r) => r.required() }),

    // — Opcionális részletek (a FB-beágyazás amúgy is mutatja ezeket) —
    defineField({ name: 'cover', title: 'Borítókép', type: 'image', group: 'details', options: { hotspot: true, metadata: ['blurhash', 'lqip', 'palette'] }, fields: [{ name: 'alt', type: 'string', title: 'Alt szöveg' }], description: 'Opcionális. Ha üresen hagyod, a FB-beágyazás viszi a borítót.' }),
    defineField({ name: 'location', title: 'Helyszín', type: 'location', group: 'details' }),
    defineField({ name: 'description', title: 'Leírás', type: 'blockContent', group: 'details', description: 'Opcionális saját leírás. A FB-beágyazás amúgy is mutatja a FB-leírást.' }),
    defineField({ name: 'titleEn', title: 'Cím (English)', type: 'string', group: 'details' }),
    defineField({ name: 'descriptionEn', title: 'Leírás (English)', type: 'blockContent', group: 'details' }),
    defineField({ name: 'performers', title: 'Fellépők', type: 'array', group: 'details', of: [{ type: 'reference', to: [{ type: 'slammer' }] }] }),
    defineField({ name: 'ticketUrl', title: 'Jegy URL', type: 'url', group: 'details' }),
    defineField({ name: 'accentColor', title: 'Esemény accent szín (hex)', type: 'string', group: 'details', description: 'Opcionális, pl. #b13bd6 — felülírja az oldal accent színét ennél az eseménynél.' }),

    // — Jelentkezés (országos bajnokság / Budapest Klub) —
    defineField({ name: 'registrationEnabled', title: 'Jelentkezés engedélyezve', type: 'boolean', group: 'registration', initialValue: false }),
    defineField({
      name: 'championshipRegistration', title: 'Országos bajnokság jelentkezés (speciális űrlap)', type: 'boolean', group: 'registration', initialValue: false,
      description: 'Ha be van kapcsolva (a „Jelentkezés engedélyezve” mellett), az eseményen a bajnoki jelentkezési űrlap jelenik meg: művésznév, eddigi eredmények, és melyik előválogató nap nem megfelelő.',
    }),
    defineField({ name: 'registrationEmail', title: 'Jelentkezés címzettje', type: 'string', group: 'registration', initialValue: 'contest@slampoetry.hu' }),
    defineField({ name: 'registrationDeadline', title: 'Jelentkezési határidő', type: 'datetime', group: 'registration' }),
  ],
  orderings: [{ title: 'Kezdés szerint', name: 'starts', by: [{ field: 'startsAt', direction: 'desc' }] }],
  preview: { select: { title: 'title', subtitle: 'startsAt', media: 'cover' } },
});
