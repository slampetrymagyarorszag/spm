import { describe, it, expect } from 'vitest';
import { localized } from '../src/i18n/content';

describe('localized', () => {
  const doc = { title: 'Magyar cím', titleEn: 'English title', excerpt: 'HU', excerptEn: '' };
  it('hu nyelv → magyar mező', () => { expect(localized(doc, 'title', 'hu')).toBe('Magyar cím'); });
  it('en nyelv, van angol → angol', () => { expect(localized(doc, 'title', 'en')).toBe('English title'); });
  it('en nyelv, üres angol → magyar fallback', () => { expect(localized(doc, 'excerpt', 'en')).toBe('HU'); });
  it('en nyelv, hiányzó angol kulcs → magyar fallback', () => { expect(localized(doc, 'missing' as any, 'en')).toBeUndefined(); });
  it('null doc → undefined', () => { expect(localized(null, 'title', 'en')).toBeUndefined(); });
});
