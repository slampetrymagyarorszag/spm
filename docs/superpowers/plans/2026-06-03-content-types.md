# Slam Poetry MO — 2. terv: Tartalomtípusok + kreatív frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Felépíteni az összes tartalomtípust (hírek, slammerek, események, médiatár, statikus oldalak, kapcsolat) a Sanity sémáktól a lista/részlet oldalakig, izgalmas, tagolt (base-443-ihlette) frontenddel és egy görgetést követő 3D mikrofon-elemmel.

**Architecture:** Az 1. tervben felépített Astro + Sanity (`/admin` Studio) + Tailwind v4 alapra épül. Minden tartalomtípus: (1) Sanity dokumentum-séma, (2) a Studio desk-struktúrába kötés, (3) GROQ lekérdezés + típusos helper, (4) Astro lista- és részlet-oldalak újrafelhasználható kártya- és szekció-komponensekkel. A gazdag szöveget Portable Text rendereli. A vizuális izgalmat egy közös, erősen tagolt szekció-rendszer (nagy display tipográfia, aszimmetrikus rácsok, sötét/világos váltakozás) és a `ScrollMic` (görgésre pin-elt + transzformált 3D mikrofon-fotó, `public/mic-3d.png`) adja.

**Tech Stack:** Astro, Sanity, Tailwind v4, `astro-portabletext` (Portable Text → HTML), `@sanity/image-url` (képek), React-islands a kliensoldali kereséshez/szűréshez, Vitest.

**Fontos elvek:**
- Üres dataset-biztos: minden lista/oldal kecsesen renderel, ha még nincs tartalom (a migráció és a kézi feltöltés később jön).
- A jelentkezési **űrlap működése és az email-küldés a 3. terv** — itt csak az esemény-séma regisztrációs MEZŐI és a jelentkezés ÁLLAPOTÁNAK megjelenítése készül (a működő form + email a 3. tervben).
- YouTube auto-szinkron és FB album automatika a 4. terv; itt a `mediaItem` séma és a kézi `YouTubeEmbed` / `FacebookAlbumCard` / `FacebookEventEmbed` komponensek készülnek.

**Provizórikus design-elv (base-443-ihlette tagolás):** széles, légző szekciók; sötét hero-sáv nagy `font-display` címmel + világos tartalmi sáv; aszimmetrikus 12-oszlopos rács (pl. cím 5 oszlop / tartalom 7); accent-vonalak és kis `label` feliratok a szekciók fölött.

---

## Fájlszerkezet (létrejövő/érintett fájlok)

```
src/sanity/
  schemaTypes/
    index.ts                # bővül: összes típus regisztrálása
    blockContent.ts         # Portable Text séma (rich text)
    post.ts                 # hír/blog
    slammer.ts              # előadó
    event.ts                # esemény (+ regisztrációs mezők, FB event url, fellépők)
    mediaItem.ts            # médiatár elem (videó/kép/album)
    page.ts                 # statikus oldal (Mi az a slam, Egyesület)
    objects/location.ts     # esemény helyszín objektum
  structure.ts              # bővül: minden típus a deskbe
  lib/
    queries.ts              # bővül: minden lekérdezés
    api.ts                  # bővül: típusok + helperek
    image.ts                # @sanity/image-url helper (urlForImage)
    events.ts               # esemény-státusz logika (upcoming/past) + teszt
src/components/
  RichText.astro            # Portable Text renderer
  SectionHeader.astro       # base-443-ihlette szekció-fejléc
  PageHero.astro            # oldal-hero (sötét, nagy display cím, opcionális ScrollMic)
  ScrollMic.astro           # görgésre pin-elt 3D mikrofon
  PostCard.astro
  SlammerCard.astro
  EventCard.astro
  MediaCard.astro
  YouTubeEmbed.astro
  FacebookEventEmbed.astro
  FacebookAlbumCard.astro
  islands/
    SlammerSearch.tsx       # kliensoldali kereső (React island)
    EventFilter.tsx         # közelgő/korábbi szűrő (React island)
src/pages/
  hirek/index.astro
  hirek/[slug].astro
  slammerek/index.astro
  slammerek/[slug].astro
  esemenyek/index.astro
  esemenyek/[slug].astro
  mediatar/index.astro
  mi-az-a-slam-poetry.astro
  egyesulet.astro
  kapcsolat.astro
test/
  events.test.ts            # esemény-státusz logika tesztje
  slammer-search.test.ts    # kereső-szűrő logika tesztje
```

---

## Phase A — Tartalom-infrastruktúra és kreatív keret

### Task 1: Portable Text séma + RichText renderer + képhelper

**Files:**
- Create: `src/sanity/schemaTypes/blockContent.ts`, `src/components/RichText.astro`, `src/sanity/lib/image.ts`
- Modify: `src/sanity/schemaTypes/index.ts`
- Install: `astro-portabletext`, `@portabletext/types`, `@sanity/image-url`

- [ ] **Step 1: Függőségek telepítése**

Run:
```bash
npm install astro-portabletext @portabletext/types @sanity/image-url
```
Expected: a három csomag bekerül a `dependencies` közé.

- [ ] **Step 2: blockContent séma**

Create `src/sanity/schemaTypes/blockContent.ts`:
```ts
import { defineType, defineArrayMember } from 'sanity';

export const blockContent = defineType({
  name: 'blockContent',
  title: 'Szöveg',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        { title: 'Normál', value: 'normal' },
        { title: 'Cím', value: 'h2' },
        { title: 'Alcím', value: 'h3' },
        { title: 'Idézet', value: 'blockquote' },
      ],
      marks: {
        decorators: [
          { title: 'Félkövér', value: 'strong' },
          { title: 'Dőlt', value: 'em' },
        ],
        annotations: [
          {
            name: 'link',
            type: 'object',
            title: 'Link',
            fields: [{ name: 'href', type: 'url', title: 'URL' }],
          },
        ],
      },
    }),
    defineArrayMember({ type: 'image', options: { hotspot: true } }),
  ],
});
```

- [ ] **Step 3: Séma regisztrálása**

Replace `src/sanity/schemaTypes/index.ts`:
```ts
import { siteSettings } from './siteSettings';
import { blockContent } from './blockContent';

export const schemaTypes = [siteSettings, blockContent];
```

- [ ] **Step 4: Kép-URL helper**

Create `src/sanity/lib/image.ts`:
```ts
import imageUrlBuilder from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';

const projectId =
  (import.meta as any).env?.PUBLIC_SANITY_PROJECT_ID ?? process.env.PUBLIC_SANITY_PROJECT_ID!;
const dataset =
  (import.meta as any).env?.PUBLIC_SANITY_DATASET ?? process.env.PUBLIC_SANITY_DATASET!;

const builder = imageUrlBuilder({ projectId, dataset });

export function urlForImage(source: SanityImageSource) {
  return builder.image(source);
}
```

- [ ] **Step 5: RichText renderer**

Create `src/components/RichText.astro`:
```astro
---
import { PortableText } from 'astro-portabletext';
interface Props { value: any }
const { value } = Astro.props;
---
{value && (
  <div class="prose-spm max-w-none">
    <PortableText value={value} />
  </div>
)}
```

- [ ] **Step 6: prose-spm alap stílus**

Append to `src/styles/global.css`:
```css
.prose-spm { line-height: 1.7; }
.prose-spm h2 { font-family: var(--font-display); text-transform: uppercase; font-size: 1.8rem; margin: 2rem 0 0.75rem; }
.prose-spm h3 { font-weight: 700; font-size: 1.25rem; margin: 1.5rem 0 0.5rem; }
.prose-spm p { margin: 0 0 1rem; }
.prose-spm a { color: var(--color-accent); text-decoration: underline; }
.prose-spm blockquote { border-left: 3px solid var(--color-accent); padding-left: 1rem; font-style: italic; margin: 1.5rem 0; }
.prose-spm img { border-radius: 0.5rem; margin: 1.5rem 0; }
```

- [ ] **Step 7: Build verifikáció**

Run: `npm run build`
Expected: build sikeres (a Studio felismeri a blockContent típust, a komponensek fordulnak).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add portable text schema, RichText renderer and image helper"
```
(Author: `git -c user.name="Claude" -c user.email="noreply@anthropic.com"`, commit body vége: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`)

---

### Task 2: Kreatív keret — SectionHeader, PageHero, ScrollMic

**Files:** Create `src/components/SectionHeader.astro`, `src/components/PageHero.astro`, `src/components/ScrollMic.astro`

- [ ] **Step 1: SectionHeader (base-443-ihlette tagolás)**

Create `src/components/SectionHeader.astro`:
```astro
---
interface Props { label?: string; title: string; align?: 'left' | 'center' }
const { label, title, align = 'left' } = Astro.props;
---
<header class={`mb-10 ${align === 'center' ? 'text-center' : ''}`}>
  {label && (
    <p class="mb-2 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-accent">
      <span class="h-px w-8 bg-accent"></span>{label}
    </p>
  )}
  <h2 class="font-display text-4xl md:text-6xl leading-[0.95]">{title}</h2>
</header>
```

- [ ] **Step 2: PageHero (sötét hero, opcionális ScrollMic)**

Create `src/components/PageHero.astro`:
```astro
---
import ScrollMic from './ScrollMic.astro';
interface Props { label?: string; title: string; lead?: string; mic?: boolean }
const { label, title, lead, mic = false } = Astro.props;
---
<section class="relative overflow-hidden bg-ink text-surface">
  {mic && <ScrollMic />}
  <div class="relative z-10 mx-auto max-w-6xl px-4 py-20 md:py-28">
    {label && (
      <p class="mb-3 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-accent">
        <span class="h-px w-8 bg-accent"></span>{label}
      </p>
    )}
    <h1 class="font-display text-5xl md:text-8xl leading-[0.9] max-w-3xl">{title}</h1>
    {lead && <p class="mt-5 max-w-xl text-lg text-surface/75">{lead}</p>}
  </div>
</section>
```

- [ ] **Step 3: ScrollMic — görgésre pin-elt 3D mikrofon**

A `public/mic-3d.png` fekete hátterű, ezért `mix-blend-screen`-nel a fekete eltűnik, csak a világító mikrofon + füst marad. A kép `position: sticky`, és a görgetési arány alapján enyhén forog/emelkedik. Tiszteletben tartja a `prefers-reduced-motion`-t.

Create `src/components/ScrollMic.astro`:
```astro
---
// Görgetést követő 3D mikrofon. A sötét hátteret mix-blend-screen tünteti el.
---
<div class="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 md:block" aria-hidden="true">
  <img
    id="scroll-mic"
    src="/mic-3d.png"
    alt=""
    class="sticky top-0 ml-auto h-screen w-auto object-contain opacity-90 mix-blend-screen will-change-transform"
    style="transform: translateY(0) rotate(0deg);"
  />
</div>
<script>
  const mic = document.getElementById('scroll-mic') as HTMLImageElement | null;
  if (mic && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const onScroll = () => {
      const y = window.scrollY;
      const rot = Math.min(y / 40, 18); // max ~18 fok
      const lift = Math.min(y / 12, 80); // max 80px
      mic.style.transform = `translateY(${-lift}px) rotate(${rot}deg)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
</script>
```

- [ ] **Step 4: Vizuális verifikáció**

Ideiglenesen tedd a főoldal (`src/pages/index.astro`) hero szekcióját `PageHero`-ra `mic={true}`-val (vagy hozz létre egy próbaoldalt), futtasd `npm run dev`, és nézd meg, hogy a mikrofon megjelenik a sötét heró jobb oldalán, görgetésre enyhén mozog/forog, és NINCS fekete négyzet körülötte (a screen-keverés eltünteti). Készíts egy képernyőképet a verifikációhoz (Playwright vagy kézi). Állítsd vissza az index.astro-t, ha próbaoldalt használtál. A `ScrollMic` valódi beépítése a 3. és 5. tervben (esemény-hero, főoldal) történik — itt elég a komponens léte + a vizuális próba.

- [ ] **Step 5: Build + commit**

Run: `npm run build` (sikeres).
```bash
git add -A
git commit -m "feat: add SectionHeader, PageHero and scroll-linked 3D mic"
```

---

## Phase B — Tartalomtípusok

> Minden Task B-ben a minta: **séma → struktúra → query+helper → oldal(ak) → kártya**. Üres adat esetén az oldalak „Hamarosan" jellegű üres állapotot mutatnak.

### Task 3: Hírek (post)

**Files:** Create `src/sanity/schemaTypes/post.ts`, `src/components/PostCard.astro`, `src/pages/hirek/index.astro`, `src/pages/hirek/[slug].astro`; Modify `index.ts`, `structure.ts`, `queries.ts`, `api.ts`

- [ ] **Step 1: post séma**

Create `src/sanity/schemaTypes/post.ts`:
```ts
import { defineField, defineType } from 'sanity';

export const post = defineType({
  name: 'post',
  title: 'Hír / Blog',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Cím', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' }, validation: (r) => r.required() }),
    defineField({ name: 'publishedAt', title: 'Megjelenés', type: 'datetime', validation: (r) => r.required() }),
    defineField({ name: 'author', title: 'Szerző', type: 'string' }),
    defineField({ name: 'cover', title: 'Borítókép', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'excerpt', title: 'Bevezető', type: 'text', rows: 3 }),
    defineField({ name: 'tags', title: 'Címkék', type: 'array', of: [{ type: 'string' }], options: { layout: 'tags' } }),
    defineField({ name: 'body', title: 'Tartalom', type: 'blockContent' }),
  ],
  orderings: [{ title: 'Legújabb', name: 'newest', by: [{ field: 'publishedAt', direction: 'desc' }] }],
  preview: { select: { title: 'title', subtitle: 'publishedAt', media: 'cover' } },
});
```

- [ ] **Step 2: Regisztráció + struktúra**

In `src/sanity/schemaTypes/index.ts` add `import { post } from './post';` and include `post` in the exported array.

In `src/sanity/structure.ts`, add a list item before the singleton:
```ts
S.documentTypeListItem('post').title('Hírek'),
```
(Tartsd meg a meglévő `siteSettings` singletont; a struktúra így néz ki: Hírek lista + Oldal beállítások singleton. A `S` resolver elejére: `S.list().title('Tartalom').items([ S.documentTypeListItem('post').title('Hírek'), S.divider(), S.listItem().title('Oldal beállítások').child(...) ])`.)

- [ ] **Step 3: Lekérdezések + helperek**

Append to `src/sanity/lib/queries.ts`:
```ts
export const POSTS_QUERY = `*[_type == "post" && defined(slug.current)] | order(publishedAt desc){
  _id, title, "slug": slug.current, publishedAt, author, excerpt, cover
}`;
export const POST_BY_SLUG_QUERY = `*[_type == "post" && slug.current == $slug][0]{
  _id, title, "slug": slug.current, publishedAt, author, excerpt, cover, tags, body
}`;
```

Append to `src/sanity/lib/api.ts`:
```ts
export type PostListItem = {
  _id: string; title: string; slug: string; publishedAt: string;
  author?: string; excerpt?: string; cover?: any;
};
export type Post = PostListItem & { tags?: string[]; body?: any };

import { POSTS_QUERY, POST_BY_SLUG_QUERY } from './queries';

export async function getPosts(client: Fetcher): Promise<PostListItem[]> {
  return (await client.fetch(POSTS_QUERY)) ?? [];
}
export async function getPostBySlug(client: Fetcher, slug: string): Promise<Post | null> {
  return (await (client as any).fetch(POST_BY_SLUG_QUERY, { slug })) ?? null;
}
```
> Megjegyzés: a `Fetcher` típust bővítsd, hogy paramétert is fogadjon: `type Fetcher = { fetch: (query: string, params?: Record<string, any>) => Promise<any> };` (módosítsd a meglévő definíciót a fájlban).

- [ ] **Step 4: PostCard**

Create `src/components/PostCard.astro`:
```astro
---
import { urlForImage } from '../sanity/lib/image';
import type { PostListItem } from '../sanity/lib/api';
interface Props { post: PostListItem }
const { post } = Astro.props;
const date = new Date(post.publishedAt).toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' });
---
<a href={`/hirek/${post.slug}`} class="group block">
  <div class="aspect-[16/10] overflow-hidden rounded-lg bg-ink/5">
    {post.cover && <img src={urlForImage(post.cover).width(640).height(400).url()} alt={post.title} class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />}
  </div>
  <p class="mt-3 text-xs uppercase tracking-wide text-muted">{date}</p>
  <h3 class="mt-1 font-display text-xl leading-tight group-hover:text-accent">{post.title}</h3>
  {post.excerpt && <p class="mt-1 text-sm text-muted line-clamp-2">{post.excerpt}</p>}
</a>
```
> Ha a `line-clamp-2` nem elérhető, hagyd el — nem kritikus.

- [ ] **Step 5: Lista oldal**

Create `src/pages/hirek/index.astro`:
```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import PageHero from '../../components/PageHero.astro';
import PostCard from '../../components/PostCard.astro';
import { getPosts } from '../../sanity/lib/api';
import { sanityClient } from 'sanity:client';
const posts = await getPosts(sanityClient);
---
<BaseLayout title="Hírek">
  <PageHero label="Friss" title="Hírek" lead="Versenyeredmények, bejelentések, közösségi hírek." />
  <section class="mx-auto max-w-6xl px-4 py-16">
    {posts.length === 0 ? (
      <p class="text-muted">Hamarosan érkeznek az első hírek.</p>
    ) : (
      <div class="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => <PostCard post={post} />)}
      </div>
    )}
  </section>
</BaseLayout>
```

- [ ] **Step 6: Részlet oldal**

Create `src/pages/hirek/[slug].astro`:
```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import RichText from '../../components/RichText.astro';
import { urlForImage } from '../../sanity/lib/image';
import { getPosts, getPostBySlug } from '../../sanity/lib/api';
import { sanityClient } from 'sanity:client';

export async function getStaticPaths() {
  const posts = await getPosts(sanityClient);
  return posts.map((p) => ({ params: { slug: p.slug } }));
}
const { slug } = Astro.params;
const post = await getPostBySlug(sanityClient, slug!);
if (!post) return Astro.redirect('/hirek');
const date = new Date(post.publishedAt).toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' });
---
<BaseLayout title={post.title} description={post.excerpt}>
  <article>
    <header class="bg-ink text-surface">
      <div class="mx-auto max-w-3xl px-4 py-16">
        <p class="text-xs uppercase tracking-[0.2em] text-accent">{date}{post.author ? ` · ${post.author}` : ''}</p>
        <h1 class="mt-3 font-display text-4xl md:text-6xl leading-[0.95]">{post.title}</h1>
      </div>
    </header>
    {post.cover && (
      <img src={urlForImage(post.cover).width(1200).url()} alt={post.title} class="mx-auto max-w-4xl w-full px-4 -mt-8 rounded-lg" />
    )}
    <div class="mx-auto max-w-3xl px-4 py-12">
      <RichText value={post.body} />
    </div>
  </article>
</BaseLayout>
```

- [ ] **Step 7: Build verifikáció**

Run: `npm run build`
Expected: sikeres; `dist/hirek/index.html` létrejön (üres állapot szöveggel, mert nincs még hír). A `[slug]` route üres dataset mellett nem generál aloldalt — ez rendben van.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add news (post) content type with list and detail pages"
```

---

### Task 4: Slammerek (slammer) + kliensoldali kereső

**Files:** Create `src/sanity/schemaTypes/slammer.ts`, `src/components/SlammerCard.astro`, `src/components/islands/SlammerSearch.tsx`, `src/pages/slammerek/index.astro`, `src/pages/slammerek/[slug].astro`, `test/slammer-search.test.ts`; Modify `index.ts`, `structure.ts`, `queries.ts`, `api.ts`

- [ ] **Step 1: slammer séma**

Create `src/sanity/schemaTypes/slammer.ts`:
```ts
import { defineField, defineType } from 'sanity';

export const slammer = defineType({
  name: 'slammer',
  title: 'Slammer',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Név', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'name' }, validation: (r) => r.required() }),
    defineField({ name: 'photo', title: 'Fotó', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'hometown', title: 'Város', type: 'string' }),
    defineField({ name: 'bio', title: 'Bemutatkozás', type: 'blockContent' }),
    defineField({ name: 'achievements', title: 'Eredmények', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'videos', title: 'Videók (YouTube URL)', type: 'array', of: [{ type: 'url' }] }),
    defineField({
      name: 'social', title: 'Közösségi linkek', type: 'object',
      fields: [
        defineField({ name: 'facebook', type: 'url', title: 'Facebook' }),
        defineField({ name: 'instagram', type: 'url', title: 'Instagram' }),
      ],
    }),
  ],
  preview: { select: { title: 'name', subtitle: 'hometown', media: 'photo' } },
});
```

- [ ] **Step 2: Regisztráció + struktúra**

`index.ts`: import + add `slammer`. `structure.ts`: add `S.documentTypeListItem('slammer').title('Slammerek'),` to the items list.

- [ ] **Step 3: Lekérdezések + helperek**

Append to `queries.ts`:
```ts
export const SLAMMERS_QUERY = `*[_type == "slammer" && defined(slug.current)] | order(name asc){
  _id, name, "slug": slug.current, hometown, photo
}`;
export const SLAMMER_BY_SLUG_QUERY = `*[_type == "slammer" && slug.current == $slug][0]{
  _id, name, "slug": slug.current, hometown, photo, bio, achievements, videos, social
}`;
```
Append to `api.ts`:
```ts
export type SlammerListItem = { _id: string; name: string; slug: string; hometown?: string; photo?: any };
export type Slammer = SlammerListItem & { bio?: any; achievements?: string[]; videos?: string[]; social?: { facebook?: string; instagram?: string } };
import { SLAMMERS_QUERY, SLAMMER_BY_SLUG_QUERY } from './queries';
export async function getSlammers(client: Fetcher): Promise<SlammerListItem[]> {
  return (await client.fetch(SLAMMERS_QUERY)) ?? [];
}
export async function getSlammerBySlug(client: Fetcher, slug: string): Promise<Slammer | null> {
  return (await client.fetch(SLAMMER_BY_SLUG_QUERY, { slug })) ?? null;
}
```

- [ ] **Step 4: Kereső-szűrő logika — TDD (előbb a teszt)**

A szűrő egy tiszta függvény, amit a React island és a teszt is használ. Create `src/components/islands/searchSlammers.ts`:
```ts
import type { SlammerListItem } from '../../sanity/lib/api';
export function filterSlammers(list: SlammerListItem[], q: string): SlammerListItem[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return list;
  return list.filter((s) =>
    s.name.toLowerCase().includes(needle) ||
    (s.hometown?.toLowerCase().includes(needle) ?? false)
  );
}
```
Create `test/slammer-search.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { filterSlammers } from '../src/components/islands/searchSlammers';
const data = [
  { _id: '1', name: 'Simon Márton', slug: 'simon-marton', hometown: 'Budapest' },
  { _id: '2', name: 'Mavrák Kata', slug: 'mavrak-kata', hometown: 'Szeged' },
];
describe('filterSlammers', () => {
  it('üres keresésre mindent visszaad', () => { expect(filterSlammers(data, '')).toHaveLength(2); });
  it('név alapján szűr', () => { expect(filterSlammers(data, 'simon')).toEqual([data[0]]); });
  it('város alapján szűr', () => { expect(filterSlammers(data, 'szeged')).toEqual([data[1]]); });
  it('nincs találat', () => { expect(filterSlammers(data, 'xyz')).toHaveLength(0); });
});
```

- [ ] **Step 5: Futtasd — bukjon, majd a `searchSlammers.ts` léte után menjen át**

Run `npm test`. Először a fájl hiánya miatt bukik; miután a Step 4-ben létrehoztad, fusson újra és menjen át (4 teszt).

- [ ] **Step 6: SlammerSearch island (React)**

Create `src/components/islands/SlammerSearch.tsx`:
```tsx
import { useState } from 'react';
import type { SlammerListItem } from '../../sanity/lib/api';
import { filterSlammers } from './searchSlammers';
import { urlForImage } from '../../sanity/lib/image';

export default function SlammerSearch({ slammers }: { slammers: SlammerListItem[] }) {
  const [q, setQ] = useState('');
  const filtered = filterSlammers(slammers, q);
  return (
    <div>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Keresés név vagy város szerint…"
        className="mb-8 w-full rounded-lg border border-ink/15 px-4 py-3 text-base outline-none focus:border-accent"
        aria-label="Slammer keresése"
      />
      {filtered.length === 0 ? (
        <p className="text-muted">Nincs találat.</p>
      ) : (
        <div className="grid gap-8 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((s) => (
            <a key={s._id} href={`/slammerek/${s.slug}`} className="group block">
              <div className="aspect-[3/4] overflow-hidden rounded-lg bg-ink/5">
                {s.photo && <img src={urlForImage(s.photo).width(400).height(533).url()} alt={s.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />}
              </div>
              <h3 className="mt-2 font-display text-lg group-hover:text-accent">{s.name}</h3>
              {s.hometown && <p className="text-sm text-muted">{s.hometown}</p>}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 7: Lista oldal (island betöltése `client:load`-dal)**

Create `src/pages/slammerek/index.astro`:
```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import PageHero from '../../components/PageHero.astro';
import SlammerSearch from '../../components/islands/SlammerSearch.tsx';
import { getSlammers } from '../../sanity/lib/api';
import { sanityClient } from 'sanity:client';
const slammers = await getSlammers(sanityClient);
---
<BaseLayout title="Slammerek">
  <PageHero label="A színtér arcai" title="Slammerek" lead="Kereshető előadói adatbázis." />
  <section class="mx-auto max-w-6xl px-4 py-16">
    {slammers.length === 0
      ? <p class="text-muted">Hamarosan feltöltjük a slammerek profiljait.</p>
      : <SlammerSearch slammers={slammers} client:load />}
  </section>
</BaseLayout>
```

- [ ] **Step 8: Részlet oldal**

Create `src/pages/slammerek/[slug].astro`:
```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import RichText from '../../components/RichText.astro';
import YouTubeEmbed from '../../components/YouTubeEmbed.astro';
import { urlForImage } from '../../sanity/lib/image';
import { getSlammers, getSlammerBySlug } from '../../sanity/lib/api';
import { sanityClient } from 'sanity:client';
export async function getStaticPaths() {
  const slammers = await getSlammers(sanityClient);
  return slammers.map((s) => ({ params: { slug: s.slug } }));
}
const { slug } = Astro.params;
const slammer = await getSlammerBySlug(sanityClient, slug!);
if (!slammer) return Astro.redirect('/slammerek');
---
<BaseLayout title={slammer.name}>
  <section class="bg-ink text-surface">
    <div class="mx-auto max-w-6xl px-4 py-16 grid gap-8 md:grid-cols-[2fr_3fr] items-end">
      <div>
        {slammer.photo && <img src={urlForImage(slammer.photo).width(700).url()} alt={slammer.name} class="rounded-lg" />}
      </div>
      <div>
        {slammer.hometown && <p class="text-xs uppercase tracking-[0.2em] text-accent">{slammer.hometown}</p>}
        <h1 class="mt-2 font-display text-5xl md:text-7xl leading-[0.9]">{slammer.name}</h1>
        {slammer.achievements?.length && (
          <ul class="mt-4 flex flex-wrap gap-2">
            {slammer.achievements.map((a) => <li class="rounded-full border border-surface/25 px-3 py-1 text-sm">{a}</li>)}
          </ul>
        )}
      </div>
    </div>
  </section>
  <div class="mx-auto max-w-3xl px-4 py-12">
    <RichText value={slammer.bio} />
    {slammer.videos?.length && (
      <div class="mt-10 grid gap-6">
        {slammer.videos.map((v) => <YouTubeEmbed url={v} />)}
      </div>
    )}
  </div>
</BaseLayout>
```
> A `YouTubeEmbed` komponenst a Task 6 hozza létre. Ha ezt a taskot előbb futtatod, hozd létre a `YouTubeEmbed.astro`-t a Task 6 Step szerinti tartalommal, vagy futtasd a Task 6-ot előbb. (A kontroller a sorrendet biztosítja: Task 6 előbb VAGY a YouTubeEmbed-et itt is létrehozza.)

- [ ] **Step 9: Build + tesztek + commit**

Run `npm run build` (sikeres) és `npm test` (a slammer-search tesztek átmennek).
```bash
git add -A
git commit -m "feat: add slammers content type with client-side search"
```

---

### Task 5: Események (event) + státusz-logika

**Files:** Create `src/sanity/schemaTypes/event.ts`, `src/sanity/schemaTypes/objects/location.ts`, `src/sanity/lib/events.ts`, `test/events.test.ts`, `src/components/EventCard.astro`, `src/components/FacebookEventEmbed.astro`, `src/pages/esemenyek/index.astro`, `src/pages/esemenyek/[slug].astro`; Modify `index.ts`, `structure.ts`, `queries.ts`, `api.ts`

- [ ] **Step 1: location objektum + event séma**

Create `src/sanity/schemaTypes/objects/location.ts`:
```ts
import { defineField, defineType } from 'sanity';
export const location = defineType({
  name: 'location', title: 'Helyszín', type: 'object',
  fields: [
    defineField({ name: 'name', title: 'Név', type: 'string' }),
    defineField({ name: 'address', title: 'Cím', type: 'string' }),
    defineField({ name: 'mapUrl', title: 'Térkép URL', type: 'url' }),
  ],
});
```
Create `src/sanity/schemaTypes/event.ts`:
```ts
import { defineField, defineType } from 'sanity';
export const event = defineType({
  name: 'event', title: 'Esemény', type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Cím', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' }, validation: (r) => r.required() }),
    defineField({ name: 'startsAt', title: 'Kezdés', type: 'datetime', validation: (r) => r.required() }),
    defineField({ name: 'cover', title: 'Borítókép', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'accentColor', title: 'Esemény accent szín (hex)', type: 'string' }),
    defineField({ name: 'location', title: 'Helyszín', type: 'location' }),
    defineField({ name: 'description', title: 'Leírás', type: 'blockContent' }),
    defineField({ name: 'performers', title: 'Fellépők', type: 'array', of: [{ type: 'reference', to: [{ type: 'slammer' }] }] }),
    defineField({ name: 'ticketUrl', title: 'Jegy URL', type: 'url' }),
    defineField({ name: 'facebookEventUrl', title: 'Facebook esemény URL', type: 'url' }),
    defineField({ name: 'registrationEnabled', title: 'Jelentkezés engedélyezve', type: 'boolean', initialValue: false }),
    defineField({ name: 'registrationEmail', title: 'Jelentkezés címzettje', type: 'string', initialValue: 'contest@slampoetry.hu' }),
    defineField({ name: 'registrationDeadline', title: 'Jelentkezési határidő', type: 'datetime' }),
  ],
  orderings: [{ title: 'Kezdés szerint', name: 'starts', by: [{ field: 'startsAt', direction: 'desc' }] }],
  preview: { select: { title: 'title', subtitle: 'startsAt', media: 'cover' } },
});
```

- [ ] **Step 2: Regisztráció + struktúra**

`index.ts`: import + add `event` and `location`. `structure.ts`: add `S.documentTypeListItem('event').title('Események'),`.

- [ ] **Step 3: Esemény-státusz logika — TDD (előbb a teszt)**

Create `test/events.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { isUpcoming, splitEvents } from '../src/sanity/lib/events';
const now = new Date('2026-06-03T12:00:00Z');
const e = (id: string, iso: string) => ({ _id: id, title: id, slug: id, startsAt: iso } as any);
describe('events', () => {
  it('isUpcoming: jövőbeli kezdés igaz', () => { expect(isUpcoming(e('a', '2026-07-01T19:00:00Z'), now)).toBe(true); });
  it('isUpcoming: múltbeli kezdés hamis', () => { expect(isUpcoming(e('b', '2026-01-01T19:00:00Z'), now)).toBe(false); });
  it('splitEvents: közelgő növekvő, korábbi csökkenő sorrend', () => {
    const list = [e('past', '2026-01-01T00:00:00Z'), e('soon', '2026-07-01T00:00:00Z'), e('later', '2026-09-01T00:00:00Z')];
    const { upcoming, past } = splitEvents(list, now);
    expect(upcoming.map((x) => x._id)).toEqual(['soon', 'later']);
    expect(past.map((x) => x._id)).toEqual(['past']);
  });
});
```

- [ ] **Step 4: Futtasd — bukjon**

Run `npm test`. Expected: FAIL (`../src/sanity/lib/events` nincs).

- [ ] **Step 5: Implementáció**

Create `src/sanity/lib/events.ts`:
```ts
import type { EventListItem } from './api';
export function isUpcoming(e: EventListItem, now: Date = new Date()): boolean {
  return new Date(e.startsAt).getTime() >= now.getTime();
}
export function splitEvents(list: EventListItem[], now: Date = new Date()) {
  const upcoming = list
    .filter((e) => isUpcoming(e, now))
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  const past = list
    .filter((e) => !isUpcoming(e, now))
    .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());
  return { upcoming, past };
}
```

- [ ] **Step 6: Lekérdezések + helperek**

Append to `queries.ts`:
```ts
export const EVENTS_QUERY = `*[_type == "event" && defined(slug.current)]{
  _id, title, "slug": slug.current, startsAt, cover, accentColor, location
}`;
export const EVENT_BY_SLUG_QUERY = `*[_type == "event" && slug.current == $slug][0]{
  _id, title, "slug": slug.current, startsAt, cover, accentColor, location, description,
  ticketUrl, facebookEventUrl, registrationEnabled, registrationDeadline,
  performers[]->{ _id, name, "slug": slug.current, photo }
}`;
```
Append to `api.ts`:
```ts
export type EventListItem = {
  _id: string; title: string; slug: string; startsAt: string;
  cover?: any; accentColor?: string; location?: { name?: string; address?: string; mapUrl?: string };
};
export type EventDetail = EventListItem & {
  description?: any; ticketUrl?: string; facebookEventUrl?: string;
  registrationEnabled?: boolean; registrationDeadline?: string;
  performers?: { _id: string; name: string; slug: string; photo?: any }[];
};
import { EVENTS_QUERY, EVENT_BY_SLUG_QUERY } from './queries';
export async function getEvents(client: Fetcher): Promise<EventListItem[]> {
  return (await client.fetch(EVENTS_QUERY)) ?? [];
}
export async function getEventBySlug(client: Fetcher, slug: string): Promise<EventDetail | null> {
  return (await client.fetch(EVENT_BY_SLUG_QUERY, { slug })) ?? null;
}
```

- [ ] **Step 7: EventCard + FacebookEventEmbed**

Create `src/components/EventCard.astro`:
```astro
---
import { urlForImage } from '../sanity/lib/image';
import type { EventListItem } from '../sanity/lib/api';
interface Props { event: EventListItem }
const { event } = Astro.props;
const d = new Date(event.startsAt);
const date = d.toLocaleDateString('hu-HU', { month: 'long', day: 'numeric', weekday: 'long' });
const time = d.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
---
<a href={`/esemenyek/${event.slug}`} class="group flex gap-5 border-t border-ink/10 py-6">
  <div class="shrink-0 text-center">
    <p class="font-display text-3xl leading-none">{d.getDate()}</p>
    <p class="text-xs uppercase text-muted">{d.toLocaleDateString('hu-HU', { month: 'short' })}</p>
  </div>
  <div class="min-w-0">
    <h3 class="font-display text-2xl leading-tight group-hover:text-accent">{event.title}</h3>
    <p class="mt-1 text-sm text-muted">{date} · {time}{event.location?.name ? ` · ${event.location.name}` : ''}</p>
  </div>
</a>
```
Create `src/components/FacebookEventEmbed.astro`:
```astro
---
interface Props { url: string }
const { url } = Astro.props;
const src = `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(url)}&show_text=true&width=500`;
---
<div class="my-6">
  <a href={url} class="inline-flex items-center gap-2 rounded-lg bg-[#1877F2] px-4 py-2 text-sm font-semibold text-white">Esemény a Facebookon ↗</a>
  <iframe src={src} width="500" height="300" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allow="encrypted-media" class="mt-3 max-w-full" loading="lazy" title="Facebook esemény"></iframe>
</div>
```

- [ ] **Step 8: Lista oldal (közelgő/korábbi)**

Create `src/pages/esemenyek/index.astro`:
```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import PageHero from '../../components/PageHero.astro';
import EventCard from '../../components/EventCard.astro';
import { getEvents } from '../../sanity/lib/api';
import { splitEvents } from '../../sanity/lib/events';
import { sanityClient } from 'sanity:client';
const events = await getEvents(sanityClient);
const { upcoming, past } = splitEvents(events);
---
<BaseLayout title="Események">
  <PageHero label="Naptár" title="Események" lead="Közelgő slam estek és versenyek." mic={true} />
  <section class="mx-auto max-w-4xl px-4 py-16">
    {events.length === 0 ? (
      <p class="text-muted">Hamarosan meghirdetjük a következő eseményeket.</p>
    ) : (
      <>
        <h2 class="font-display text-2xl mb-2">Közelgő</h2>
        {upcoming.length ? upcoming.map((e) => <EventCard event={e} />) : <p class="text-muted py-6">Jelenleg nincs meghirdetett közelgő esemény.</p>}
        {past.length > 0 && (
          <>
            <h2 class="font-display text-2xl mt-14 mb-2">Korábbi</h2>
            {past.map((e) => <EventCard event={e} />)}
          </>
        )}
      </>
    )}
  </section>
</BaseLayout>
```

- [ ] **Step 9: Részlet oldal (accent-felülírás, fellépők, FB embed, jelentkezés-állapot)**

Create `src/pages/esemenyek/[slug].astro`:
```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import RichText from '../../components/RichText.astro';
import FacebookEventEmbed from '../../components/FacebookEventEmbed.astro';
import { urlForImage } from '../../sanity/lib/image';
import { getEvents, getEventBySlug } from '../../sanity/lib/api';
import { sanityClient } from 'sanity:client';
export async function getStaticPaths() {
  const events = await getEvents(sanityClient);
  return events.map((e) => ({ params: { slug: e.slug } }));
}
const { slug } = Astro.params;
const ev = await getEventBySlug(sanityClient, slug!);
if (!ev) return Astro.redirect('/esemenyek');
const d = new Date(ev.startsAt);
const dateStr = d.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
const time = d.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
const heroStyle = ev.accentColor ? `--color-accent: ${ev.accentColor}` : undefined;
---
<BaseLayout title={ev.title}>
  <section class="bg-ink text-surface" style={heroStyle}>
    <div class="mx-auto max-w-5xl px-4 py-16">
      <p class="text-xs uppercase tracking-[0.2em] text-accent">{dateStr} · {time}</p>
      <h1 class="mt-3 font-display text-5xl md:text-7xl leading-[0.9]">{ev.title}</h1>
      {ev.location?.name && <p class="mt-3 text-surface/75">{ev.location.name}{ev.location.address ? ` — ${ev.location.address}` : ''}</p>}
      <div class="mt-6 flex flex-wrap gap-3">
        {ev.ticketUrl && <a href={ev.ticketUrl} class="rounded-lg bg-accent px-5 py-2 font-semibold text-ink">Jegyek</a>}
        {ev.location?.mapUrl && <a href={ev.location.mapUrl} class="rounded-lg border border-surface/30 px-5 py-2">Térkép</a>}
      </div>
    </div>
  </section>
  <div class="mx-auto max-w-3xl px-4 py-12">
    <RichText value={ev.description} />
    {ev.registrationEnabled && (
      <div class="my-8 rounded-lg border border-accent/40 bg-accent/5 p-5">
        <h2 class="font-display text-xl">Jelentkezés</h2>
        <p class="mt-1 text-sm text-muted">A jelentkezés nyitva{ev.registrationDeadline ? ` — határidő: ${new Date(ev.registrationDeadline).toLocaleDateString('hu-HU')}` : ''}. (Az űrlap a következő fejlesztési fázisban élesedik.)</p>
      </div>
    )}
    {ev.facebookEventUrl && <FacebookEventEmbed url={ev.facebookEventUrl} />}
    {ev.performers?.length && (
      <div class="mt-10">
        <h2 class="font-display text-2xl mb-4">Fellépők</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-6">
          {ev.performers.map((p) => (
            <a href={`/slammerek/${p.slug}`} class="group">
              <div class="aspect-[3/4] overflow-hidden rounded-lg bg-ink/5">
                {p.photo && <img src={urlForImage(p.photo).width(300).height(400).url()} alt={p.name} class="h-full w-full object-cover transition group-hover:scale-105" />}
              </div>
              <p class="mt-2 font-display group-hover:text-accent">{p.name}</p>
            </a>
          ))}
        </div>
      </div>
    )}
  </div>
</BaseLayout>
```

- [ ] **Step 10: Build + tesztek + commit**

Run `npm run build` (sikeres) és `npm test` (events tesztek átmennek).
```bash
git add -A
git commit -m "feat: add events content type with upcoming/past, performers, FB embed"
```

---

### Task 6: Médiatár (mediaItem) + YouTube/FB komponensek

**Files:** Create `src/sanity/schemaTypes/mediaItem.ts`, `src/components/YouTubeEmbed.astro`, `src/components/FacebookAlbumCard.astro`, `src/components/MediaCard.astro`, `src/pages/mediatar/index.astro`; Modify `index.ts`, `structure.ts`, `queries.ts`, `api.ts`

- [ ] **Step 1: mediaItem séma**

Create `src/sanity/schemaTypes/mediaItem.ts`:
```ts
import { defineField, defineType } from 'sanity';
export const mediaItem = defineType({
  name: 'mediaItem', title: 'Médiatár elem', type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Cím', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'kind', title: 'Típus', type: 'string', options: { list: [
      { title: 'YouTube videó', value: 'video' },
      { title: 'Kép', value: 'image' },
      { title: 'Facebook album', value: 'album' },
    ], layout: 'radio' }, validation: (r) => r.required() }),
    defineField({ name: 'youtubeUrl', title: 'YouTube URL', type: 'url', hidden: ({ parent }) => parent?.kind !== 'video' }),
    defineField({ name: 'image', title: 'Kép', type: 'image', options: { hotspot: true }, hidden: ({ parent }) => parent?.kind !== 'image' }),
    defineField({ name: 'albumUrl', title: 'Facebook album URL', type: 'url', hidden: ({ parent }) => parent?.kind !== 'album' }),
    defineField({ name: 'albumCover', title: 'Album borítókép', type: 'image', hidden: ({ parent }) => parent?.kind !== 'album' }),
    defineField({ name: 'year', title: 'Év', type: 'number' }),
  ],
  preview: { select: { title: 'title', subtitle: 'kind' } },
});
```

- [ ] **Step 2: Regisztráció + struktúra**

`index.ts`: import + add `mediaItem`. `structure.ts`: add `S.documentTypeListItem('mediaItem').title('Médiatár'),`.

- [ ] **Step 3: Lekérdezés + helper**

Append to `queries.ts`:
```ts
export const MEDIA_QUERY = `*[_type == "mediaItem"] | order(year desc, _createdAt desc){
  _id, title, kind, youtubeUrl, image, albumUrl, albumCover, year
}`;
```
Append to `api.ts`:
```ts
export type MediaItem = {
  _id: string; title: string; kind: 'video' | 'image' | 'album';
  youtubeUrl?: string; image?: any; albumUrl?: string; albumCover?: any; year?: number;
};
import { MEDIA_QUERY } from './queries';
export async function getMedia(client: Fetcher): Promise<MediaItem[]> {
  return (await client.fetch(MEDIA_QUERY)) ?? [];
}
```

- [ ] **Step 4: YouTube ID kinyerő + YouTubeEmbed**

Create `src/components/YouTubeEmbed.astro`:
```astro
---
interface Props { url: string; title?: string }
const { url, title = 'YouTube videó' } = Astro.props;
function youtubeId(u: string): string | null {
  const m = u.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
const id = youtubeId(url);
---
{id && (
  <div class="aspect-video overflow-hidden rounded-lg bg-ink">
    <iframe class="h-full w-full" src={`https://www.youtube-nocookie.com/embed/${id}`} title={title} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
  </div>
)}
```

- [ ] **Step 5: FacebookAlbumCard + MediaCard**

Create `src/components/FacebookAlbumCard.astro`:
```astro
---
import { urlForImage } from '../sanity/lib/image';
interface Props { title: string; albumUrl: string; cover?: any }
const { title, albumUrl, cover } = Astro.props;
---
<a href={albumUrl} class="group block">
  <div class="relative aspect-[4/3] overflow-hidden rounded-lg bg-ink/10">
    {cover && <img src={urlForImage(cover).width(640).height(480).url()} alt={title} class="h-full w-full object-cover transition group-hover:scale-105" />}
    <span class="absolute bottom-3 left-3 rounded bg-black/70 px-2 py-1 text-xs text-white">Album a Facebookon ↗</span>
  </div>
  <h3 class="mt-2 font-display text-lg group-hover:text-accent">{title}</h3>
</a>
```
Create `src/components/MediaCard.astro`:
```astro
---
import YouTubeEmbed from './YouTubeEmbed.astro';
import FacebookAlbumCard from './FacebookAlbumCard.astro';
import { urlForImage } from '../sanity/lib/image';
import type { MediaItem } from '../sanity/lib/api';
interface Props { item: MediaItem }
const { item } = Astro.props;
---
{item.kind === 'video' && item.youtubeUrl && (
  <figure><YouTubeEmbed url={item.youtubeUrl} title={item.title} /><figcaption class="mt-2 font-display">{item.title}</figcaption></figure>
)}
{item.kind === 'album' && item.albumUrl && (
  <FacebookAlbumCard title={item.title} albumUrl={item.albumUrl} cover={item.albumCover} />
)}
{item.kind === 'image' && item.image && (
  <figure><img src={urlForImage(item.image).width(640).url()} alt={item.title} class="rounded-lg" /><figcaption class="mt-2 font-display">{item.title}</figcaption></figure>
)}
```

- [ ] **Step 6: Médiatár oldal**

Create `src/pages/mediatar/index.astro`:
```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import PageHero from '../../components/PageHero.astro';
import MediaCard from '../../components/MediaCard.astro';
import { getMedia } from '../../sanity/lib/api';
import { sanityClient } from 'sanity:client';
const media = await getMedia(sanityClient);
---
<BaseLayout title="Médiatár">
  <PageHero label="Videók és képek" title="Médiatár" lead="Fellépések, versenyek, archív anyagok." />
  <section class="mx-auto max-w-6xl px-4 py-16">
    {media.length === 0
      ? <p class="text-muted">Hamarosan feltöltjük a médiatárat.</p>
      : <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">{media.map((item) => <MediaCard item={item} />)}</div>}
  </section>
</BaseLayout>
```

- [ ] **Step 7: Build + commit**

Run `npm run build` (sikeres).
```bash
git add -A
git commit -m "feat: add media library with YouTube embeds and FB album cards"
```

---

### Task 7: Statikus oldalak (page) — Mi az a slam / Egyesület

**Files:** Create `src/sanity/schemaTypes/page.ts`, `src/pages/mi-az-a-slam-poetry.astro`, `src/pages/egyesulet.astro`; Modify `index.ts`, `structure.ts`, `queries.ts`, `api.ts`

- [ ] **Step 1: page séma**

Create `src/sanity/schemaTypes/page.ts`:
```ts
import { defineField, defineType } from 'sanity';
export const page = defineType({
  name: 'page', title: 'Oldal', type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Cím', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' }, validation: (r) => r.required() }),
    defineField({ name: 'lead', title: 'Bevezető', type: 'text', rows: 2 }),
    defineField({ name: 'body', title: 'Tartalom', type: 'blockContent' }),
  ],
  preview: { select: { title: 'title', subtitle: 'slug.current' } },
});
```

- [ ] **Step 2: Regisztráció + struktúra**

`index.ts`: import + add `page`. `structure.ts`: add `S.documentTypeListItem('page').title('Oldalak'),`.

- [ ] **Step 3: Lekérdezés + helper**

Append to `queries.ts`:
```ts
export const PAGE_BY_SLUG_QUERY = `*[_type == "page" && slug.current == $slug][0]{ title, lead, body }`;
```
Append to `api.ts`:
```ts
export type PageDoc = { title: string; lead?: string; body?: any };
import { PAGE_BY_SLUG_QUERY } from './queries';
export async function getPageBySlug(client: Fetcher, slug: string): Promise<PageDoc | null> {
  return (await client.fetch(PAGE_BY_SLUG_QUERY, { slug })) ?? null;
}
```

- [ ] **Step 4: Két statikus route ugyanazzal a mintával**

Create `src/pages/mi-az-a-slam-poetry.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import PageHero from '../components/PageHero.astro';
import RichText from '../components/RichText.astro';
import { getPageBySlug } from '../sanity/lib/api';
import { sanityClient } from 'sanity:client';
const page = await getPageBySlug(sanityClient, 'mi-az-a-slam-poetry');
---
<BaseLayout title={page?.title ?? 'Mi az a slam poetry?'}>
  <PageHero label="Bevezető" title={page?.title ?? 'Mi az a slam poetry?'} lead={page?.lead} mic={true} />
  <div class="mx-auto max-w-3xl px-4 py-12">
    {page?.body ? <RichText value={page.body} /> : <p class="text-muted">Ez az oldal hamarosan elkészül. (Hozz létre egy „Oldal" dokumentumot „mi-az-a-slam-poetry" slug-gal a Studióban.)</p>}
  </div>
</BaseLayout>
```
Create `src/pages/egyesulet.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import PageHero from '../components/PageHero.astro';
import RichText from '../components/RichText.astro';
import { getPageBySlug } from '../sanity/lib/api';
import { sanityClient } from 'sanity:client';
const page = await getPageBySlug(sanityClient, 'egyesulet');
---
<BaseLayout title={page?.title ?? 'Egyesület'}>
  <PageHero label="Rólunk" title={page?.title ?? 'Egyesület'} lead={page?.lead} />
  <div class="mx-auto max-w-3xl px-4 py-12">
    {page?.body ? <RichText value={page.body} /> : <p class="text-muted">Ez az oldal hamarosan elkészül. (Hozz létre egy „Oldal" dokumentumot „egyesulet" slug-gal a Studióban.)</p>}
  </div>
</BaseLayout>
```

- [ ] **Step 5: Build + commit**

Run `npm run build` (sikeres).
```bash
git add -A
git commit -m "feat: add static pages (what-is-slam, association)"
```

---

### Task 8: Kapcsolat oldal

**Files:** Create `src/pages/kapcsolat.astro` (a működő űrlap a 3. tervben; itt a kapcsolati infók + statikus űrlap-váz)

- [ ] **Step 1: Kapcsolat oldal**

Create `src/pages/kapcsolat.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import PageHero from '../components/PageHero.astro';
import { getSiteSettings } from '../sanity/lib/api';
import { sanityClient } from 'sanity:client';
const settings = (await getSiteSettings(sanityClient)) ?? { title: 'Slam Poetry Magyarország' };
const s = settings.social ?? {};
---
<BaseLayout title="Kapcsolat">
  <PageHero label="Írj nekünk" title="Kapcsolat" />
  <section class="mx-auto max-w-4xl px-4 py-16 grid gap-10 md:grid-cols-2">
    <div>
      <h2 class="font-display text-2xl">Elérhetőség</h2>
      {settings.contactEmail && <p class="mt-3"><a href={`mailto:${settings.contactEmail}`} class="text-accent underline">{settings.contactEmail}</a></p>}
      <ul class="mt-4 space-y-1 text-sm">
        {s.facebook && <li><a href={s.facebook} class="hover:text-accent">Facebook ↗</a></li>}
        {s.youtube && <li><a href={s.youtube} class="hover:text-accent">YouTube ↗</a></li>}
        {s.instagram && <li><a href={s.instagram} class="hover:text-accent">Instagram ↗</a></li>}
      </ul>
    </div>
    <form class="grid gap-4" aria-label="Kapcsolati űrlap">
      <input class="rounded-lg border border-ink/15 px-4 py-3" type="text" name="name" placeholder="Neved" required />
      <input class="rounded-lg border border-ink/15 px-4 py-3" type="email" name="email" placeholder="Email címed" required />
      <textarea class="rounded-lg border border-ink/15 px-4 py-3" name="message" rows="5" placeholder="Üzenet" required></textarea>
      <button type="button" class="rounded-lg bg-accent px-5 py-3 font-semibold text-ink" disabled>Küldés (hamarosan élesedik)</button>
      <p class="text-xs text-muted">Az űrlap beküldése a következő fejlesztési fázisban élesedik.</p>
    </form>
  </section>
</BaseLayout>
```

- [ ] **Step 2: Build + commit**

Run `npm run build` (sikeres).
```bash
git add -A
git commit -m "feat: add contact page (form wiring deferred to next phase)"
```

---

### Task 9: Navigáció + teljes verifikáció

**Files:** Modify `src/components/Header.astro` (alapértelmezett nav linkek ellenőrzése), `src/pages/index.astro` (a kész szekciókra mutató linkek, opcionálisan)

- [ ] **Step 1: Nav-linkek ellenőrzése**

Ellenőrizd, hogy a `Header.astro` alapértelmezett nav hivatkozásai a most létrejött route-okra mutatnak: `/mi-az-a-slam-poetry`, `/esemenyek`, `/slammerek`, `/hirek`, `/mediatar`, `/egyesulet`, `/kapcsolat`. (Ezek már megegyeznek az 1. tervből; ha nem, igazítsd.)

- [ ] **Step 2: Teljes build + tesztek + route-ellenőrzés**

Run `npm run build` és `npm test`. Indíts dev szervert, és `curl`-lel ellenőrizd, hogy mindegyik route 200-at ad és tartalmazza a fő címét:
```
/hirek , /slammerek , /esemenyek , /mediatar , /mi-az-a-slam-poetry , /egyesulet , /kapcsolat
```
Mindegyik üres állapotban is rendben rendereljen (a „Hamarosan" szövegekkel). Állítsd le a dev szervert.

- [ ] **Step 3: Vizuális ellenőrzés (ScrollMic)**

Az `/esemenyek` és `/mi-az-a-slam-poetry` oldalakon a `PageHero mic={true}` miatt jelenjen meg a görgő mikrofon. Készíts képernyőképet az egyikről, és ellenőrizd, hogy nincs fekete négyzet (screen-keverés) és görgetésre mozog.

- [ ] **Step 4: Commit (ha volt módosítás)**

```bash
git add -A
git commit -m "chore: verify navigation and all content routes"
```

---

## Self-Review (kész)

- **Spec-lefedettség:** Hírek (Task 3) ✓, Slammerek + kereső (Task 4) ✓, Események + regisztrációs mezők + FB embed + accent-felülírás (Task 5) ✓, Médiatár + YouTube embed + FB album (Task 6) ✓, Mi az a slam / Egyesület (Task 7) ✓, Kapcsolat (Task 8) ✓. Portable Text + képhelper (Task 1) ✓. Kreatív keret: SectionHeader/PageHero + ScrollMic (Task 2) ✓. A jelentkezés MŰKÖDŐ űrlapja + email és a YouTube/FB AUTOMATIKA szándékosan a 3.–4. tervben.
- **Placeholder-ellenőrzés:** minden lépés konkrét kódot/parancsot ad; nincs „TBD/TODO" a tervben (az oldalakon megjelenő „hamarosan" szövegek üres-állapot UX, nem terv-placeholder).
- **Típus-konzisztencia:** a `Fetcher` típus paraméteres (`fetch(query, params?)`); az `EventListItem`/`EventDetail`, `PostListItem`/`Post`, `SlammerListItem`/`Slammer`, `MediaItem`, `PageDoc` típusok egységesen használtak a queries/helperek/komponensek/oldalak között. A `splitEvents`/`isUpcoming` az `EventListItem`-re épül. A `YouTubeEmbed` a Task 4 és Task 6 közös függősége — a kontroller a Task 6-ot a Task 4 előtt VAGY a YouTubeEmbed-et a Task 4-ben is létrehozza (a Task 4 Step 8 jelzi).

## Függőség a következő tervekhez

- **3. terv (űrlap-backend):** az esemény `registrationEnabled`/`registrationEmail` mezők és a Kapcsolat-űrlap váza már megvannak; ott készül a serverless endpoint + Resend email + működő űrlapok + országos bajnokság CTA.
- **4. terv (integrációk):** a `mediaItem` séma és a kézi embed-komponensek megvannak; ott jön a YouTube Data API auto-szinkron és a FB album-automatika.
- **5. terv (főoldal):** a kártyák és a `ScrollMic` újrafelhasználhatók a főoldal összeállításához.
```