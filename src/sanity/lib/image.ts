import imageUrlBuilder from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';

const projectId =
  (import.meta as any).env?.PUBLIC_SANITY_PROJECT_ID ?? process.env.PUBLIC_SANITY_PROJECT_ID!;
const dataset =
  (import.meta as any).env?.PUBLIC_SANITY_DATASET ?? process.env.PUBLIC_SANITY_DATASET!;

const builder = imageUrlBuilder({ projectId, dataset });

export function urlForImage(source: SanityImageSource) {
  return builder.image(source);
}
