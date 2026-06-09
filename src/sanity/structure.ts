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
                    .filter('_type == "eventTip" && approved != true')
                    .defaultOrdering([{ field: 'submittedAt', direction: 'desc' }]),
                ),
              S.listItem()
                .title('✅ Jóváhagyott')
                .child(
                  S.documentList()
                    .title('Jóváhagyott')
                    .filter('_type == "eventTip" && approved == true')
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
                    .filter('_type == "slammerApplication" && approved != true')
                    .defaultOrdering([{ field: 'submittedAt', direction: 'desc' }]),
                ),
              S.listItem()
                .title('✅ Jóváhagyott')
                .child(
                  S.documentList()
                    .title('Jóváhagyott')
                    .filter('_type == "slammerApplication" && approved == true')
                    .defaultOrdering([{ field: 'submittedAt', direction: 'desc' }]),
                ),
            ]),
        ),

      S.divider(),
      S.listItem()
        .title('Oldal beállítások')
        .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
    ]);
