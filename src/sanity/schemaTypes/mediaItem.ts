import { defineField, defineType } from 'sanity';
export const mediaItem = defineType({
  name: 'mediaItem', title: 'Médiatár elem', type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Cím', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'kind', title: 'Típus', type: 'string', options: { list: [
      { title: 'YouTube videó', value: 'video' },
      { title: 'YouTube lejátszási lista', value: 'playlist' },
      { title: 'Kép', value: 'image' },
      { title: 'Facebook album', value: 'album' },
    ], layout: 'radio' }, validation: (r) => r.required() }),
    defineField({ name: 'youtubeUrl', title: 'YouTube URL', type: 'url', hidden: ({ parent }) => parent?.kind !== 'video', validation: (r) => r.custom((value, context) => context.document?.kind === 'video' && !value ? 'A videóhoz YouTube-link kell.' : true) }),
    defineField({
      name: 'playlistUrl', title: 'YouTube lejátszási lista linkje', type: 'url',
      description: 'Illeszd be a teljes lejátszási lista linkjét (youtube.com/playlist?list=…) — a videókat automatikusan behúzzuk.',
      hidden: ({ parent }) => parent?.kind !== 'playlist',
      validation: (r) => r.custom((value, context) => context.document?.kind === 'playlist' && !value ? 'A listához YouTube-link kell.' : true),
    }),
    defineField({ name: 'image', title: 'Kép', type: 'image', options: { hotspot: true }, hidden: ({ parent }) => parent?.kind !== 'image', validation: (r) => r.custom((value, context) => context.document?.kind === 'image' && !value?.asset ? 'A képes elemhez tölts fel képet.' : true) }),
    defineField({ name: 'albumUrl', title: 'Facebook album URL', type: 'url', hidden: ({ parent }) => parent?.kind !== 'album', validation: (r) => r.custom((value, context) => context.document?.kind === 'album' && !value ? 'Az albumhoz Facebook-link kell.' : true) }),
    defineField({ name: 'albumCover', title: 'Album borítókép', type: 'image', hidden: ({ parent }) => parent?.kind !== 'album' }),
    defineField({ name: 'year', title: 'Év', type: 'number' }),
  ],
  preview: { select: { title: 'title', subtitle: 'kind' } },
});
