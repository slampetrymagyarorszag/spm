import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const measurementId = 'G-5C2MJJBY5L';

beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal('window', {});
  vi.stubGlobal('location', {
    origin: 'https://slampoetry.hu',
    pathname: '/esemenyek/verseny',
    reload: vi.fn(),
  });
  vi.stubGlobal('document', {
    cookie: '',
    referrer: 'https://www.google.com/search?q=private',
    createElement: vi.fn(() => ({})),
    head: { append: vi.fn() },
  });
  const values = new Map();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  });
});

afterEach(() => vi.unstubAllGlobals());

it('does not load the Google tag or record events before consent or after refusal', async () => {
  const analytics = await import('../src/lib/analytics');
  expect(analytics.getAnalyticsPreference()).toBeNull();
  analytics.trackRegistration('event');
  analytics.setAnalyticsPreference('declined');
  analytics.trackTicketClick('verseny');
  expect(analytics.getAnalyticsPreference()).toBe('declined');
  expect(document.head.append).not.toHaveBeenCalled();
  expect(window).not.toHaveProperty('dataLayer');
});

it('tracks the two requested events after consent and stops after revocation', async () => {
  const analytics = await import('../src/lib/analytics');
  analytics.setAnalyticsPreference('accepted');
  expect(analytics.getAnalyticsPreference()).toBe('accepted');
  analytics.startAnalytics();
  analytics.trackTicketClick('verseny');
  analytics.trackRegistration('championship');

  expect(document.head.append).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
    src: `https://www.googletagmanager.com/gtag/js?id=${measurementId}`,
  }));
  const commands = (window as Window & { dataLayer: ArrayLike<unknown>[] }).dataLayer.map(args => Array.from(args));
  expect(commands.slice(1)).toEqual([
    ['config', measurementId, expect.objectContaining({
      page_location: 'https://slampoetry.hu/esemenyek/verseny',
      page_referrer: 'https://www.google.com',
    })],
    ['event', 'ticket_link_click', { event_slug: 'verseny' }],
    ['event', 'registration_success', { registration_type: 'championship' }],
  ]);
  analytics.setAnalyticsPreference('declined');
  analytics.trackRegistration('monthly_contest');
  expect(window).toHaveProperty(`ga-disable-${measurementId}`, true);
  expect(window).toHaveProperty('dataLayer.length', commands.length);
  expect(location.reload).toHaveBeenCalledOnce();
});

it('does not send data from preview or development hosts', async () => {
  vi.stubGlobal('location', { origin: 'http://localhost:4321' });
  const analytics = await import('../src/lib/analytics');
  analytics.setAnalyticsPreference('accepted');
  expect(document.head.append).not.toHaveBeenCalled();
});
