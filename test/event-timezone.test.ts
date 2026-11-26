import { expect, it } from 'vitest';
import { formatEventTime } from '../src/sanity/lib/events';
it('shows Budapest time regardless of the hosting server timezone, including DST', () => {
  expect(formatEventTime('2026-12-02T18:00:00.000Z')).toBe('19:00');
  expect(formatEventTime('2026-07-02T17:00:00.000Z')).toBe('19:00');
});
