import { describe, it, expect } from 'vitest';
import {
  validateChampionship,
  normalizeAvailableDays,
  DEFAULT_CHAMPIONSHIP_DAYS,
} from '../src/lib/validation';

const valid = { name: 'Teszt Elek', email: 'teszt@example.com', stageName: 'Teszti', consent: 'on' };

// A napok feliratát a Studio adja (dátumos címkék), ezért a logikát saját listával
// teszteljük — így a konkrét dátumok cseréje nem töri el ezeket a teszteket.
const allowed = ['Péntek', 'Szombat', 'Vasárnap'];

describe('normalizeAvailableDays', () => {
  it('a megengedett napokat kanonikus alakban adja vissza', () => {
    expect(normalizeAvailableDays(['péntek', 'VASÁRNAP'], allowed)).toEqual(['Péntek', 'Vasárnap']);
  });

  it('egyetlen sztringet is elfogad (nem tömb)', () => {
    expect(normalizeAvailableDays('Szombat', allowed)).toEqual(['Szombat']);
  });

  it('megőrzi a megengedett napok sorrendjét, nem a beküldését', () => {
    expect(normalizeAvailableDays(['Vasárnap', 'Péntek'], allowed)).toEqual(['Péntek', 'Vasárnap']);
  });

  it('duplikátumot és ismeretlen napot eldob', () => {
    expect(normalizeAvailableDays(['Péntek', 'Péntek', 'Hétfő', ''], allowed)).toEqual(['Péntek']);
  });

  it('nem tömb / üres bemenetre üres listát ad', () => {
    expect(normalizeAvailableDays(undefined, allowed)).toEqual([]);
    expect(normalizeAvailableDays(null, allowed)).toEqual([]);
    expect(normalizeAvailableDays(42, allowed)).toEqual([]);
  });

  it('dátumos címkékkel is működik (ahogy élesben megjelennek)', () => {
    expect(normalizeAvailableDays(['2026.09.26. szombat'], DEFAULT_CHAMPIONSHIP_DAYS)).toEqual([
      '2026.09.26. szombat',
    ]);
  });

  it('az alapértelmezett napok három, dátumos címkéből állnak', () => {
    expect(DEFAULT_CHAMPIONSHIP_DAYS).toHaveLength(3);
    expect(DEFAULT_CHAMPIONSHIP_DAYS).toEqual([
      '2026.09.25. péntek',
      '2026.09.26. szombat',
      '2026.09.27. vasárnap',
    ]);
  });
});

describe('validateChampionship — napkötelezettség nélkül (beágyazott, eseményhez kötött űrlap)', () => {
  it('nap nélkül is átmegy, ahogy eddig', () => {
    expect(validateChampionship({ ...valid })).toEqual({ ok: true });
  });

  it('a honeypot továbbra is spamnek jelöl', () => {
    expect(validateChampionship({ ...valid, website: 'bot' })).toEqual({ ok: false, error: 'spam' });
  });

  it('hiányzó művésznévre hibázik', () => {
    expect(validateChampionship({ ...valid, stageName: '' }).ok).toBe(false);
  });
});

describe('validateChampionship — napkötelezettséggel (CTA felugró űrlap)', () => {
  const opts = { requireDays: true, allowedDays: allowed };

  it('legalább egy nappal átmegy', () => {
    expect(validateChampionship({ ...valid, availableDays: ['Szombat'] }, opts)).toEqual({ ok: true });
  });

  it('nap nélkül elutasít', () => {
    const r = validateChampionship({ ...valid }, opts);
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.error).toMatch(/nap/i);
  });

  it('csak ismeretlen napot megadva elutasít', () => {
    expect(validateChampionship({ ...valid, availableDays: ['Kedd'] }, opts).ok).toBe(false);
  });

  it('a kötelező alapmezőket a nap megléte sem írja felül', () => {
    expect(validateChampionship({ ...valid, email: 'rossz', availableDays: ['Péntek'] }, opts).ok).toBe(false);
  });
});
