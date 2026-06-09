import { describe, it, expect } from 'vitest';
import { validateSubmission, validateEventTip } from '../src/lib/validation';

describe('validateSubmission', () => {
  const ok = { name: 'Teszt Elek', email: 'teszt@example.com', message: 'Szeretnék jelentkezni.' };
  it('érvényes beküldést elfogad', () => { expect(validateSubmission(ok)).toEqual({ ok: true }); });
  it('honeypot kitöltve → spam', () => { expect(validateSubmission({ ...ok, website: 'x' })).toEqual({ ok: false, error: 'spam' }); });
  it('hiányzó név → hiba', () => { expect(validateSubmission({ ...ok, name: '' }).ok).toBe(false); });
  it('rossz email → hiba', () => { expect(validateSubmission({ ...ok, email: 'nem-email' }).ok).toBe(false); });
  it('túl rövid üzenet → hiba', () => { expect(validateSubmission({ ...ok, message: 'hi' }).ok).toBe(false); });
});

describe('validateEventTip', () => {
  const ok = { eventName: 'Slam est a Klubban', description: 'Havi nyílt mikrofon est.', facebookUrl: 'https://www.facebook.com/events/123' };
  it('érvényes esemény-tippet elfogad', () => { expect(validateEventTip(ok)).toEqual({ ok: true }); });
  it('opcionális email is elfogadott', () => { expect(validateEventTip({ ...ok, email: 'a@b.hu' })).toEqual({ ok: true }); });
  it('honeypot kitöltve → spam', () => { expect(validateEventTip({ ...ok, website: 'x' })).toEqual({ ok: false, error: 'spam' }); });
  it('hiányzó rendezvénynév → hiba', () => { expect(validateEventTip({ ...ok, eventName: '' }).ok).toBe(false); });
  it('túl rövid leírás → hiba', () => { expect(validateEventTip({ ...ok, description: 'hi' }).ok).toBe(false); });
  it('hiányzó/rossz FB link → hiba', () => { expect(validateEventTip({ ...ok, facebookUrl: 'nemlink' }).ok).toBe(false); });
  it('rossz opcionális email → hiba', () => { expect(validateEventTip({ ...ok, email: 'rossz' }).ok).toBe(false); });
});
