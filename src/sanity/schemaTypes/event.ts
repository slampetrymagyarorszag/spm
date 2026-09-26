import { defineField, defineType } from 'sanity';
import { slugify } from '../lib/slugify';
import { FacebookEventCoverInput } from '../components/FacebookEventCoverInput';
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
      description: 'A linkből az oldalon Facebookra vezető gomb készül. A borítót és a leírást NEM emeli át automatikusan: ezeket külön add meg lent.',
    }),
    defineField({
      name: 'title', title: 'Cím', type: 'string', group: 'main', validation: (r) => r.required(),
      description: 'Rövid cím — ez jelenik meg a listában és a webcímben.',
    }),
    defineField({
      name: 'startsAt', title: 'Időpont', type: 'datetime', group: 'main', validation: (r) => r.required(),
      description: 'A dátum a „közelgő / korábbi" rendezéshez és a lista-kártyához kell.',
    }),
    defineField({
      name: 'showFrom', title: 'Megjelenés az oldalon ettől', type: 'datetime', group: 'main',
      description: 'Üresen hagyva a publikált esemény azonnal látszik. Későbbi dátummal előre felviheted például a következő havi klubot: a nyilvános listán és a részletoldalon csak ettől az időponttól jelenik meg.',
      validation: (r) => r.custom((value, context) => value && context.document?.startsAt && String(value) > String(context.document.startsAt) ? 'A megjelenés az esemény kezdete utánra esik.' : true).warning(),
    }),
    defineField({
      name: 'endsAt', title: 'Befejezés (csak többnapos eseménynél)', type: 'datetime', group: 'main',
      description: 'Hagyd üresen, ha egynapos. Többnaposnál az UTOLSÓ nap záró időpontja — ettől jelenik meg „szeptember 25–27.” alakban, és marad a közelgők közt az utolsó napig.',
    }),
    defineField({ name: 'slug', title: 'Webcím (slug)', type: 'slug', group: 'main', options: { source: 'title', slugify }, validation: (r) => r.required() }),

    // A borító a fő űrlapon van: ez adja az eseményoldal hero képét.
    defineField({ name: 'cover', title: 'Esemény borítóképe', type: 'image', group: 'main', options: { hotspot: true, metadata: ['blurhash', 'lqip', 'palette'] }, components: { input: FacebookEventCoverInput }, fields: [{ name: 'alt', type: 'string', title: 'Alt szöveg' }], description: 'Facebookról átvehető a gombbal, vagy feltölthető kézzel. Borító nélkül az eseményoldal kép nélkül jelenik meg.', validation: (r) => r.custom((value) => value?.asset ? true : 'Borító nélkül az eseményoldal kép nélkül jelenik meg.').warning() }),
    defineField({ name: 'location', title: 'Helyszín', type: 'location', group: 'details' }),
    defineField({ name: 'description', title: 'Leírás', type: 'blockContent', group: 'main', description: 'A Facebook-leírás nem kerül át automatikusan. A weboldalon csak az ide írt szöveg jelenik meg.' }),
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
