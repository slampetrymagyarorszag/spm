import { defineField, defineType } from 'sanity';

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Oldal beállítások',
  type: 'document',
  groups: [{"name": "home", "title": "Főoldal", "default": true}, {"name": "contacts", "title": "Kapcsolatok és értesítések"}, {"name": "media", "title": "YouTube és letöltések"}, {"name": "advanced", "title": "További beállítások"}],
  fields: [
    defineField({ name: 'title', group: 'advanced', title: 'Oldal címe', type: 'string', initialValue: 'Slam Poetry Magyarország' }),
    defineField({ name: 'logo', group: 'advanced', title: 'Logó', type: 'image' }),
    defineField({ name: 'accentColor', group: 'advanced', title: 'Kiemelőszín (pl. #b13bd6)', type: 'string', initialValue: '#b13bd6' }),
    defineField({
      name: 'nav', group: 'advanced', hidden: true,
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
      name: 'social', group: 'contacts',
      title: 'Közösségi linkek',
      type: 'object',
      fields: [
        defineField({ name: 'facebook', title: 'Facebook', type: 'url' }),
        defineField({ name: 'youtube', title: 'YouTube', type: 'url' }),
        defineField({ name: 'instagram', title: 'Instagram', type: 'url' }),
        defineField({ name: 'tiktok', title: 'TikTok', type: 'url' }),
      ],
    }),
    defineField({ name: 'contactEmail', group: 'contacts', title: 'Kapcsolati email (megjelenítéshez)', type: 'string', description: 'Ez a cím látszik a Kapcsolat oldalon és a láblécben. (Az űrlapok címzettjeit a Kapcsolatok és értesítések fülön, az „Email-címzettek" blokkban állítod.)' }),
    defineField({
      name: 'emails', group: 'contacts', title: 'Email-címzettek (form-ok)', type: 'object',
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
      name: 'home', group: 'home', title: 'Főoldal nyitó szövegei', type: 'object',
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
        defineField({ name: 'heroStickerEn', title: 'Hero matrica (English)', type: 'string' }),
        defineField({ name: 'heroTitleEn', title: 'Hero cím (English)', type: 'string' }),
        defineField({ name: 'heroLeadEn', title: 'Hero alcím (English)', type: 'text', rows: 2 }),
        defineField({ name: 'primaryCtaLabelEn', title: 'Elsődleges gomb szövege (English)', type: 'string' }),
        defineField({ name: 'secondaryCtaLabelEn', title: 'Másodlagos gomb szövege (English)', type: 'string' }),
      ],
    }),
    defineField({
      name: 'youtubeAutoPlaylists', group: 'media', title: 'Új YouTube-playlistek automatikus megjelenítése', type: 'boolean',
      initialValue: true,
      description: 'Bekapcsolva (és üresen hagyva is) az SPM csatorna 12 legfrissebb nyilvános, nem üres playlistje megjelenik a médiatárban. A frissítés körülbelül 15–20 percet igényelhet. A kézzel hozzáadott listák megmaradnak.',
    }),
    defineField({
      name: 'youtubePlaylists', group: 'media', title: 'YouTube lejátszási listák (médiatár)', type: 'array',
      description: 'Az automatikusan átvett listák mellé kézzel felvett listák a Médiatárban (pl. „Májusi klub"), a legfrissebb videókkal. A lista ID-t a YouTube playlist linkjéből másold ki (a „list=" utáni rész, általában PL...-lel kezdődik).',
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
      name: 'downloads', group: 'media', title: 'Letölthető dokumentumok (médiatár alatt)', type: 'array',
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
      name: 'monthlyContest', group: 'advanced', hidden: true, title: 'Havi klub — jelentkezés gomb', type: 'object',
      description: 'A főoldali hero melletti „Jelentkezem a havi versenyre" gomb (Slam Poetry Budapest havi klub). Kapcsold be, add meg, melyik havi klubról van szó, és állítsd be, mikor nyíljon/záruljon a jelentkezés. Ha vége, egyszerűen kapcsold ki — a következő hónapnál csak átírod a hónapot és a dátumokat.',
      options: { collapsible: true, collapsed: true },
      validation: (r) => r.custom((value: any) => {
        if (value?.enabled && !value?.monthLabel?.trim()) return 'A bekapcsolt havi klubhoz add meg, melyik havi klubra jelentkeznek.';
        if (value?.opensAt && value?.closesAt && value.opensAt >= value.closesAt) return 'A zárásnak a nyitás után kell lennie.';
        return true;
      }),
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
      name: 'impressum', group: 'advanced', title: 'Impresszum', type: 'object',
      description: 'A lábléc impresszum blokkja.',
      fields: [
        defineField({ name: 'orgName', title: 'Egyesület neve', type: 'string', initialValue: 'Slam Poetry Magyarország Egyesület' }),
        defineField({ name: 'address', title: 'Székhely / cím', type: 'text', rows: 2, description: 'Hol található az egyesület (székhely). Megjelenik a lábléc impresszumában.' }),
        defineField({ name: 'email', title: 'Egyesületi email', type: 'string', description: 'Az egyesület elérhetősége (megjelenik a lábléc impresszumában). Pl. egyesulet@slampoetry.hu' }),
        defineField({ name: 'taxNumber', title: 'Adószám / nyilvántartási szám (opcionális)', type: 'string' }),
        defineField({ name: 'annualReportsUrl', title: 'Éves beszámolók linkje (régi, opcionális)', type: 'url', description: 'Egyetlen külső link. Inkább az alábbi „Éves beszámolók (PDF-ek)" listát használd — oda fájlokat tölthetsz fel.' }),
        defineField({
          name: 'annualReports', title: 'Éves beszámolók (PDF-ek)', type: 'array',
          description: 'Töltsd fel ide az éves beszámolókat PDF-ben. Minden évhez egy elem: adj egy címet (pl. „2021") és tölts fel egy fájlt. Az Egyesület oldalon letölthető listaként jelennek meg.',
          of: [{
            type: 'object',
            fields: [
              defineField({ name: 'label', title: 'Cím / év', type: 'string', description: 'Pl. „2021-es beszámoló" vagy „2021".', validation: (r) => r.required() }),
              defineField({ name: 'file', title: 'PDF fájl', type: 'file', options: { accept: '.pdf' } }),
            ],
            preview: { select: { title: 'label' } },
          }],
        }),
      ],
    }),
    defineField({ name: 'championshipCtaEnabled', group: 'advanced', hidden: true, title: 'Országos bajnokság CTA — bekapcsolva', type: 'boolean', initialValue: false }),
    defineField({ name: 'championshipCtaLabel', group: 'advanced', hidden: true, title: 'CTA felirat', type: 'string', initialValue: 'Jelentkezem az országos bajnokságra' }),
    defineField({
      name: 'championshipCtaUrl', group: 'advanced', hidden: true,
      title: 'CTA cél (URL vagy /esemenyek/slug) — HAGYD ÜRESEN a felugró űrlaphoz',
      description:
        'Ha üresen hagyod, a gomb a jelentkezési űrlapot nyitja meg felugró ablakban (ez a szokásos). Csak akkor tölts ide linket, ha a gombnak máshová kell vinnie.',
      type: 'string',
    }),
    defineField({
      name: 'championshipCtaIntro', group: 'advanced', hidden: true,
      title: 'Bevezető szöveg a felugró űrlap tetején',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'championshipDays', group: 'advanced', hidden: true,
      title: 'Választható előválogató napok',
      description: 'A jelentkező ezek közül jelölheti meg, melyik nap(ok) felelnek meg neki. Ahogy ide beírod, úgy jelenik meg az űrlapon és úgy kerül az exportba.',
      type: 'array',
      of: [{ type: 'string' }],
      initialValue: ['2026.09.25. péntek', '2026.09.26. szombat', '2026.09.27. vasárnap'],
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'championshipCtaFrom', group: 'advanced', hidden: true,
      title: 'CTA megjelenés -tól (opcionális)',
      description: 'HAGYD ÜRESEN, ha a gomb a bekapcsolás pillanatától látszódjon. Csak akkor tölts ide dátumot, ha időzíteni akarod. (Ezek a mezők a bajnoksági gombra vonatkoznak, nem a havi klubra.)',
      type: 'datetime',
    }),
    defineField({
      name: 'championshipCtaTo', group: 'advanced', hidden: true,
      title: 'CTA eltűnés -ig (opcionális)',
      description: 'HAGYD ÜRESEN, ha a gomb visszakapcsolásig látszódjon.',
      type: 'datetime',
    }),
  ],
  validation: (r) => r.custom((value: any) => value?.championshipCtaFrom && value?.championshipCtaTo && value.championshipCtaFrom >= value.championshipCtaTo ? 'A bajnoki jelentkezés zárása a nyitás után legyen.' : true),
  preview: { prepare: () => ({ title: 'Oldal beállítások' }) },
});
