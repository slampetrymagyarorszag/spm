import { createClient } from '@sanity/client';
import { writeFileSync } from 'node:fs';
import { mapPost, mapPage } from './transform.mjs';

const WP = 'https://slampoetry.hu/wp-json/wp/v2';
// Szerkesztői kategóriák (Sajtó=11, Interjúk=8). Bővíthető a CATEGORIES env-vel (vesszős).
const CATEGORIES = (process.env.MIGRATE_CATEGORIES ?? '11,8').split(',').map((s) => s.trim()).filter(Boolean);
const DRY = process.argv.includes('--dry-run');
// Csak a valódi statikus oldalakat importáljuk (a 201 WP-page nagy része slammer-profil
// és EB2018-aloldal — azokat kihagyjuk). Bővíthető a MIGRATE_PAGES env-vel (vesszős slug-lista).
const PAGES_WHITELIST = new Set(
  (process.env.MIGRATE_PAGES ?? 'egyesulet,mi-az-a-slam-poetry,szabalyok,kapcsolat,partnerek-es-tamogatok')
    .split(',').map((s) => s.trim()).filter(Boolean)
);
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
  const pages = pagesRaw
    .filter((p) => PAGES_WHITELIST.has(p.slug) && !SKIP_TITLE.test(p.title?.rendered ?? ''))
    .map((p) => ({ doc: mapPage(p), cover: null }));

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
