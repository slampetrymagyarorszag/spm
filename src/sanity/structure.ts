import type { StructureResolver } from 'sanity/structure';

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Tartalom')
    .items([
      S.documentTypeListItem('post').title('Hírek'),

      // Slammerek — összes + kiemelt szűrt nézet
      S.listItem()
        .title('Slammerek')
        .child(
          S.list()
            .title('Slammerek')
            .items([
              S.listItem()
                .title('Összes slammer')
                .child(S.documentTypeList('slammer').title('Összes slammer')),
              S.listItem()
                .title('⭐ Kiemelt slammerek')
                .child(
                  S.documentList()
                    .title('Kiemelt slammerek')
                    .filter('_type == "slammer" && featured == true')
                    .defaultOrdering([{ field: 'featuredOrder', direction: 'asc' }]),
                ),
            ]),
        ),

      // Események — közelgő / korábbi szűrt nézetek
      S.listItem()
        .title('Események')
        .child(
          S.list()
            .title('Események')
            .items([
              S.listItem()
                .title('Közelgő események')
                .child(
                  S.documentList()
                    .title('Közelgő események')
                    .filter('_type == "event" && startsAt >= now()')
                    .defaultOrdering([{ field: 'startsAt', direction: 'asc' }]),
                ),
              S.listItem()
                .title('Korábbi események')
                .child(
                  S.documentList()
                    .title('Korábbi események')
                    .filter('_type == "event" && startsAt < now()')
                    .defaultOrdering([{ field: 'startsAt', direction: 'desc' }]),
                ),
              S.listItem()
                .title('Összes esemény')
                .child(S.documentTypeList('event').title('Összes esemény')),
            ]),
        ),

      S.documentTypeListItem('mediaItem').title('Médiatár'),
      S.documentTypeListItem('page').title('Oldalak'),

      S.divider(),

      // Látogatói esemény-tippek elbírálása
      S.listItem()
        .title('📥 Beküldött események')
        .child(
          S.list()
            .title('Beküldött események')
            .items([
              S.listItem()
                .title('⏳ Elbírálásra vár')
                .child(
                  S.documentList()
                    .title('Elbírálásra vár')
                    .filter('_type == "eventTip" && approved != true && promoted != true')
                    .defaultOrdering([{ field: 'submittedAt', direction: 'desc' }]),
                ),
              S.listItem()
                .title('✅ „Tőletek érkezett” tipp')
                .child(
                  S.documentList()
                    .title('Közösségi tippek')
                    .filter('_type == "eventTip" && approved == true && promoted != true')
                    .defaultOrdering([{ field: 'submittedAt', direction: 'desc' }]),
                ),
              S.listItem()
                .title('📅 Eseménnyé alakítva')
                .child(
                  S.documentList()
                    .title('Eseménnyé alakítva')
                    .filter('_type == "eventTip" && promoted == true')
                    .defaultOrdering([{ field: 'submittedAt', direction: 'desc' }]),
                ),
            ]),
        ),

      // Látogatói slammer-jelentkezések elbírálása
      S.listItem()
        .title('🎤 Beküldött slammerek')
        .child(
          S.list()
            .title('Beküldött slammerek')
            .items([
              S.listItem()
                .title('⏳ Elbírálásra vár')
                .child(
                  S.documentList()
                    .title('Elbírálásra vár')
                    .filter('_type == "slammerApplication" && promoted != true')
                    .defaultOrdering([{ field: 'submittedAt', direction: 'desc' }]),
                ),
              S.listItem()
                .title('✅ Slammerré alakítva')
                .child(
                  S.documentList()
                    .title('Slammerré alakítva')
                    .filter('_type == "slammerApplication" && promoted == true')
                    .defaultOrdering([{ field: 'submittedAt', direction: 'desc' }]),
                ),
            ]),
        ),

      // Slammerek saját módosítási kérései a profiljukról
      S.listItem()
        .title('✏️ Slammer-módosítási kérések')
        .child(
          S.list()
            .title('Slammer-módosítási kérések')
            .items([
              S.listItem()
                .title('⏳ Nyitott')
                .child(
                  S.documentList()
                    .title('Nyitott kérések')
                    .filter('_type == "slammerEditRequest" && handled != true')
                    .defaultOrdering([{ field: 'submittedAt', direction: 'desc' }]),
                ),
              S.listItem()
                .title('✅ Elintézett')
                .child(
                  S.documentList()
                    .title('Elintézett kérések')
                    .filter('_type == "slammerEditRequest" && handled == true')
                    .defaultOrdering([{ field: 'submittedAt', direction: 'desc' }]),
                ),
            ]),
        ),

      // Beküldött / kezelt slam klubok
      S.listItem()
        .title('🏙️ Slam klubok')
        .child(
          S.list()
            .title('Slam klubok')
            .items([
              S.listItem()
                .title('⏳ Elbírálásra vár')
                .child(
                  S.documentList()
                    .title('Elbírálásra vár')
                    .filter('_type == "slamClub" && approved != true')
                    .defaultOrdering([{ field: 'submittedAt', direction: 'desc' }]),
                ),
              S.listItem()
                .title('✅ Jóváhagyott (megjelenik)')
                .child(
                  S.documentList()
                    .title('Jóváhagyott klubok')
                    .filter('_type == "slamClub" && approved == true')
                    .defaultOrdering([{ field: 'city', direction: 'asc' }]),
                ),
            ]),
        ),

      // Jelentkezés-napló (havi klub + bajnokság) — export a felső „Jelentkezések export” menüből
      S.listItem()
        .title('📋 Jelentkezések (napló)')
        .child(
          S.list()
            .title('Jelentkezések')
            .items([
              S.listItem()
                .title('Összes (időrendben)')
                .child(
                  S.documentList()
                    .title('Összes jelentkezés')
                    .filter('_type == "formSubmission"')
                    .defaultOrdering([{ field: 'submittedAt', direction: 'desc' }]),
                ),
              S.listItem()
                .title('🎤 Havi klub')
                .child(
                  S.documentList()
                    .title('Havi klub jelentkezések')
                    .filter('_type == "formSubmission" && kind == "havi-klub"')
                    .defaultOrdering([{ field: 'submittedAt', direction: 'desc' }]),
                ),
              S.listItem()
                .title('🏆 Országos bajnokság')
                .child(
                  S.documentList()
                    .title('Bajnoki jelentkezések')
                    .filter('_type == "formSubmission" && kind == "bajnoksag"')
                    .defaultOrdering([{ field: 'submittedAt', direction: 'desc' }]),
                ),
            ]),
        ),

      S.divider(),
      S.listItem()
        .title('Oldal beállítások')
        .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
    ]);
