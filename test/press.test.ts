import { describe, it, expect } from 'vitest';
import {
  unsubscribeToken,
  verifyUnsubscribeToken,
  buildRecipients,
  chunk,
  toParagraphs,
  renderPressEmailHtml,
} from '../src/lib/press';

const SECRET = 'teszt-titok';

describe('leiratkozó-token', () => {
  it('ugyanarra a címre ugyanazt adja, és ellenőrizhető', () => {
    const t = unsubscribeToken('ujsagiro@lap.hu', SECRET);
    expect(verifyUnsubscribeToken('ujsagiro@lap.hu', t, SECRET)).toBe(true);
  });

  it('kis-nagybetű és szóköz nem számít', () => {
    const t = unsubscribeToken('  UJSAGIRO@Lap.hu ', SECRET);
    expect(verifyUnsubscribeToken('ujsagiro@lap.hu', t, SECRET)).toBe(true);
  });

  it('más címre szóló tokent elutasít', () => {
    const t = unsubscribeToken('a@lap.hu', SECRET);
    expect(verifyUnsubscribeToken('b@lap.hu', t, SECRET)).toBe(false);
  });

  it('más titokkal készült tokent elutasít', () => {
    const t = unsubscribeToken('a@lap.hu', 'masik-titok');
    expect(verifyUnsubscribeToken('a@lap.hu', t, SECRET)).toBe(false);
  });

  it('hiányzó vagy rossz hosszú tokenre nem dob, csak hamis', () => {
    expect(verifyUnsubscribeToken('a@lap.hu', '', SECRET)).toBe(false);
    expect(verifyUnsubscribeToken('a@lap.hu', 'rovid', SECRET)).toBe(false);
    expect(verifyUnsubscribeToken('', 'x', SECRET)).toBe(false);
  });
});

describe('buildRecipients', () => {
  const list = [
    { email: 'a@lap.hu', tags: ['orszagos'] },
    { email: 'B@LAP.HU', tags: ['orszagos'] },
    { email: 'leiratkozott@lap.hu', subscribed: false },
    { email: 'nem-email', tags: ['orszagos'] },
    { email: 'c@lap.hu', tags: ['kulturalis'] },
    { email: ' d@lap.hu ', subscribed: true },
  ];

  it('kiszűri a leiratkozottat és az érvénytelen címet', () => {
    const r = buildRecipients(list).map((c) => c.email);
    expect(r).not.toContain('leiratkozott@lap.hu');
    expect(r).not.toContain('nem-email');
  });

  it('kisbetűsít és deduplikál', () => {
    const r = buildRecipients([{ email: 'X@lap.hu' }, { email: 'x@LAP.hu' }]);
    expect(r.map((c) => c.email)).toEqual(['x@lap.hu']);
  });

  it('címke szerint szűr', () => {
    const r = buildRecipients(list, 'kulturalis').map((c) => c.email);
    expect(r).toEqual(['c@lap.hu']);
  });

  it('címke nélkül mindenkit visz, aki feliratkozott', () => {
    expect(buildRecipients(list).map((c) => c.email)).toEqual(['a@lap.hu', 'b@lap.hu', 'c@lap.hu', 'd@lap.hu']);
  });

  it('üres bemenetre üres lista', () => {
    expect(buildRecipients([])).toEqual([]);
    expect(buildRecipients(undefined as any)).toEqual([]);
  });
});

describe('chunk', () => {
  it('csomagokra bont', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });
  it('üres listára üres eredmény', () => {
    expect(chunk([], 10)).toEqual([]);
  });
  it('nulla méretre hibát dob (nem végtelen ciklust)', () => {
    expect(() => chunk([1], 0)).toThrow();
  });
});

describe('levéltörzs', () => {
  it('üres sorok mentén bekezdésekre bont', () => {
    expect(toParagraphs('Egy.\n\nKettő.\n\n\nHárom.')).toEqual(['Egy.', 'Kettő.', 'Három.']);
  });

  it('tartalmazza a tárgyat, a szöveget és a leiratkozó linket', () => {
    const html = renderPressEmailHtml({
      subject: 'Kezdődik a bajnokság',
      body: 'Első bekezdés.\n\nMásodik bekezdés.',
      unsubscribeUrl: 'https://slampoetry.hu/leiratkozas?e=a%40lap.hu&t=abc',
    });
    expect(html).toContain('Kezdődik a bajnokság');
    expect(html).toContain('Első bekezdés.');
    expect(html).toContain('Második bekezdés.');
    expect(html).toContain('leiratkozas?e=a%40lap.hu&amp;t=abc');
    expect(html).toContain('Leiratkozás');
  });

  it('escapeli a tárgyat és a törzset (nem enged HTML-injekciót)', () => {
    const html = renderPressEmailHtml({
      subject: '<script>alert(1)</script>',
      body: '<img src=x onerror=alert(2)>',
      unsubscribeUrl: 'https://slampoetry.hu/leiratkozas',
    });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;script&gt;');
  });
});
