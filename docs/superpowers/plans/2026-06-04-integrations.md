# Slam Poetry MO — 4. terv: Integrációk (YouTube auto-szinkron) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** A YouTube-csatorna feltöltéseinek automatikus megjelenítése a médiatárban (build-időben élő lekérés + összefésülés a Studióban kezelt elemekkel), kézi munka nélkül.

**Architecture:** Egy `src/lib/youtube.ts` helper a YouTube Data API v3-hoz: a network-fetch külön a tiszta, tesztelhető parser-logikától. A `/mediatar` oldal build-időben lekéri a csatorna feltöltéseit (ha van `YOUTUBE_API_KEY`), és **összefésüli** a Sanity `mediaItem` elemekkel (FB albumok, képek, kézi videók). Kulcs hiányában a YouTube-rész kimarad (graceful), a Sanity-elemek továbbra is megjelennek. A Facebook rész szándékosan **link-alapú** marad (FacebookAlbumCard/FacebookEventEmbed már kész) — az App Review/zárt esemény-API miatt nincs automatika.

**Tech:** YouTube Data API v3 (REST, fetch), Vitest (parser). Env: `YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_ID` (UC… formátum) VAGY `YOUTUBE_CHANNEL_HANDLE` (pl. `@slampoetry`).

**Előfeltétel (a usernek):** YouTube Data API kulcs (Google Cloud Console → YouTube Data API v3 engedélyezés → API key) és a csatorna azonosítója (channel ID vagy handle). Ezek a `.env`-be kerülnek; kulcs nélkül a feature kódja kész és tesztelt, csak a live lekérés marad ki.

---

## Fájlszerkezet

```
.env.example                 # + YOUTUBE_API_KEY, YOUTUBE_CHANNEL_ID, YOUTUBE_CHANNEL_HANDLE
src/lib/
  youtube.ts                 # parsePlaylistItems (tiszta) + fetchChannelUploads (network)
src/pages/mediatar/index.astro  # merge: YouTube videók + Sanity mediaItemek
test/
  youtube.test.ts            # parsePlaylistItems tesztek
```

---

### Task 1: YouTube parser + fetch helper (TDD a parserre)

**Files:** Create `src/lib/youtube.ts`, `test/youtube.test.ts`; Modify `.env.example`

- [ ] **Step 1: Env**

`.env.example`-hez add (tartsd meg a meglévőket):
```
YOUTUBE_API_KEY=your_youtube_data_api_key
YOUTUBE_CHANNEL_ID=
YOUTUBE_CHANNEL_HANDLE=@slampoetry
```
Add a helyi `.env`-hez is (placeholder/üres a kulcs).

- [ ] **Step 2: Teszt előbb**

Create `test/youtube.test.ts`:
```ts
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
```

- [ ] **Step 3: Futtasd — bukjon** (`npm test` → nincs `../src/lib/youtube`).

- [ ] **Step 4: Implementáció**

Create `src/lib/youtube.ts`:
```ts
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

// A csatorna legutóbbi feltöltései. Kulcs/azonosító hiányában vagy hibára [] (graceful).
export async function fetchChannelUploads(opts: {
  apiKey?: string; channelId?: string; handle?: string; max?: number;
}): Promise<YouTubeVideo[]> {
  const { apiKey, channelId, handle, max = 24 } = opts;
  if (!apiKey || (!channelId && !handle)) return [];
  try {
    const uploads = await resolveUploadsPlaylist(apiKey, channelId, handle);
    if (!uploads) return [];
    const params = new URLSearchParams({
      part: 'snippet,contentDetails', playlistId: uploads,
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
```

- [ ] **Step 5: Futtasd — menjen át** (`npm test` → 3 új youtube teszt; összesen 25).

- [ ] **Step 6: Build + commit**

`npm run build` sikeres.
```bash
git add -A
git commit -m "feat: add YouTube Data API helper (parser + channel uploads fetch)"
```
(Author `Claude <noreply@anthropic.com>`; commit body vége: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`)

---

### Task 2: Médiatár — YouTube + Sanity merge

**Files:** Modify `src/pages/mediatar/index.astro`

- [ ] **Step 1: Az oldal újraírása mergével**

A `/mediatar` build-időben lekéri a YouTube feltöltéseket (env-ből) ÉS a Sanity mediaItemeket, majd két szekcióban jeleníti meg: élő YouTube-videók (YouTubeEmbed) + Studió-elemek (MediaCard: albumok/képek/kézi videók). Üres-állapot-biztos.

Replace `src/pages/mediatar/index.astro`:
```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import PageHero from '../../components/PageHero.astro';
import SectionHeader from '../../components/SectionHeader.astro';
import MediaCard from '../../components/MediaCard.astro';
import YouTubeEmbed from '../../components/YouTubeEmbed.astro';
import { getMedia } from '../../sanity/lib/api';
import { fetchChannelUploads } from '../../lib/youtube';
import { sanityClient } from 'sanity:client';

const env = import.meta.env;
const [media, videos] = await Promise.all([
  getMedia(sanityClient),
  fetchChannelUploads({
    apiKey: env.YOUTUBE_API_KEY ?? process.env.YOUTUBE_API_KEY,
    channelId: env.YOUTUBE_CHANNEL_ID ?? process.env.YOUTUBE_CHANNEL_ID,
    handle: env.YOUTUBE_CHANNEL_HANDLE ?? process.env.YOUTUBE_CHANNEL_HANDLE,
    max: 24,
  }),
]);
const hasAny = media.length > 0 || videos.length > 0;
---
<BaseLayout title="Médiatár">
  <PageHero label="Videók és képek" title="Médiatár" lead="Fellépések, versenyek, archív anyagok." />
  <section class="mx-auto max-w-6xl px-4 py-16">
    {!hasAny && <p class="text-muted">Hamarosan feltöltjük a médiatárat.</p>}

    {videos.length > 0 && (
      <div class="mb-16">
        <SectionHeader label="YouTube" title="Legújabb videók" />
        <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {videos.map((v) => (
            <figure>
              <YouTubeEmbed url={v.url} title={v.title} />
              <figcaption class="mt-2 font-display">{v.title}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    )}

    {media.length > 0 && (
      <div>
        <SectionHeader label="Galéria" title="Albumok és képek" />
        <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {media.map((item) => <MediaCard item={item} />)}
        </div>
      </div>
    )}
  </section>
</BaseLayout>
```

- [ ] **Step 2: Build verifikáció (kulcs nélkül graceful)**

`npm run build` sikeres. Kulcs nélkül (`YOUTUBE_API_KEY` üres) a YouTube-szekció nem jelenik meg, a Sanity-rész igen; üres datasettel az „Hamarosan" állapot. Nincs build-hiba a hiányzó kulcs miatt.

- [ ] **Step 3: Commit**
```bash
git add -A
git commit -m "feat: media library merges live YouTube uploads with Sanity items"
```

---

### Task 3: Verifikáció

- [ ] **Step 1: Tesztek + build**

`npm test` (összes zöld, 25), `npm run build` sikeres.

- [ ] **Step 2: Élő füstteszt (ha van kulcs)**

Ha a `.env`-ben van valódi `YOUTUBE_API_KEY` + csatorna, `npm run dev` után a `/mediatar` mutassa a csatorna legújabb videóit (beágyazva). Kulcs nélkül a Sanity-elemek látszanak. (Live kulcs nélkül ez a lépés kihagyható.)

- [ ] **Step 3: Commit (ha volt módosítás)**
```bash
git add -A
git commit -m "chore: verify media integrations"
```

---

## Self-Review

- **Spec-lefedettség:** YouTube Data API auto-szinkron a médiatárba (build-időben, merge) ✓; FB album/event szándékosan link-alapú (már kész) ✓.
- **Placeholder:** nincs TBD; a `YOUTUBE_API_KEY` üres értéke szándékos (a user adja), a feature graceful nélküle.
- **Robosztusság:** a `fetchChannelUploads` minden hibára/üres configra `[]`-t ad (a build sosem törik a YouTube miatt); a privát/törölt videók kiszűrve; max 50/lekérés (kvótakímélő).
- **Típus:** `YouTubeVideo` egységes a parser és az oldal közt.

## Függőség / a usernek

- **YouTube Data API kulcs** (Google Cloud Console) + a csatorna **channel ID** (UC…) vagy **handle** (@…) a `.env`-be.
- A „mindig friss" működéshez a deploy-fázisban ütemezett újraépítés (Vercel cron / scheduled deploy) — a build-időben húzza a legfrissebb videókat.
