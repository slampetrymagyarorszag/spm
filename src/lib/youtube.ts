export type YouTubeVideo = {
  videoId: string;
  title: string;
  publishedAt: string;
  thumbnail?: string;
  url: string;
};

const SKIP_TITLES = new Set(['Private video', 'Deleted video']);

export function parsePlaylistItems(json: any): YouTubeVideo[] {
  const items = json?.items;
  if (!Array.isArray(items)) return [];
  const out: YouTubeVideo[] = [];
  for (const it of items) {
    const videoId = it?.contentDetails?.videoId;
    const title = it?.snippet?.title;
    if (!videoId || !title || SKIP_TITLES.has(title)) continue;
    out.push({
      videoId,
      title,
      publishedAt: it?.snippet?.publishedAt ?? '',
      thumbnail: it?.snippet?.thumbnails?.medium?.url ?? it?.snippet?.thumbnails?.default?.url,
      url: `https://www.youtube.com/watch?v=${videoId}`,
    });
  }
  return out;
}

// Lejátszási lista ID kinyerése: elfogad teljes URL-t (…?list=ID, akár videó-URL-ből is)
// vagy nyers ID-t. Hibás bemenetre null.
export function parsePlaylistId(input?: string): string | null {
  if (!input) return null;
  const s = input.trim();
  const m = s.match(/[?&]list=([A-Za-z0-9_-]+)/);
  if (m) return m[1];
  if (/^[A-Za-z0-9_-]{12,}$/.test(s)) return s;
  return null;
}

const API = 'https://www.googleapis.com/youtube/v3';

// A csatorna "uploads" playlist ID-jának feloldása (channel ID vagy handle alapján).
async function resolveUploadsPlaylist(apiKey: string, channelId?: string, handle?: string): Promise<string | null> {
  const params = new URLSearchParams({ part: 'contentDetails', key: apiKey });
  if (channelId) params.set('id', channelId);
  else if (handle) params.set('forHandle', handle.replace(/^@/, ''));
  else return null;
  const res = await fetch(`${API}/channels?${params}`);
  if (!res.ok) return null;
  const json = await res.json();
  return json?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads ?? null;
}

// Egy konkrét lejátszási lista legutóbbi videói (pl. „Májusi klub"). Hibára [] (graceful).
export async function fetchPlaylistItems(apiKey?: string, playlistId?: string, max = 6): Promise<YouTubeVideo[]> {
  if (!apiKey || !playlistId) return [];
  try {
    const params = new URLSearchParams({
      part: 'snippet,contentDetails', playlistId,
      maxResults: String(Math.min(max, 50)), key: apiKey,
    });
    const res = await fetch(`${API}/playlistItems?${params}`);
    if (!res.ok) return [];
    const json = await res.json();
    return parsePlaylistItems(json).slice(0, max);
  } catch {
    return [];
  }
}

// A csatorna legutóbbi feltöltései. Kulcs/azonosító hiányában vagy hibára [] (graceful).
export async function fetchChannelUploads(opts: {
  apiKey?: string; channelId?: string; handle?: string; max?: number;
}): Promise<YouTubeVideo[]> {
  const { apiKey, channelId, handle, max = 9 } = opts;
  if (!apiKey || (!channelId && !handle)) return [];
  try {
    const uploads = await resolveUploadsPlaylist(apiKey, channelId, handle);
    if (!uploads) return [];
    return await fetchPlaylistItems(apiKey, uploads, max);
  } catch {
    return [];
  }
}

export type YouTubePlaylist = {
  id: string;
  title: string;
  url: string;
  videoCount?: number;
};

// Csak a csatorna nyilvános, nem üres listái: külön CMS-írás vagy cron nélkül.
export async function fetchChannelPlaylists(opts: {
  apiKey?: string; channelId?: string; handle?: string; max?: number;
}): Promise<YouTubePlaylist[]> {
  const { apiKey, handle, max = 12 } = opts;
  if (!apiKey || (!opts.channelId && !handle)) return [];
  try {
    let channelId = opts.channelId;
    if (!channelId) {
      const params = new URLSearchParams({ part: 'id', forHandle: handle!.replace(/^@/, ''), key: apiKey });
      const res = await fetch(`${API}/channels?${params}`, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) return [];
      channelId = (await res.json())?.items?.[0]?.id;
    }
    if (!channelId) return [];
    const params = new URLSearchParams({
      part: 'snippet,contentDetails,status', channelId, maxResults: '50', key: apiKey,
    });
    const res = await fetch(`${API}/playlists?${params}`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const json = await res.json();
    if (!Array.isArray(json?.items)) return [];
    return json.items
      .filter((item: any) => parsePlaylistId(item?.id) && item?.snippet?.title && item?.status?.privacyStatus === 'public' && item?.contentDetails?.itemCount > 0)
      .sort((a: any, b: any) => String(b.snippet.publishedAt ?? '').localeCompare(String(a.snippet.publishedAt ?? '')))
      .slice(0, Math.max(0, Math.min(max, 50)))
      .map((item: any) => ({
        id: item.id, title: item.snippet.title,
        url: `https://www.youtube.com/playlist?list=${item.id}`,
        videoCount: item.contentDetails.itemCount,
      }));
  } catch {
    return [];
  }
}

// A szerkesztő címe elsőbbséget kap; egy lista csak egyszer jelenhet meg.
export function mergePlaylistDefinitions(
  manual: { id: string | null; title?: string }[],
  automatic: YouTubePlaylist[],
): YouTubePlaylist[] {
  const automaticById = new Map(automatic.map(item => [item.id, item]));
  const manualById = new Map<string, { title?: string }>();
  for (const item of manual) {
    if (item.id && !manualById.has(item.id)) manualById.set(item.id, item);
  }
  const merged = new Map<string, YouTubePlaylist>();
  for (const item of [...automatic, ...manual]) {
    if (!item.id || !parsePlaylistId(item.id) || merged.has(item.id)) continue;
    merged.set(item.id, {
      ...automaticById.get(item.id),
      id: item.id,
      title: manualById.get(item.id)?.title || item.title || 'Lejátszási lista',
      url: `https://www.youtube.com/playlist?list=${item.id}`,
    });
  }
  return [...merged.values()];
}
