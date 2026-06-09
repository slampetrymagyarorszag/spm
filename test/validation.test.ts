import { describe, it, expect } from 'vitest';
import { validateSubmission, validateEventTip, validateSlammerApplication, validateChampionship } from '../src/lib/validation';

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

describe('validateSlammerApplication', () => {
  const ok = { realName: 'Kiss Anna', stageName: 'Anna', description: 'Pár éve slammelek Budapesten.', youtubeUrl: 'https://youtu.be/abc', consent: true };
  it('érvényes jelentkezést elfogad', () => { expect(validateSlammerApplication(ok)).toEqual({ ok: true }); });
  it('honeypot → spam', () => { expect(validateSlammerApplication({ ...ok, website: 'x' })).toEqual({ ok: false, error: 'spam' }); });
  it('hiányzó művésznév → hiba', () => { expect(validateSlammerApplication({ ...ok, stageName: '' }).ok).toBe(false); });
  it('túl rövid bemutatkozás → hiba', () => { expect(validateSlammerApplication({ ...ok, description: 'hi' }).ok).toBe(false); });
  it('rossz YouTube link → hiba', () => { expect(validateSlammerApplication({ ...ok, youtubeUrl: 'nem' }).ok).toBe(false); });
  it('hiányzó consent → hiba', () => { expect(validateSlammerApplication({ ...ok, consent: false }).ok).toBe(false); });
});

describe('validateChampionship', () => {
  const ok = { name: 'Nagy Béla', email: 'bela@example.hu', stageName: 'BéMC', consent: 'true' };
  it('érvényes jelentkezést elfogad', () => { expect(validateChampionship(ok)).toEqual({ ok: true }); });
  it('honeypot → spam', () => { expect(validateChampionship({ ...ok, website: 'x' })).toEqual({ ok: false, error: 'spam' }); });
  it('rossz email → hiba', () => { expect(validateChampionship({ ...ok, email: 'rossz' }).ok).toBe(false); });
  it('hiányzó művésznév → hiba', () => { expect(validateChampionship({ ...ok, stageName: '' }).ok).toBe(false); });
  it('hiányzó consent → hiba', () => { expect(validateChampionship({ ...ok, consent: undefined }).ok).toBe(false); });
});
