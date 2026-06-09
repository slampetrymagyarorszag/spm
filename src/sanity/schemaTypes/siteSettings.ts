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
    defineField({ name: 'contactEmail', title: 'Kapcsolati email (megjelenítéshez)', type: 'string', description: 'Ez a cím látszik a Kapcsolat oldalon és a láblécben. (A form-ok címzettjeit lent, az „Email-címzettek" blokkban állítod.)' }),
    defineField({
      name: 'emails', title: 'Email-címzettek (form-ok)', type: 'object',
      description: 'Melyik űrlap melyik címre érkezzen. Üresen hagyott mezőnél az alapérték érvényes.',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: 'generalEmail', title: 'Általános kapcsolat → info', type: 'string', initialValue: 'info@slampoetry.hu', description: 'A „Kapcsolat" oldal űrlapja ide érkezik.' }),
        defineField({ name: 'pressEmail', title: 'Sajtó / egyesület → media', type: 'string', initialValue: 'media@slampoetry.hu', description: 'Az Egyesület oldal „Lépj kapcsolatba" űrlapja ide érkezik.' }),
        defineField({ name: 'applicationsEmail', title: 'Jelentkezések → contest', type: 'string', initialValue: 'contest@slampoetry.hu', description: 'Esemény-jelentkezés, országos bajnokság és havi klub jelentkezés ide érkezik (ha az adott eseménynél nincs külön cím megadva).' }),
        defineField({ name: 'notifyEmail', title: 'Értesítési cím — új beküldésről', type: 'string', description: 'Ha kitöltöd, erre a címre megy egy értesítő, amikor új slammer-jelentkezés vagy esemény-tipp érkezik (elbírálásra). Pl. annak a kollégának a címe, aki kezeli ezeket.' }),
        defineField({ name: 'notifyOnSubmissions', title: 'Értesítő bekapcsolva', type: 'boolean', initialValue: false }),
      ],
    }),
    defineField({
      name: 'home', title: 'Főoldal — hero', type: 'object',
      description: 'A főoldal tetején lévő nagy bevezető blokk szövegei. Üresen hagyva az alapértékek jelennek meg.',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: 'heroSticker', title: 'Matrica-felirat', type: 'string', initialValue: 'since 2006' }),
        defineField({ name: 'heroTitle', title: 'Fő cím', type: 'string', initialValue: 'Slam Poetry Magyarország' }),
        defineField({ name: 'heroLead', title: 'Alcím / bevezető', type: 'text', rows: 2, initialValue: 'A magyar slam poetry színtér élő központja — események, slammerek, hírek és média egy helyen.' }),
        defineField({ name: 'primaryCtaLabel', title: 'Elsődleges gomb felirata', type: 'string', initialValue: 'Közelgő események' }),
        defineField({ name: 'primaryCtaHref', title: 'Elsődleges gomb linkje', type: 'string', initialValue: '/esemenyek' }),
        defineField({ name: 'secondaryCtaLabel', title: 'Másodlagos gomb felirata', type: 'string', initialValue: 'Mi az a slam poetry?' }),
        defineField({ name: 'secondaryCtaHref', title: 'Másodlagos gomb linkje', type: 'string', initialValue: '/mi-az-a-slam-poetry' }),
      ],
    }),
    defineField({
      name: 'youtubePlaylists', title: 'YouTube lejátszási listák (médiatár)', type: 'array',
      description: 'Ezek a listák jelennek meg a Médiatárban (pl. „Májusi klub"), a legfrissebb videókkal. A lista ID-t a YouTube playlist linkjéből másold ki (a „list=" utáni rész, általában PL...-lel kezdődik).',
      of: [{
        type: 'object',
        fields: [
          defineField({ name: 'title', title: 'Cím', type: 'string' }),
          defineField({ name: 'playlistId', title: 'Lejátszási lista ID', type: 'string' }),
        ],
        preview: { select: { title: 'title', subtitle: 'playlistId' } },
      }],
    }),
    defineField({
      name: 'downloads', title: 'Letölthető dokumentumok (médiatár alatt)', type: 'array',
      description: 'Pl. az általános slam kiajánló PDF. Üresen hagyva nem jelenik meg semmi — amint feltöltesz egyet, megjelenik a Médiatár alján.',
      of: [{
        type: 'object',
        fields: [
          defineField({ name: 'title', title: 'Cím', type: 'string', validation: (r) => r.required() }),
          defineField({ name: 'description', title: 'Rövid leírás (opcionális)', type: 'string' }),
          defineField({ name: 'file', title: 'Fájl (PDF stb.)', type: 'file' }),
          defineField({ name: 'url', title: 'Vagy külső link (ha nem fájlt töltesz fel)', type: 'url' }),
        ],
        preview: { select: { title: 'title', subtitle: 'description' } },
      }],
    }),
    defineField({
      name: 'monthlyContest', title: 'Havi klub — jelentkezés gomb', type: 'object',
      description: 'A főoldali hero melletti „Jelentkezem a havi versenyre" gomb (Slam Poetry Budapest havi klub). Kapcsold be, add meg, melyik havi klubról van szó, és állítsd be, mikor nyíljon/záruljon a jelentkezés. Ha vége, egyszerűen kapcsold ki — a következő hónapnál csak átírod a hónapot és a dátumokat.',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: 'enabled', title: 'Bekapcsolva', type: 'boolean', initialValue: false }),
        defineField({ name: 'monthLabel', title: 'Melyik havi klub', type: 'string', description: 'Pl. „2026. júniusi klub". Ez kerül a beérkező emailbe, hogy melyik hónapra jött a jelentkezés.' }),
        defineField({ name: 'buttonLabel', title: 'Gomb felirata', type: 'string', initialValue: 'Jelentkezem a havi versenyre' }),
        defineField({ name: 'intro', title: 'Rövid szöveg a felugró ablakban (opcionális)', type: 'text', rows: 2 }),
        defineField({ name: 'opensAt', title: 'Nyitás — mikor jelenjen meg a gomb', type: 'datetime', description: 'Üresen hagyva azonnal látszik (ha bekapcsolt).' }),
        defineField({ name: 'closesAt', title: 'Zárás — mikor tűnjön el', type: 'datetime', description: 'Üresen hagyva nincs automatikus zárás.' }),
      ],
    }),
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
