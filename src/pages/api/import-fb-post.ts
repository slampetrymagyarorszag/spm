import type { APIRoute } from 'astro';
import { writeClient } from '../../sanity/lib/writeClient';
import { slugify } from '../../sanity/lib/slugify';
import { parseFbPostId, fbObjectIdCandidates, deriveTitleAndBody, isOpaquePostId } from '../../lib/facebook';

export const prerender = false;

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const key = () => Math.random().toString(36).slice(2, 10);
const GRAPH = 'https://graph.facebook.com/v19.0';

/**
 * Az oldal legutóbbi posztjai, választáshoz.
 *
 * Erre azért van szükség, mert a mai Facebook-linkek `pfbid…` alakúak, azt pedig a Graph API
 * NEM tudja feloldani (a nyers lekérés „(#12) singular statuses API is deprecated” hibát ad),
 * és a Graph saját `permalink_url`-je sem pfbid-et ad vissza, tehát összepárosítani sem lehet.
 * A poszt-listából viszont a szerkesztő egy kattintással kiválaszthatja, amelyiket akarja.
 */
export const GET: APIRoute = async () => {
  const env = import.meta.env as any;
  const token = env.FB_PAGE_ACCESS_TOKEN ?? process.env.FB_PAGE_ACCESS_TOKEN;
  const pageId = env.FB_PAGE_ID ?? process.env.FB_PAGE_ID;
  if (!token || !pageId) {
    return json({ ok: false, error: 'Hiányzik a Facebook Page access token vagy az oldal azonosítója.' }, 503);
  }
  try {
    const res = await fetch(
      `${GRAPH}/${encodeURIComponent(pageId)}/posts?fields=id,message,created_time,full_picture,permalink_url&limit=25&access_token=${encodeURIComponent(token)}`,
    );
    const j = await res.json();
    if (j?.error) return json({ ok: false, error: j.error.message || 'A Facebook nem adta vissza a posztokat.' }, 400);
    const posts = (j.data || []).map((p: any) => ({
      id: p.id,
      message: String(p.message || ''),
      createdTime: p.created_time,
      picture: p.full_picture || null,
      permalink: p.permalink_url || null,
    }));
    return json({ ok: true, posts }, 200);
  } catch (e: any) {
    return json({ ok: false, error: e?.message || 'A posztok lekérése nem sikerült.' }, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  const env = import.meta.env as any;
  const token = env.FB_PAGE_ACCESS_TOKEN ?? process.env.FB_PAGE_ACCESS_TOKEN;
  const pageId = env.FB_PAGE_ID ?? process.env.FB_PAGE_ID;

  if (!token) {
    return json({ ok: false, error: 'Hiányzik a Facebook Page access token. Tedd be az .env-be: FB_PAGE_ACCESS_TOKEN (és FB_PAGE_ID).' }, 503);
  }
  if (!writeClient) {
    return json({ ok: false, error: 'A Sanity írás most nem elérhető (SANITY_FORM_TOKEN).' }, 503);
  }

  const data = await request.json().catch(() => ({}));

  // A listából választott poszt már kész Graph-azonosítót küld; a beillesztett linkből
  // viszont ki kell nyerni.
  const chosenId = typeof data.postId === 'string' ? data.postId.trim() : '';
  const url = typeof data.url === 'string' ? data.url : '';
  const postId = chosenId || parseFbPostId(url);

  if (!postId) {
    return json({ ok: false, error: 'Nem ismerem fel a Facebook poszt linket. Válassz a lenti listából.' }, 400);
  }
  if (!chosenId && isOpaquePostId(postId)) {
    return json(
      {
        ok: false,
        opaqueLink: true,
        error:
          'Ez egy „pfbid…” alakú link, amit a Facebook API nem tud feloldani — ezt nem tudjuk megkerülni. ' +
          'Válaszd ki a posztot a lenti listából, az egy kattintás.',
      },
      400,
    );
  }

  // Graph API: végigpróbáljuk az objektum-ID jelölteket.
  let fb: any = null;
  let lastErr = 'Ismeretlen hiba.';
  for (const oid of chosenId ? [chosenId] : fbObjectIdCandidates(postId, pageId)) {
    try {
      const res = await fetch(`${GRAPH}/${encodeURIComponent(oid)}?fields=message,full_picture,created_time,permalink_url&access_token=${encodeURIComponent(token)}`);
      const j = await res.json();
      if (j && !j.error) { fb = j; break; }
      if (j?.error?.message) lastErr = j.error.message;
    } catch (e: any) {
      lastErr = e?.message || lastErr;
    }
  }
  if (!fb) {
    return json({ ok: false, error: `A Facebook nem adta vissza a posztot: ${lastErr}` }, 400);
  }

  const message = String(fb.message || '').trim();
  if (!message && !fb.full_picture) {
    return json({ ok: false, error: 'A posztnak nincs kiolvasható szövege vagy képe (lehet, hogy csak megosztás).' }, 400);
  }

  const { title, paragraphs } = deriveTitleAndBody(message);
  const finalTitle = title || `Facebook hír — ${new Date(fb.created_time || Date.now()).toLocaleDateString('hu-HU')}`;
  const publishedAt = fb.created_time ? new Date(fb.created_time).toISOString() : new Date().toISOString();

  // Egyedi slug.
  const base = slugify(finalTitle) || 'hir';
  let slug = base;
  try {
    const taken = await writeClient.fetch('count(*[_type=="post" && slug.current==$s])', { s: slug });
    if (taken > 0) slug = `${base}-${key().slice(0, 4)}`;
  } catch { /* ha a count elhasal, marad az alap slug */ }

  // Borítókép letöltése és feltöltése (best-effort).
  let cover: any = undefined;
  if (fb.full_picture) {
    try {
      const imgRes = await fetch(fb.full_picture);
      if (imgRes.ok) {
        const buf = Buffer.from(await imgRes.arrayBuffer());
        const asset = await writeClient.assets.upload('image', buf, { filename: `${base}.jpg`, contentType: imgRes.headers.get('content-type') || 'image/jpeg' });
        cover = { _type: 'image', asset: { _type: 'reference', _ref: asset._id }, alt: finalTitle };
      }
    } catch { /* a kép nem kötelező */ }
  }

  const body = paragraphs.map((p) => ({
    _type: 'block', _key: key(), style: 'normal', markDefs: [],
    children: [{ _type: 'span', _key: key(), text: p, marks: [] }],
  }));

  try {
    const created = await writeClient.create({
      _type: 'post',
      title: finalTitle,
      slug: { _type: 'slug', current: slug },
      publishedAt,
      author: 'Slam Poetry Magyarország',
      excerpt: message ? message.slice(0, 220) : undefined,
      cover,
      body: body.length ? body : undefined,
      tags: ['facebook'],
    });
    return json({ ok: true, id: created._id, slug, title: finalTitle, hadImage: !!cover }, 200);
  } catch (e: any) {
    return json({ ok: false, error: `Nem sikerült létrehozni a hírt: ${e?.message || 'ismeretlen hiba'}` }, 500);
  }
};
