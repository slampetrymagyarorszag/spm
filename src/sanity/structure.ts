import type { StructureResolver } from 'sanity/structure';

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Tartalom')
    .items([
      S.documentTypeListItem('post').title('Hírek'),
      S.documentTypeListItem('slammer').title('Slammerek'),
      S.documentTypeListItem('event').title('Események'),
      S.divider(),
      S.listItem()
        .title('Oldal beállítások')
        .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
    ]);
