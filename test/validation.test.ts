import { describe, it, expect } from 'vitest';
import { validateSubmission, validateEventTip, validateSlammerApplication, validateChampionship, validateMonthlyContest, validateSlamClub, validateSlammerEdit, collectValidUrls } from '../src/lib/validation';

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
  it('hiányzó művésznév is elfogadható (opcionális)', () => { expect(validateSlammerApplication({ ...ok, stageName: '' }).ok).toBe(true); });
  it('túl rövid bemutatkozás → hiba', () => { expect(validateSlammerApplication({ ...ok, description: 'hi' }).ok).toBe(false); });
  it('rossz YouTube link → hiba', () => { expect(validateSlammerApplication({ ...ok, youtubeUrl: 'nem' }).ok).toBe(false); });
  it('hiányzó YouTube link is elfogadható (opcionális)', () => { expect(validateSlammerApplication({ ...ok, youtubeUrl: '' }).ok).toBe(true); });
  it('hiányzó consent → hiba', () => { expect(validateSlammerApplication({ ...ok, consent: false }).ok).toBe(false); });
});

describe('collectValidUrls', () => {
  it('több érvényes linket összegyűjt, üreseket kihagy', () => {
    const r = collectValidUrls(['https://youtu.be/a', '', '  https://youtu.be/b  ']);
    expect(r).toEqual({ ok: true, urls: ['https://youtu.be/a', 'https://youtu.be/b'] });
  });
  it('üres lista → üres tömb, ok', () => { expect(collectValidUrls([])).toEqual({ ok: true, urls: [] }); });
  it('csak üresek → üres tömb, ok', () => { expect(collectValidUrls(['', '   '])).toEqual({ ok: true, urls: [] }); });
  it('érvénytelen link → hiba', () => { expect((collectValidUrls(['nem-url']) as any).ok).toBe(false); });
  it('duplikátumot kiszűr', () => { expect((collectValidUrls(['https://x.hu/1', 'https://x.hu/1']) as any).urls).toEqual(['https://x.hu/1']); });
  it('a max darabszámot betartja', () => { expect((collectValidUrls(['https://a.hu','https://b.hu','https://c.hu'], 2) as any).urls.length).toBe(2); });
});

describe('validateChampionship', () => {
  const ok = { name: 'Nagy Béla', email: 'bela@example.hu', stageName: 'BéMC', consent: 'true' };
  it('érvényes jelentkezést elfogad', () => { expect(validateChampionship(ok)).toEqual({ ok: true }); });
  it('honeypot → spam', () => { expect(validateChampionship({ ...ok, website: 'x' })).toEqual({ ok: false, error: 'spam' }); });
  it('rossz email → hiba', () => { expect(validateChampionship({ ...ok, email: 'rossz' }).ok).toBe(false); });
  it('hiányzó művésznév → hiba', () => { expect(validateChampionship({ ...ok, stageName: '' }).ok).toBe(false); });
  it('hiányzó consent → hiba', () => { expect(validateChampionship({ ...ok, consent: undefined }).ok).toBe(false); });
});

describe('validateMonthlyContest', () => {
  const ok = { name: 'Tóth Rita', email: 'rita@example.hu', entryType: 'verseny' };
  it('érvényes (verseny) jelentkezést elfogad', () => { expect(validateMonthlyContest(ok)).toEqual({ ok: true }); });
  it('érvényes (open mic) jelentkezést elfogad', () => { expect(validateMonthlyContest({ ...ok, entryType: 'openmic' })).toEqual({ ok: true }); });
  it('honeypot → spam', () => { expect(validateMonthlyContest({ ...ok, website: 'x' })).toEqual({ ok: false, error: 'spam' }); });
  it('hiányzó név → hiba', () => { expect(validateMonthlyContest({ ...ok, name: '' }).ok).toBe(false); });
  it('rossz email → hiba', () => { expect(validateMonthlyContest({ ...ok, email: 'rossz' }).ok).toBe(false); });
  it('ismeretlen típus → hiba', () => { expect(validateMonthlyContest({ ...ok, entryType: 'egyeb' }).ok).toBe(false); });
});

describe('validateSlamClub', () => {
  const ok = { city: 'Szeged', name: 'Slam Poetry Szeged', facebookUrl: 'https://www.facebook.com/szegedslampoetry' };
  it('érvényes klubot elfogad', () => { expect(validateSlamClub(ok)).toEqual({ ok: true }); });
  it('honeypot → spam', () => { expect(validateSlamClub({ ...ok, website: 'x' })).toEqual({ ok: false, error: 'spam' }); });
  it('hiányzó város → hiba', () => { expect(validateSlamClub({ ...ok, city: '' }).ok).toBe(false); });
  it('rossz link → hiba', () => { expect(validateSlamClub({ ...ok, facebookUrl: 'nem' }).ok).toBe(false); });
});

describe('validateSlammerEdit', () => {
  const base = { slammerSlug: 'teszt-elek' };
  it('bio-módosítással elfogad', () => { expect(validateSlammerEdit({ ...base, bioChange: 'Új bemutatkozás szöveg.' }).ok).toBe(true); });
  it('csak törlés-kéréssel elfogad', () => { expect(validateSlammerEdit({ ...base, removeRequest: '1' }).ok).toBe(true); });
  it('feltöltött fotóval elfogad', () => { expect(validateSlammerEdit({ ...base, hasPhoto: true }).ok).toBe(true); });
  it('üres kérés → hiba', () => { expect(validateSlammerEdit({ ...base }).ok).toBe(false); });
  it('hiányzó slug → hiba', () => { expect(validateSlammerEdit({ bioChange: 'valami szöveg' }).ok).toBe(false); });
  it('honeypot → spam', () => { expect(validateSlammerEdit({ ...base, bioChange: 'x szöveg', website: 'bot' })).toEqual({ ok: false, error: 'spam' }); });
});
