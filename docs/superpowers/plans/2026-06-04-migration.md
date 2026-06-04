# Slam Poetry MO — 6. terv: Tartalom-migráció (régi WP → Sanity) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** A régi `slampoetry.hu` (WordPress) **hírarchívumának** és **statikus oldalainak** automatikus importja a Sanitybe a WP REST API-ból, HTML→Portable Text konverzióval, kiemelt képek feltöltésével, újrafuttatható módon.

**Architecture:** Egy különálló Node migrációs szkript (`scripts/migrate/`) a WP REST API-t használja (`/wp-json/wp/v2/posts?_embed`, `/pages?_embed`). A tiszta transzformáló függvények (entitás-dekódolás, HTML-strip, HTML→Portable Text, WP→Sanity mező-leképezés) **tesztelve**; a hálózat/írás külön. A **dry-run** (token nélkül) JSON-fájlba írja a konvertált dokumentumokat ellenőrzéshez; az **éles futás** (`SANITY_WRITE_TOKEN`) feltölti a kiemelt képeket és `createOrReplace`-szel ír a Sanitybe. Determinisztikus `_id` (`wp-post-<id>` stb.) → újrafuttatható. Utána **kézi átnézés** a Studióban.

**Hatókör (felderítés alapján):**
- **Cikkek:** csak a szerkesztői kategóriák (alapból **Sajtó id=11**, **Interjúk id=8**) — a slammerek a „Egyéb"/„Média" kategóriákban keverednek, ezért azokat kihagyjuk (a kategórialista állítható). → `post`.
- **Statikus oldalak:** egyesület, mi-az-a-slam-poetry, szabályok (és bármely page) → `page`.
- **Slammerek: NEM** (kézi kurálás később — a régi adat sovány és kategorizálatlan).

**Tech:** `@sanity/client` (megvan), `@sanity/block-tools`, `@sanity/schema`, `jsdom`, `he` (entitás-dekódolás). Env: `SANITY_WRITE_TOKEN` (a usertől, csak éles futáshoz), `PUBLIC_SANITY_PROJECT_ID`, `PUBLIC_SANITY_DATASET`.

**Korlátok (tudatos):** a törzs **inline képeit elhagyjuk** (csak a kiemelt kép kerül `cover`-be); a placeholder/„fejlesztés alatt" jellegű bejegyzéseket egy skip-lista szűri; a végeredmény kézi átnézést igényel.

---

## Fájlszerkezet

```
scripts/migrate/
  transform.mjs      # tiszta: decodeEntities, stripHtml, htmlToPortableText, mapPost, mapPage
  run.mjs            # fetch (REST) + dry-run/él-futás (kép-feltöltés + createOrReplace)
test/
  migrate-transform.test.ts
package.json         # + "migrate", "migrate:dry" scriptek
.env.example         # + SANITY_WRITE_TOKEN
```

---

### Task 1: Transzformáló függvények (TDD)

**Files:** Create `scripts/migrate/transform.mjs`, `test/migrate-transform.test.ts`; Modify `.env.example`; install deps

- [ ] **Step 1: Függőségek + env**

Run:
```bash
npm install -D @sanity/block-tools @sanity/schema jsdom he
```
> Ne futtass teljes `npm install`-t külön — ez a parancs hozzáad; a patch-package postinstall lefut. Ha a Vercel-adapter patch-e elveszne, a `npm run build` jelezné; ez a task nem buildel élesen.

`.env.example`-hez add: `SANITY_WRITE_TOKEN=` (üres; a user tölti ki éles importhoz). A helyi `.env`-hez is.

- [ ] **Step 2: Teszt előbb**

Create `test/migrate-transform.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { decodeEntities, stripHtml, htmlToPortableText, mapPost, mapPage } from '../scripts/migrate/transform.mjs';

describe('decodeEntities', () => {
  it('HTML entitásokat dekódol', () => {
    expect(decodeEntities('Cím &#8211; alc&iacute;m &amp; t&ouml;bb')).toBe('Cím – alcím & több');
  });
});

describe('stripHtml', () => {
  it('eltávolítja a tageket és dekódol', () => {
    expect(stripHtml('<p>Hell&oacute; <b>vil&aacute;g</b></p>').trim()).toBe('Helló világ');
  });
});

describe('htmlToPortableText', () => {
  it('bekezdéseket portable text blokká alakít', () => {
    const blocks = htmlToPortableText('<p>Első bekezdés.</p><p>Második.</p>');
    expect(Array.isArray(blocks)).toBe(true);
    expect(blocks.length).toBeGreaterThanOrEqual(2);
    expect(blocks[0]._type).toBe('block');
    const text = blocks[0].children.map((c) => c.text).join('');
    expect(text).toContain('Első bekezdés');
  });
});

describe('mapPost', () => {
  const wp = {
    id: 42, slug: 'teszt-cikk', date: '2019-10-29T10:00:00',
    title: { rendered: 'Teszt &#8211; cikk' },
    excerpt: { rendered: '<p>Kivonat sz&ouml;veg.</p>' },
    content: { rendered: '<p>Törzs.</p>' },
    _embedded: { author: [{ name: 'Bíró Dénes' }] },
  };
  it('a WP postot Sanity post dokumentummá képezi', () => {
    const doc = mapPost(wp);
    expect(doc._id).toBe('wp-post-42');
    expect(doc._type).toBe('post');
    expect(doc.title).toBe('Teszt – cikk');
    expect(doc.slug).toEqual({ _type: 'slug', current: 'teszt-cikk' });
    expect(doc.publishedAt).toBe('2019-10-29T10:00:00');
    expect(doc.author).toBe('Bíró Dénes');
    expect(doc.excerpt).toContain('Kivonat');
    expect(Array.isArray(doc.body)).toBe(true);
  });
});

describe('mapPage', () => {
  it('a WP oldalt Sanity page dokumentummá képezi', () => {
    const doc = mapPage({ id: 7, slug: 'egyesulet', title: { rendered: 'Egyes&uuml;let' }, content: { rendered: '<p>Rólunk.</p>' }, excerpt: { rendered: '' } });
    expect(doc._id).toBe('wp-page-7');
    expect(doc._type).toBe('page');
    expect(doc.title).toBe('Egyesület');
    expect(doc.slug).toEqual({ _type: 'slug', current: 'egyesulet' });
    expect(Array.isArray(doc.body)).toBe(true);
  });
});
```

- [ ] **Step 3: Futtasd — bukjon** (`npm test` → nincs `transform.mjs`).

- [ ] **Step 4: Implementáció**

Create `scripts/migrate/transform.mjs`:
```js
import { decode } from 'he';
import { Schema } from '@sanity/schema';
import { htmlToBlocks } from '@sanity/block-tools';
import { JSDOM } from 'jsdom';

export function decodeEntities(s = '') {
  return decode(String(s)).replace(/ /g, ' ').trim();
}

export function stripHtml(s = '') {
  const text = String(s).replace(/<[^>]*>/g, '');
  return decodeEntities(text);
}

// Minimális blockContent séma a block-tools-hoz (standard block + image).
const schema = Schema.compile({
  name: 'migrate',
  types: [{ name: 'blockContent', type: 'array', of: [{ type: 'block' }, { type: 'image' }] }],
});
const blockContentType = schema.get('blockContent');

export function htmlToPortableText(html = '') {
  if (!html || !html.trim()) return [];
  return htmlToBlocks(html, blockContentType, {
    parseHtml: (h) => new JSDOM(h).window.document,
    // inline képeket elhagyjuk (a block-tools alapból kép-deserializer nélkül kihagyja az <img>-t)
  });
}

export function mapPost(wp) {
  return {
    _id: `wp-post-${wp.id}`,
    _type: 'post',
    title: decodeEntities(wp.title?.rendered ?? ''),
    slug: { _type: 'slug', current: wp.slug },
    publishedAt: wp.date,
    author: wp._embedded?.author?.[0]?.name ?? undefined,
    excerpt: stripHtml(wp.excerpt?.rendered ?? '').slice(0, 300) || undefined,
    body: htmlToPortableText(wp.content?.rendered ?? ''),
  };
}

export function mapPage(wp) {
  return {
    _id: `wp-page-${wp.id}`,
    _type: 'page',
    title: decodeEntities(wp.title?.rendered ?? ''),
    slug: { _type: 'slug', current: wp.slug },
    lead: stripHtml(wp.excerpt?.rendered ?? '').slice(0, 200) || undefined,
    body: htmlToPortableText(wp.content?.rendered ?? ''),
  };
}
```

- [ ] **Step 5: Futtasd — menjen át** (`npm test` → új migrate-transform tesztek + a meglévők; összesen 30+).

> Ha a `htmlToBlocks` portable text blokkjainál a `_type` nem `'block'` (verziófüggő), igazítsd a tesztet a tényleges struktúrához — a lényeg, hogy bekezdésenként legyen blokk és a szöveg megjelenjen.

- [ ] **Step 6: Commit**
```bash
git add -A
git commit -m "feat: add WP->Sanity migration transform helpers with tests"
```
(Author `Claude <noreply@anthropic.com>`; commit body vége: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`)

---

### Task 2: Migrációs futtató szkript (REST + dry-run/élő)

**Files:** Create `scripts/migrate/run.mjs`; Modify `package.json`

- [ ] **Step 1: A szkript**

Create `scripts/migrate/run.mjs`:
```js
import { createClient } from '@sanity/client';
import { writeFileSync } from 'node:fs';
import { mapPost, mapPage } from './transform.mjs';

const WP = 'https://slampoetry.hu/wp-json/wp/v2';
// Szerkesztői kategóriák (Sajtó=11, Interjúk=8). Bővíthető a CATEGORIES env-vel (vesszős).
const CATEGORIES = (process.env.MIGRATE_CATEGORIES ?? '11,8').split(',').map((s) => s.trim()).filter(Boolean);
const DRY = process.argv.includes('--dry-run');
// Placeholder/zaj kiszűrése cím alapján.
const SKIP_TITLE = /fejleszt[eé]s alatt|under development|test\b/i;

async function fetchAll(path, params = {}) {
  const out = [];
  for (let page = 1; page <= 50; page++) {
    const qs = new URLSearchParams({ per_page: '100', page: String(page), _embed: '1', ...params });
    const res = await fetch(`${WP}/${path}?${qs}`);
    if (res.status === 400) break; // túlfutott a lapozáson
    if (!res.ok) throw new Error(`WP ${path} hiba: ${res.status}`);
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    out.push(...batch);
    const total = Number(res.headers.get('x-wp-totalpages') ?? '1');
    if (page >= total) break;
  }
  return out;
}

function featuredUrl(wp) {
  return wp._embedded?.['wp:featuredmedia']?.[0]?.source_url ?? null;
}

async function uploadCover(client, url) {
  if (!url) return undefined;
  const res = await fetch(url);
  if (!res.ok) return undefined;
  const buf = Buffer.from(await res.arrayBuffer());
  const asset = await client.assets.upload('image', buf, { filename: url.split('/').pop() });
  return { _type: 'image', asset: { _type: 'reference', _ref: asset._id } };
}

async function main() {
  const projectId = process.env.PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.PUBLIC_SANITY_DATASET ?? 'production';
  const token = process.env.SANITY_WRITE_TOKEN;

  const postsRaw = await fetchAll('posts', { categories: CATEGORIES.join(',') });
  const pagesRaw = await fetchAll('pages');

  const posts = postsRaw.filter((p) => !SKIP_TITLE.test(p.title?.rendered ?? '')).map((p) => ({ doc: mapPost(p), cover: featuredUrl(p) }));
  const pages = pagesRaw.filter((p) => !SKIP_TITLE.test(p.title?.rendered ?? '')).map((p) => ({ doc: mapPage(p), cover: null }));

  console.log(`Cikkek (kategória ${CATEGORIES.join(',')}): ${posts.length} | Oldalak: ${pages.length}`);

  if (DRY || !token) {
    if (!token) console.log('Nincs SANITY_WRITE_TOKEN → dry-run mód.');
    writeFileSync('migration-output.json', JSON.stringify({ posts: posts.map((x) => x.doc), pages: pages.map((x) => x.doc) }, null, 2));
    console.log('Dry-run: migration-output.json kiírva (nincs Sanity-írás, nincs kép-feltöltés).');
    return;
  }

  const client = createClient({ projectId, dataset, token, useCdn: false, apiVersion: '2024-01-01' });
  let n = 0;
  for (const { doc, cover } of [...posts, ...pages]) {
    const coverImg = doc._type === 'post' ? await uploadCover(client, cover) : undefined;
    await client.createOrReplace(coverImg ? { ...doc, cover: coverImg } : doc);
    n++;
    if (n % 10 === 0) console.log(`  ${n} dokumentum importálva…`);
  }
  console.log(`Kész: ${n} dokumentum importálva. Nézd át a Studióban!`);
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: npm scriptek**

In `package.json` `scripts` add:
```
"migrate:dry": "node --env-file=.env scripts/migrate/run.mjs --dry-run",
"migrate": "node --env-file=.env scripts/migrate/run.mjs"
```
(A `--env-file=.env` betölti a tokent/projectId-t Node 20+ alatt.)

- [ ] **Step 3: Commit**
```bash
git add -A
git commit -m "feat: add WP->Sanity migration runner (dry-run + live import)"
```

---

### Task 3: Dry-run verifikáció (token nélkül)

- [ ] **Step 1: Dry-run futtatás**

Run:
```bash
npm run migrate:dry
```
Expected: lefut hálózatról (élő WP REST API), kiírja a cikkek/oldalak számát, és létrehoz egy `migration-output.json`-t. Nincs Sanity-írás (nincs token).

- [ ] **Step 2: Eredmény ellenőrzése**

Nyisd meg/olvasd a `migration-output.json`-t: legyen néhány `post` (Sajtó/Interjúk kategóriából) helyes **címmel (dekódolt ékezetek)**, `slug`-gal, `publishedAt`-tal, `author`-ral, és a `body` legyen **Portable Text blokkok** tömbje (nem nyers HTML). Legyenek `page`-ek is (egyesület, szabályok stb.). Ha a kategóriaszűrés túl szűk/tág, hangold a `MIGRATE_CATEGORIES`-t és futtasd újra.

- [ ] **Step 3: A kimenet ne kerüljön gitbe**

Add `.gitignore`-hoz: `migration-output.json`. Commit:
```bash
git add .gitignore
git commit -m "chore: ignore migration output"
```

---

### Task 4: Éles import (a user tokenjével — NEM a CI-ben)

> Ezt a usernek kell futtatnia, miután a `.env`-be tette a `SANITY_WRITE_TOKEN`-t (sanity.io/manage → API → Tokens → **Editor** jog). Dokumentációs lépés:

1. `.env`-be: `SANITY_WRITE_TOKEN=...`
2. `npm run migrate` → feltölti a kiemelt képeket és `createOrReplace`-szel importál.
3. **Kézi átnézés** a Studióban: ellenőrizd/javítsd a cikkeket (kategóriák, inline képek hiánya), töröld a felesleget.
4. Újrafuttatható: a determinisztikus `_id` miatt ismételt futtatás felülírja a meglévőket (nincs duplikáció).

---

## Self-Review

- **Spec-lefedettség:** cikk-archívum (REST, kategóriaszűrt, slammer-mentes) + statikus oldalak → Sanity ✓; HTML→Portable Text ✓; kép-feltöltés (kiemelt) ✓; újrafuttatható `_id` ✓; kézi átnézés dokumentálva ✓. Slammerek szándékosan kihagyva (kézi).
- **Placeholder:** nincs TBD; a `SANITY_WRITE_TOKEN` üres értéke szándékos; a dry-run token nélkül is teljes értékű ellenőrzést ad.
- **Biztonság:** a token csak a `.env`-ben (gitignore), sosem a kódban; a dry-run nem ír sehova; determinisztikus _id véd a duplikáció ellen.
- **Robosztusság:** lapozás `x-wp-totalpages` alapján; skip-lista a placeholder bejegyzésekre; kép-feltöltés hibára `undefined` (a doc kép nélkül megy).

## Függőség / a usernek

- **Sanity írási token** (`SANITY_WRITE_TOKEN`, Editor jog) a `.env`-be az éles importhoz.
- A kategóriaszűrés (`MIGRATE_CATEGORIES`) hangolható a dry-run eredménye alapján, ha több/kevesebb cikk kell.
