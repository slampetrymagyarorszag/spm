import { describe, it, expect } from 'vitest';
import { submissionRecipients, notifyFallbackEmail, DEFAULT_NOTIFY_EMAIL } from '../src/lib/recipients';

describe('notifyFallbackEmail', () => {
  it('env nélkül a media@ címet adja', () => {
    expect(notifyFallbackEmail()).toBe(DEFAULT_NOTIFY_EMAIL);
    expect(notifyFallbackEmail({}, undefined)).toBe(DEFAULT_NOTIFY_EMAIL);
  });
  it('az első kitöltött env-forrást használja', () => {
    expect(notifyFallbackEmail({}, { NOTIFY_FALLBACK_EMAIL: ' szerk@x.hu ' })).toBe('szerk@x.hu');
    expect(notifyFallbackEmail({ NOTIFY_FALLBACK_EMAIL: 'a@x.hu' }, { NOTIFY_FALLBACK_EMAIL: 'b@x.hu' })).toBe('a@x.hu');
  });
});

describe('submissionRecipients', () => {
  it('üres beállítás mellett is megy értesítő a tartalék címre', () => {
    expect(submissionRecipients(undefined, 'media@slampoetry.hu')).toEqual(['media@slampoetry.hu']);
    expect(submissionRecipients({}, 'media@slampoetry.hu')).toEqual(['media@slampoetry.hu']);
  });

  it('kikapcsolt értesítés esetén sem marad el a tartalék cím', () => {
    const r = submissionRecipients({ notifyOnSubmissions: false, notifyEmail: 'admin@x.hu' }, 'media@slampoetry.hu');
    expect(r).toEqual(['media@slampoetry.hu']);
  });

  it('bekapcsolt értesítésnél a Studióban megadott cím is megkapja', () => {
    const r = submissionRecipients({ notifyOnSubmissions: true, notifyEmail: 'admin@x.hu' }, 'media@slampoetry.hu');
    expect(r).toEqual(['media@slampoetry.hu', 'admin@x.hu']);
  });

  it('a tartalék címet nem duplázza (kis-nagybetűtől és szóköztől függetlenül)', () => {
    const r = submissionRecipients({ notifyOnSubmissions: true, notifyEmail: '  Media@Slampoetry.HU ' }, 'media@slampoetry.hu');
    expect(r).toEqual(['media@slampoetry.hu']);
  });

  it('a hívó extra címzettjeit is felveszi, duplázás nélkül', () => {
    const r = submissionRecipients({ notifyOnSubmissions: true, notifyEmail: 'admin@x.hu' }, 'media@slampoetry.hu', 'jelentkezes@x.hu', 'admin@x.hu', undefined, '');
    expect(r).toEqual(['media@slampoetry.hu', 'admin@x.hu', 'jelentkezes@x.hu']);
  });

  it('érvénytelen (nem email alakú) címeket eldob', () => {
    const r = submissionRecipients({ notifyOnSubmissions: true, notifyEmail: 'nem-email' }, 'media@slampoetry.hu', 'sem email');
    expect(r).toEqual(['media@slampoetry.hu']);
  });

  it('fejléc-injekciót tartalmazó címet eldob', () => {
    const r = submissionRecipients(
      { notifyOnSubmissions: true, notifyEmail: 'a@b.hu\nBcc: tamado@rossz.hu' },
      'media@slampoetry.hu',
    );
    expect(r).toEqual(['media@slampoetry.hu']);
  });

  it('ha a tartalék cím maga is hibás, üres listát ad (nem küld vakon)', () => {
    expect(submissionRecipients({}, '')).toEqual([]);
  });

  it('az alapértelmezett tartalék cím a media@slampoetry.hu', () => {
    expect(DEFAULT_NOTIFY_EMAIL).toBe('media@slampoetry.hu');
  });
});
