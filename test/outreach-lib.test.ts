import { describe, it, expect } from 'vitest';
import { emailsIn, looksLikeName, nameNearest, buildList, greeting, cleanName, isPersonName } from '../scripts/outreach/lib.mjs';

describe('emailsIn', () => {
  it('kisbetűsítve adja vissza a címeket', () => {
    expect(emailsIn('Valaki <Teszt.Elek@Lap.HU>')).toEqual(['teszt.elek@lap.hu']);
  });
  it('egy cellából többet is kinyer', () => {
    expect(emailsIn('a@b.hu, c@d.hu')).toEqual(['a@b.hu', 'c@d.hu']);
  });
  it('üresre és nem-emailre üres lista', () => {
    expect(emailsIn('')).toEqual([]);
    expect(emailsIn('nincs itt semmi')).toEqual([]);
  });
});

describe('looksLikeName', () => {
  it('elfogadja a valódi neveket', () => {
    expect(looksLikeName('Varga Zsombor')).toBe(true);
    expect(looksLikeName('Kovács Nóra Judit')).toBe(true);
  });
  it('elutasítja a dátumot, emailt, tölteléket', () => {
    expect(looksLikeName('2022-09-01 15:59:53')).toBe(false);
    expect(looksLikeName('a@b.hu')).toBe(false);
    expect(looksLikeName('STB')).toBe(false);
    expect(looksLikeName('Igen')).toBe(false);
    expect(looksLikeName('')).toBe(false);
    expect(looksLikeName('https://pelda.hu')).toBe(false);
  });
  it('ismételt hívásnál is stabil (a globális regex nem ragad be)', () => {
    expect(looksLikeName('Varga Zsombor')).toBe(true);
    expect(looksLikeName('Varga Zsombor')).toBe(true);
  });
});

describe('nameNearest', () => {
  it('a bal oldali nevet választja', () => {
    expect(nameNearest(['2022-09-01', 'Varga Zsombor', 'zs@lap.hu'], 2)).toBe('Varga Zsombor');
  });
  it('ha balra nincs, jobbra néz', () => {
    expect(nameNearest(['zs@lap.hu', 'Varga Zsombor'], 0)).toBe('Varga Zsombor');
  });
  it('ha sehol nincs név, üres', () => {
    expect(nameNearest(['zs@lap.hu', '2022'], 0)).toBe('');
  });
});

describe('buildList', () => {
  const recs = [
    { email: 'A@lap.hu', name: 'Nagy Anna', source: '10 (2022)' },
    { email: 'a@LAP.hu', name: 'Nagy Anna Mária', source: '11 (2023)' },
    { email: 'b@lap.hu', name: 'Kis Béla', source: '12 (2024)' },
    { email: 'c@lap.hu', name: 'Tóth Cili', source: '13 (2025)' },
  ];

  it('deduplikál és a hosszabb nevet tartja meg', () => {
    const out = buildList(recs);
    expect(out).toHaveLength(3);
    expect(out.find((r) => r.email === 'a@lap.hu')!.name).toBe('Nagy Anna Mária');
  });

  it('összegyűjti, melyik évekből jött a cím', () => {
    const a = buildList(recs).find((r) => r.email === 'a@lap.hu')!;
    expect(a.sources).toEqual(['10 (2022)', '11 (2023)']);
  });

  it('kizárja a megadott címeket, kis-nagybetűtől függetlenül', () => {
    const out = buildList(recs, ['B@Lap.hu']);
    expect(out.map((r) => r.email)).toEqual(['a@lap.hu', 'c@lap.hu']);
  });

  it('üres bemenetre üres lista', () => {
    expect(buildList([])).toEqual([]);
    expect(buildList(undefined as any)).toEqual([]);
  });

  it('az érvénytelen/üres címeket kihagyja', () => {
    expect(buildList([{ email: '', name: 'X' }, { email: '   ', name: 'Y' }])).toEqual([]);
  });
});

describe('cleanName', () => {
  it('levágja a zárójeles kiegészítést', () => {
    expect(cleanName('Venczel Patrik (Edvárd, a bárd)')).toBe('Venczel Patrik');
    expect(cleanName('Némethné Tóth Fruzsina (Szoó Virág)')).toBe('Némethné Tóth Fruzsina');
  });
  it('levágja a perjeles színpadi nevet és a kötőjeles utótagot', () => {
    expect(cleanName('Suplicz Márton/supliczmarci')).toBe('Suplicz Márton');
    expect(cleanName('Fábián Tímea Nikolett - Tiniky')).toBe('Fábián Tímea Nikolett');
  });
  it('levágja a záró írásjelet', () => {
    expect(cleanName('burkamatyi.')).toBe('burkamatyi');
  });
});

describe('isPersonName — a valódi táblákból származó esetek', () => {
  it('elfogadja a rendes neveket és a színpadi neveket', () => {
    for (const n of ['Varga Zsombor', 'Dé-Zé', 'BoraBora', 'burkamatyi.', 'Horváth Krisztina-Mary Poppins',
                     'Venczel Patrik (Edvárd, a bárd)', 'Némethné Tóth Fruzsina (Szoó Virág)']) {
      expect(isPersonName(n), n).toBe(true);
    }
  });

  it('elutasítja a megjegyzésnek beírt szöveget', () => {
    for (const n of ['Vasárnap nem tudnék részt venni',
                     'A szombat estét (09.23.) nem tudom megoldani.',
                     'Szombat délután 18tól nem jó.  Vasárnap egésznap.',
                     'Nekem csak a péntek lenne jó',
                     'Vasárnap nekem nem alkalmas (esetleg 19:30 után)',
                     'Budapesten élek és slamelek, Nagykanizsán születtem',
                     'Szept. 23. - nagy valószínűséggel nem tudok jönni']) {
      expect(isPersonName(n), n).toBe(false);
    }
  });

  it('elutasítja a puszta városnevet', () => {
    expect(isPersonName('Budapest')).toBe(false);
    expect(isPersonName('Szolnok')).toBe(false);
    expect(isPersonName('Mogyorósbánya (esztergomi slammer)')).toBe(false);
  });

  it('a városnév nem zavar, ha valódi név része', () => {
    expect(isPersonName('Budai Anna')).toBe(true);
  });

  it('az ékezetes betűk nem akadnak bele a szűrőszavakba', () => {
    // A JS  nem ismeri az ékezeteket: a „Teodóra” korábban az „óra” szóra bukott.
    expect(isPersonName('Trapp Teodóra')).toBe(true);
    expect(isPersonName('Vasárnapi Ödön')).toBe(true);
  });

  it('elfogadja a névbeli kezdőbetűt, de a mondat közbeni pontot nem', () => {
    // A záró pontot a cleanName szándékosan levágja („burkamatyi.” → „burkamatyi”),
    // a mondat KÖZBENI pont viszont megjegyzésre utal.
    expect(isPersonName('Vörös E. Hargita')).toBe(true);
    expect(isPersonName('Pénteken meló miatt para lehet nekem.')).toBe(false);
    expect(isPersonName('Szombat délután 18tól nem jó.  Vasárnap egésznap.')).toBe(false);
  });
});

describe('greeting', () => {
  it('névvel személyre szól', () => {
    expect(greeting('Varga Zsombor')).toBe('Szia Varga Zsombor!');
  });
  it('levágja a színpadi nevet a perjel után', () => {
    expect(greeting('Suplicz Márton/supliczmarci')).toBe('Szia Suplicz Márton!');
  });
  it('kétes névnél semleges megszólítás megy', () => {
    expect(greeting('Budapest')).toBe('Szia!');
    expect(greeting('Nekem csak a péntek lenne jó')).toBe('Szia!');
  });
  it('név nélkül semleges', () => {
    expect(greeting('')).toBe('Szia!');
    expect(greeting('X')).toBe('Szia!');
  });
});

import { renderOutreachEmail, renderOutreachText, SUBJECT, esc } from '../scripts/outreach/email.mjs';

describe('kampány-levél', () => {
  const base = { name: 'Varga Zsombor', applyUrl: 'https://slampoetry.hu/?jelentkezes=1' };

  it('személyre szól és tartalmazza a lényeget', () => {
    const html = renderOutreachEmail(base);
    expect(html).toContain('Szia Varga Zsombor!');
    expect(html).toContain('vasárnap éjfélig');
    expect(html).toContain('14. Slam Poetry Országos Bajnokság');
    expect(html).toContain('szeptember 25-én, 26-án és 27-én');
    expect(html).toContain('Csapj oda neki!');
  });

  it('a gomb a jelentkezési mélylinkre mutat', () => {
    expect(renderOutreachEmail(base)).toContain('href="https://slampoetry.hu/?jelentkezes=1"');
  });

  it('minden levélben van leiratkozási lehetőség', () => {
    expect(renderOutreachEmail(base)).toContain('contest@slampoetry.hu');
    expect(renderOutreachEmail(base)).toContain('töröljük a listáról');
    expect(renderOutreachText(base)).toContain('contest@slampoetry.hu');
  });

  it('név nélkül sem törik el', () => {
    const html = renderOutreachEmail({ ...base, name: '' });
    expect(html).toContain('Szia!');
    expect(html).not.toContain('undefined');
  });

  it('escapeli a régi táblákból jövő nevet', () => {
    const html = renderOutreachEmail({ ...base, name: '<script>alert(1)</script>' });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(esc('<b>')).toBe('&lt;b&gt;');
  });

  it('a tárgy utal a határidőre', () => {
    expect(SUBJECT).toMatch(/vas\u00e1rnap/i);
  });

  it('a szöveges változat is tartalmazza a linket', () => {
    expect(renderOutreachText(base)).toContain('https://slampoetry.hu/?jelentkezes=1');
  });
});
