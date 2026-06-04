import { describe, it, expect } from 'vitest';
import { isCtaActive } from '../src/sanity/lib/cta';
const now = new Date('2026-10-15T12:00:00Z');
describe('isCtaActive', () => {
  it('kikapcsolva → false', () => { expect(isCtaActive({ championshipCtaEnabled: false }, now)).toBe(false); });
  it('bekapcsolva, ablak nélkül → true', () => { expect(isCtaActive({ championshipCtaEnabled: true }, now)).toBe(true); });
  it('ablak előtt → false', () => { expect(isCtaActive({ championshipCtaEnabled: true, championshipCtaFrom: '2026-11-01T00:00:00Z' }, now)).toBe(false); });
  it('ablak után → false', () => { expect(isCtaActive({ championshipCtaEnabled: true, championshipCtaTo: '2026-10-01T00:00:00Z' }, now)).toBe(false); });
  it('ablakon belül → true', () => { expect(isCtaActive({ championshipCtaEnabled: true, championshipCtaFrom: '2026-10-01T00:00:00Z', championshipCtaTo: '2026-11-01T00:00:00Z' }, now)).toBe(true); });
});
