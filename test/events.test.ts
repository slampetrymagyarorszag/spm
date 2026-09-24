import { describe, it, expect } from 'vitest';
import { isUpcoming, splitEvents } from '../src/sanity/lib/events';
const now = new Date('2026-06-03T12:00:00Z');
const e = (id: string, iso: string) => ({ _id: id, title: id, slug: id, startsAt: iso } as any);
describe('events', () => {
  it('isUpcoming: jövőbeli kezdés igaz', () => { expect(isUpcoming(e('a', '2026-07-01T19:00:00Z'), now)).toBe(true); });
  it('isUpcoming: múltbeli kezdés hamis', () => { expect(isUpcoming(e('b', '2026-01-01T19:00:00Z'), now)).toBe(false); });
  it('splitEvents: közelgő növekvő, korábbi csökkenő sorrend', () => {
    const list = [e('past', '2026-01-01T00:00:00Z'), e('soon', '2026-07-01T00:00:00Z'), e('later', '2026-09-01T00:00:00Z')];
    const { upcoming, past } = splitEvents(list, now);
    expect(upcoming.map((x) => x._id)).toEqual(['soon', 'later']);
    expect(past.map((x) => x._id)).toEqual(['past']);
  });
});

import { eventEnd, isMultiDay, eventDayCount, eventDays, formatEventDate, formatEventWeekday, formatEventDayBadge } from '../src/sanity/lib/events';

// A XIV. SPOB előválogató: péntektől vasárnapig tart, és korábban egynaposként jelent meg.
const elovalogato = { startsAt: '2026-09-25T17:00:00+02:00', endsAt: '2026-09-27T23:00:00+02:00' } as any;
const egynapos = { startsAt: '2026-10-07T19:00:00+02:00' } as any;

describe('többnapos esemény', () => {
  it('felismeri, hogy három napon át tart', () => {
    expect(isMultiDay(elovalogato)).toBe(true);
    expect(eventDayCount(elovalogato)).toBe(3);
  });

  it('az egynapost nem jelöli többnaposnak', () => {
    expect(isMultiDay(egynapos)).toBe(false);
    expect(eventDayCount(egynapos)).toBe(1);
  });

  it('mindhárom naptári napot visszaadja a naptárnak', () => {
    const d = eventDays(elovalogato).map((x) => x.getDate());
    expect(d).toEqual([25, 26, 27]);
  });

  it('befejezés nélkül a kezdés a vég', () => {
    expect(eventEnd(egynapos).toISOString()).toBe(new Date(egynapos.startsAt).toISOString());
  });

  it('a kezdésnél korábbi befejezést figyelmen kívül hagyja', () => {
    const rossz = { startsAt: '2026-09-25T17:00:00+02:00', endsAt: '2026-09-20T10:00:00+02:00' } as any;
    expect(isMultiDay(rossz)).toBe(false);
    expect(eventDayCount(rossz)).toBe(1);
  });
});

describe('többnapos esemény állapota', () => {
  it('a MÁSODIK napon még közelgő (korábban ilyenkor már eltűnt volna)', () => {
    const kozben = new Date('2026-09-26T20:00:00+02:00');
    expect(isUpcoming(elovalogato, kozben)).toBe(true);
  });

  it('az utolsó nap vége után már nem közelgő', () => {
    expect(isUpcoming(elovalogato, new Date('2026-09-28T01:00:00+02:00'))).toBe(false);
  });

  it('a splitEvents a közelgők közt tartja a második napon', () => {
    const { upcoming, past } = splitEvents([elovalogato, egynapos], new Date('2026-09-26T20:00:00+02:00'));
    expect(upcoming).toHaveLength(2);
    expect(past).toHaveLength(0);
  });
});

describe('dátum-felirat', () => {
  it('azonos hónapban tartományt ír ki', () => {
    expect(formatEventDate(elovalogato)).toContain('25–27');
    expect(formatEventDate(elovalogato)).toContain('szeptember');
  });

  it('egynaposnál sima dátum', () => {
    expect(formatEventDate(egynapos)).not.toContain('–');
  });

  it('hónapváltásnál mindkét hónap szerepel', () => {
    const atnyulo = { startsAt: '2026-10-30T18:00:00+02:00', endsAt: '2026-11-01T22:00:00+01:00' } as any;
    const s = formatEventDate(atnyulo);
    expect(s).toContain('október');
    expect(s).toContain('november');
  });

  it('a kártya nagy száma tartományt mutat', () => {
    expect(formatEventDayBadge(elovalogato)).toBe('25–27');
    expect(formatEventDayBadge(egynapos)).toBe('7');
  });

  it('a tartomány közepén nincs elárvult pont', () => {
    // Korábbi hiba: kézi darabolásból „szeptember 25.–27." lett.
    expect(formatEventDate(elovalogato)).not.toMatch(/\d\.\s*–/);
  });

  it('év nélkül is helyes a tartomány', () => {
    const s = formatEventDate(elovalogato, 'hu-HU', { year: false });
    expect(s).toContain('25–27');
    expect(s).not.toContain('2026');
  });

  it('angolul a hónap és az év nem ismétlődik', () => {
    const s = formatEventDate(elovalogato, 'en-GB');
    expect(s).toContain('25');
    expect(s).toContain('27');
    expect(s.match(/September/g)).toHaveLength(1);
    expect(s.match(/2026/g)).toHaveLength(1);
  });

  it('a hétköznap is tartomány, ha többnapos', () => {
    expect(formatEventWeekday(elovalogato)).toBe('péntek–vasárnap');
    expect(formatEventWeekday(egynapos)).toBe('szerda');
  });
});
