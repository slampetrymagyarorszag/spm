import { createClient } from '@sanity/client';
import { writeFileSync } from 'node:fs';
import { mapPost, mapPage, mapSlammer } from './transform.mjs';

const WP = 'https://slampoetry.hu/wp-json/wp/v2';
// Szerkesztői kategóriák (Sajtó=11, Interjúk=8). Bővíthető a CATEGORIES env-vel (vesszős).
const CATEGORIES = (process.env.MIGRATE_CATEGORIES ?? '11,8').split(',').map((s) => s.trim()).filter(Boolean);
const DRY = process.argv.includes('--dry-run');
// Slammer-mód: a slammer-profilok a "slammerek" szülő-oldal (id=14) gyermek-page-ei.
const SLAMMERS = process.argv.includes('--slammers');
const SLAMMER_PARENT = process.env.MIGRATE_SLAMMER_PARENT ?? '14';
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
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) return undefined;
      const buf = Buffer.from(await res.arrayBuffer());
      const asset = await client.assets.upload('image', buf, { filename: url.split('/').pop() });
      return { _type: 'image', asset: { _type: 'reference', _ref: asset._id } };
    } catch (e) {
      if (attempt === 3) {
        console.warn(`  ⚠ kép kihagyva (${url}): ${e.message}`);
        return undefined;
      }
      await new Promise((r) => setTimeout(r, 600 * attempt));
    }
  }
}

async function runSlammers({ projectId, dataset, token }) {
  const raw = await fetchAll('pages', { parent: SLAMMER_PARENT });
  const slammers = raw
    .filter((p) => !SKIP_TITLE.test(p.title?.rendered ?? ''))
    .map((p) => ({ doc: mapSlammer(p), photo: featuredUrl(p) }));
  console.log(`Slammerek (parent ${SLAMMER_PARENT}): ${slammers.length}`);

  if (DRY || !token) {
    if (!token) console.log('Nincs SANITY_WRITE_TOKEN → dry-run mód.');
    writeFileSync('migration-slammers.json', JSON.stringify(slammers.map((x) => ({ ...x.doc, _photo: x.photo })), null, 2));
    console.log('Dry-run: migration-slammers.json kiírva (nincs Sanity-írás, nincs kép-feltöltés).');
    return;
  }

  const client = createClient({ projectId, dataset, token, useCdn: false, apiVersion: '2024-01-01' });
  let n = 0;
  let failed = 0;
  for (const { doc, photo } of slammers) {
    try {
      const img = await uploadCover(client, photo);
      await client.createOrReplace(img ? { ...doc, photo: img } : doc);
      n++;
      if (n % 10 === 0) console.log(`  ${n} slammer importálva…`);
    } catch (e) {
      failed++;
      console.warn(`  ⚠ sikertelen: ${doc._id} — ${e.message}`);
    }
  }
  console.log(`Kész: ${n} slammer importálva${failed ? `, ${failed} sikertelen` : ''}. Nézd át a Studióban!`);
}

async function main() {
  const projectId = process.env.PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.PUBLIC_SANITY_DATASET ?? 'production';
  const token = process.env.SANITY_WRITE_TOKEN;

  if (SLAMMERS) {
    await runSlammers({ projectId, dataset, token });
    return;
  }

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
  let failed = 0;
  for (const { doc, cover } of [...posts, ...pages]) {
    try {
      const coverImg = doc._type === 'post' ? await uploadCover(client, cover) : undefined;
      await client.createOrReplace(coverImg ? { ...doc, cover: coverImg } : doc);
      n++;
      if (n % 10 === 0) console.log(`  ${n} dokumentum importálva…`);
    } catch (e) {
      failed++;
      console.warn(`  ⚠ sikertelen: ${doc._id} — ${e.message}`);
    }
  }
  console.log(`Kész: ${n} dokumentum importálva${failed ? `, ${failed} sikertelen` : ''}. Nézd át a Studióban!`);
}

main().catch((e) => { console.error(e); process.exit(1); });
