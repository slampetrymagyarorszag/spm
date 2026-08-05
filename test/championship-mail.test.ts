import { describe, it, expect } from 'vitest';
import {
  championshipConfirmationHtml,
  championshipConfirmationSubject,
  resolveSocial,
  DEFAULT_SOCIAL,
} from '../src/lib/championshipMail';

describe('resolveSocial', () => {
  it('a CMS-ben megadott linkeket használja', () => {
    const r = resolveSocial({ facebook: 'https://fb.com/sajat', instagram: 'https://insta.com/sajat' });
    expect(r.facebook).toBe('https://fb.com/sajat');
    expect(r.instagram).toBe('https://insta.com/sajat');
    expect(r.tiktok).toBe(DEFAULT_SOCIAL.tiktok);
  });

  it('hiányzó linknél az ismert alapértelmezésre esik vissza', () => {
    expect(resolveSocial()).toEqual(DEFAULT_SOCIAL);
    expect(resolveSocial({ facebook: '   ' }).facebook).toBe(DEFAULT_SOCIAL.facebook);
  });

  it('nem http(s) sémájú linket eldob (javascript:, adat-URL)', () => {
    expect(resolveSocial({ facebook: 'javascript:alert(1)' }).facebook).toBe(DEFAULT_SOCIAL.facebook);
    expect(resolveSocial({ tiktok: 'data:text/html,<script>' }).tiktok).toBe(DEFAULT_SOCIAL.tiktok);
  });
});

describe('championshipConfirmationHtml', () => {
  it('megszólítja a jelentkezőt és visszaigazol', () => {
    const html = championshipConfirmationHtml({ name: 'Teszt Elek' });
    expect(html).toContain('Kedves Teszt Elek!');
    expect(html).toContain('rögzítettük');
  });

  it('név nélkül semleges megszólítást használ', () => {
    expect(championshipConfirmationHtml({})).toContain('Szia!');
  });

  it('visszaírja a megjelölt napokat', () => {
    const html = championshipConfirmationHtml({ days: ['Péntek', 'Vasárnap'] });
    expect(html).toContain('Péntek, Vasárnap');
  });

  it('nap nélkül nem ír ki üres „Amit megjelöltél" sort', () => {
    expect(championshipConfirmationHtml({ days: [] })).not.toContain('Amit megjelöltél');
  });

  it('tartalmazza mindhárom közösségi linket', () => {
    const html = championshipConfirmationHtml({});
    expect(html).toContain(DEFAULT_SOCIAL.facebook);
    expect(html).toContain(DEFAULT_SOCIAL.instagram);
    expect(html).toContain(DEFAULT_SOCIAL.tiktok);
  });

  it('escapeli a jelentkező nevét (nem enged HTML-injekciót)', () => {
    const html = championshipConfirmationHtml({ name: '<script>alert(1)</script>' });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('a tárgy utal a jelentkezésre', () => {
    expect(championshipConfirmationSubject()).toMatch(/jelentkez/i);
  });
});
