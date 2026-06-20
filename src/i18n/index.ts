export const LOCALES = ['hu', 'en'] as const;
export type Lang = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Lang = 'hu';

// Az URL első útvonal-szegmenséből olvassa ki a nyelvet. Ismeretlen → alapnyelv.
export function getLangFromUrl(url: URL): Lang {
  const seg = url.pathname.split('/').filter(Boolean)[0];
  return seg === 'en' ? 'en' : 'hu';
}

// Belső útvonal nyelv-prefixelése. HU: nincs prefix; EN: /en előtag.
// Külső (http/https/mailto) linkeket változatlanul hagy.
export function localizedPath(path: string, lang: Lang): string {
  if (/^(https?:|mailto:|tel:|#)/.test(path)) return path;
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (lang === 'hu') return clean;
  if (clean === '/') return '/en';
  return `/en${clean}`;
}

// Egy aktuális (esetleg /en-előtagos) útvonalat a másik nyelvre képez le.
export function alternatePath(currentPath: string, lang: Lang): string {
  // Vágjuk le az esetleges /en előtagot → „semleges" HU-útvonal
  let neutral = currentPath.replace(/^\/en(?=\/|$)/, '');
  if (neutral === '') neutral = '/';
  return localizedPath(neutral, lang);
}
