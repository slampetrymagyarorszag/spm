import { describe, it, expect } from 'vitest';
import { getLangFromUrl, localizedPath, alternatePath, LOCALES, DEFAULT_LOCALE } from '../src/i18n';

describe('getLangFromUrl', () => {
  it('gyökér útvonal → hu', () => {
    expect(getLangFromUrl(new URL('https://x.hu/slammerek'))).toBe('hu');
  });
  it('/en/ előtag → en', () => {
    expect(getLangFromUrl(new URL('https://x.hu/en/slammerek'))).toBe('en');
  });
  it('csak /en → en', () => {
    expect(getLangFromUrl(new URL('https://x.hu/en'))).toBe('en');
  });
  it('ismeretlen első szegmens → hu', () => {
    expect(getLangFromUrl(new URL('https://x.hu/enxyz/a'))).toBe('hu');
  });
});

describe('localizedPath', () => {
  it('hu: nincs prefix', () => { expect(localizedPath('/slammerek', 'hu')).toBe('/slammerek'); });
  it('en: /en prefix', () => { expect(localizedPath('/slammerek', 'en')).toBe('/en/slammerek'); });
  it('gyökér hu', () => { expect(localizedPath('/', 'hu')).toBe('/'); });
  it('gyökér en', () => { expect(localizedPath('/', 'en')).toBe('/en'); });
  it('idegen (http) linket nem bánt', () => { expect(localizedPath('https://fb.com/x', 'en')).toBe('https://fb.com/x'); });
});

describe('alternatePath', () => {
  it('hu oldalról en-re', () => { expect(alternatePath('/slammerek', 'en')).toBe('/en/slammerek'); });
  it('en oldalról hu-ra', () => { expect(alternatePath('/en/slammerek', 'hu')).toBe('/slammerek'); });
  it('en gyökérről hu-ra', () => { expect(alternatePath('/en', 'hu')).toBe('/'); });
  it('hu gyökérről en-re', () => { expect(alternatePath('/', 'en')).toBe('/en'); });
});

describe('konstansok', () => {
  it('LOCALES', () => { expect(LOCALES).toEqual(['hu', 'en']); });
  it('DEFAULT_LOCALE', () => { expect(DEFAULT_LOCALE).toBe('hu'); });
});
