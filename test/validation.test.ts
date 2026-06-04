import { describe, it, expect } from 'vitest';
import { validateSubmission } from '../src/lib/validation';

describe('validateSubmission', () => {
  const ok = { name: 'Teszt Elek', email: 'teszt@example.com', message: 'Szeretnék jelentkezni.' };
  it('érvényes beküldést elfogad', () => { expect(validateSubmission(ok)).toEqual({ ok: true }); });
  it('honeypot kitöltve → spam', () => { expect(validateSubmission({ ...ok, website: 'x' })).toEqual({ ok: false, error: 'spam' }); });
  it('hiányzó név → hiba', () => { expect(validateSubmission({ ...ok, name: '' }).ok).toBe(false); });
  it('rossz email → hiba', () => { expect(validateSubmission({ ...ok, email: 'nem-email' }).ok).toBe(false); });
  it('túl rövid üzenet → hiba', () => { expect(validateSubmission({ ...ok, message: 'hi' }).ok).toBe(false); });
});
