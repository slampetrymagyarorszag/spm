import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchChannelPlaylists, mergePlaylistDefinitions } from '../src/lib/youtube';

afterEach(() => vi.unstubAllGlobals());
describe('automatic channel playlists', () => {
  it('keeps public nonempty playlists, newest first', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ items: [
      { id: 'PLold12345678', snippet: { title: 'Régi', publishedAt: '2025-01-01' }, status: { privacyStatus: 'public' }, contentDetails: { itemCount: 4 } },
      { id: 'PLprivate123', snippet: { title: 'Private', publishedAt: '2026-11-26' }, status: { privacyStatus: 'private' }, contentDetails: { itemCount: 2 } },
      { id: 'PLempty12345', snippet: { title: 'Empty', publishedAt: '2026-11-26' }, status: { privacyStatus: 'public' }, contentDetails: { itemCount: 0 } },
      { id: 'PLnew12345678', snippet: { title: 'Új', publishedAt: '2026-11-25' }, status: { privacyStatus: 'public' }, contentDetails: { itemCount: 28 } },
    ] }) });
    vi.stubGlobal('fetch', fetcher);
    const result = await fetchChannelPlaylists({ apiKey: 'test', channelId: 'UCtest', max: 2 });
    expect(result.map(p => p.id)).toEqual(['PLnew12345678', 'PLold12345678']);
    expect(result[0]).toMatchObject({ title: 'Új', videoCount: 28, url: 'https://www.youtube.com/playlist?list=PLnew12345678' });
    const request = new URL(String(fetcher.mock.calls[0][0]));
    expect(request.searchParams.get('channelId')).toBe('UCtest');
    expect(request.searchParams.get('maxResults')).toBe('50');
  });
  it('does not call the API without credentials or channel information', async () => {
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    expect(await fetchChannelPlaylists({ channelId: 'UCtest' })).toEqual([]);
    expect(await fetchChannelPlaylists({ apiKey: 'test' })).toEqual([]);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('returns an empty list on API failure so manual playlists remain usable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    expect(await fetchChannelPlaylists({ apiKey: 'test', channelId: 'UCtest' })).toEqual([]);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    expect(await fetchChannelPlaylists({ apiKey: 'test', channelId: 'UCtest' })).toEqual([]);
  });
  it('resolves the configured handle when no channel ID is supplied', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [{ id: 'UCresolved' }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) });
    vi.stubGlobal('fetch', fetcher);
    await fetchChannelPlaylists({ apiKey: 'test', handle: '@slampoetry' });
    expect(new URL(String(fetcher.mock.calls[0][0])).searchParams.get('forHandle')).toBe('slampoetry');
    expect(new URL(String(fetcher.mock.calls[1][0])).searchParams.get('channelId')).toBe('UCresolved');
  });
});
describe('playlist deduplication', () => {
  it('preserves editorial titles and automatic counts, filters invalid IDs', () => {
    const result = mergePlaylistDefinitions([
      { id: 'PLnew12345678', title: 'Saját cím' },
      { id: 'PLnew12345678', title: 'Duplikáció' },
      { id: null, title: 'Hibás' },
    ], [
      { id: 'PLnew12345678', title: 'YouTube cím', url: 'https://www.youtube.com/playlist?list=PLnew12345678', videoCount: 28 },
      { id: 'PLold12345678', title: 'Másik lista', url: 'https://www.youtube.com/playlist?list=PLold12345678', videoCount: 3 },
    ]);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ title: 'Saját cím', videoCount: 28 });
    expect(result[1].id).toBe('PLold12345678');
  });
});

it('puts fresh channel playlists first while retaining editorial titles', () => {
  const merged = mergePlaylistDefinitions([
    { id: 'PLold12345678', title: 'Saját régi cím' },
    { id: 'PLnew12345678', title: 'Saját új cím' },
  ], [
    { id: 'PLnew12345678', title: 'Új', url: 'https://www.youtube.com/playlist?list=PLnew12345678' },
    { id: 'PLold12345678', title: 'Régi', url: 'https://www.youtube.com/playlist?list=PLold12345678' },
  ]);
  expect(merged.map(p => p.id)).toEqual(['PLnew12345678', 'PLold12345678']);
  expect(merged[0].title).toBe('Saját új cím');
});
