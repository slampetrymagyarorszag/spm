import type { Lang } from './index';

// Egy CMS-mező nyelvfüggő értéke. EN nyelvnél a `<mező>En` párt adja, ha az
// nem üres; különben a magyar mezőre esik vissza. Stringre és Portable Text
// (tömb) értékekre is működik (üresség: '' string vagy üres tömb).
function isEmpty(v: unknown): boolean {
  if (v == null) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

export function localized<T extends Record<string, any>>(
  doc: T | null | undefined,
  field: string,
  lang: Lang,
): any {
  if (!doc) return undefined;
  if (lang === 'en') {
    const en = doc[`${field}En`];
    if (!isEmpty(en)) return en;
  }
  return doc[field];
}
