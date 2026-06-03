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
