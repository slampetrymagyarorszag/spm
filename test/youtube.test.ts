import { describe, it, expect } from 'vitest';
import { parsePlaylistItems } from '../src/lib/youtube';

const sample = {
  items: [
    { snippet: { title: 'Slam est 2026', publishedAt: '2026-05-01T18:00:00Z', thumbnails: { medium: { url: 'https://i.ytimg.com/vi/abc/mq.jpg' } } }, contentDetails: { videoId: 'abc12345678' } },
    { snippet: { title: 'Private video', publishedAt: '2026-04-01T00:00:00Z' }, contentDetails: { videoId: 'zzz' } },
    { snippet: { title: 'Régi fellépés', publishedAt: '2025-01-01T00:00:00Z', thumbnails: {} }, contentDetails: { videoId: 'def12345678' } },
  ],
};

describe('parsePlaylistItems', () => {
  it('normalizálja a videókat', () => {
    const out = parsePlaylistItems(sample);
    expect(out).toHaveLength(2); // a "Private video" kimarad
    expect(out[0]).toEqual({
      videoId: 'abc12345678',
      title: 'Slam est 2026',
      publishedAt: '2026-05-01T18:00:00Z',
      thumbnail: 'https://i.ytimg.com/vi/abc/mq.jpg',
      url: 'https://www.youtube.com/watch?v=abc12345678',
    });
  });
  it('kiszűri a privát/törölt videókat', () => {
    const out = parsePlaylistItems(sample);
    expect(out.find((v) => v.videoId === 'zzz')).toBeUndefined();
  });
  it('üres/hibás bemenetre üres tömb', () => {
    expect(parsePlaylistItems(null)).toEqual([]);
    expect(parsePlaylistItems({})).toEqual([]);
  });
});
