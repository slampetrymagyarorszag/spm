import { describe, it, expect, vi } from 'vitest';
import { getSiteSettings } from '../src/sanity/lib/api';

describe('getSiteSettings', () => {
  it('lekéri a siteSettings dokumentumot a kliensből', async () => {
    const fakeClient = { fetch: vi.fn().mockResolvedValue({ title: 'Slam Poetry MO', accentColor: '#b13bd6' }) };
    const result = await getSiteSettings(fakeClient as any);
    expect(fakeClient.fetch).toHaveBeenCalledOnce();
    expect(result.title).toBe('Slam Poetry MO');
    expect(result.accentColor).toBe('#b13bd6');
  });
});
