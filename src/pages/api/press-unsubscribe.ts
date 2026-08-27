import type { APIRoute } from 'astro';
import { writeClient } from '../../sanity/lib/writeClient';
import { verifyUnsubscribeToken } from '../../lib/press';
import { escapeHtml as esc } from '../../lib/escape';

export const prerender = false;

const envOf = (k: string) => (import.meta.env as any)[k] ?? process.env[k];

function page(title: string, message: string, status: number): Response {
  const html = `<!doctype html>
<html lang="hu"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(title)} — Slam Poetry Magyarország</title></head>
<body style="margin:0;font-family:Inter,Arial,sans-serif;background:#f6f6f9;color:#17171c">
  <div style="max-width:520px;margin:12vh auto;padding:32px;background:#fff;border-radius:16px;border:1px solid #e4e4e7">
    <h1 style="font-size:22px;margin:0 0 12px">${esc(title)}</h1>
    <p style="line-height:1.6;margin:0 0 20px">${esc(message)}</p>
    <a href="https://slampoetry.hu" style="color:#b13bd6">Vissza a slampoetry.hu-ra</a>
  </div>
</body></html>`;
  return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

/** A tényleges leiratkozás. GET és POST is ide fut (a levelezők egykattintásos POST-ot küldenek). */
async function handle(request: Request): Promise<Response> {
  const secret = envOf('PRESS_UNSUB_SECRET');
  const url = new URL(request.url);
  const email = (url.searchParams.get('e') || '').trim().toLowerCase();
  const token = url.searchParams.get('t') || '';

  if (!secret) return page('Nem elérhető', 'A leiratkozás jelenleg nincs beállítva. Írj a media@slampoetry.hu címre, és kézzel levesszük a listáról.', 503);
  if (!verifyUnsubscribeToken(email, token, secret)) {
    return page('Érvénytelen link', 'Ez a leiratkozó link érvénytelen vagy hiányos. Írj a media@slampoetry.hu címre, és levesszük a listáról.', 400);
  }
  if (!writeClient) {
    return page('Átmeneti hiba', 'A leiratkozást most nem tudjuk rögzíteni. Kérlek próbáld újra később, vagy írj a media@slampoetry.hu címre.', 503);
  }

  try {
    const ids: string[] = await writeClient.fetch(
      '*[_type == "pressContact" && lower(email) == $e]._id',
      { e: email },
    );
    // Ismeretlen cím esetén sem áruljuk el, hogy szerepel-e a listán.
    if (ids.length) {
      const tx = ids.reduce(
        (t, id) => t.patch(id, (p) => p.set({ subscribed: false, unsubscribedAt: new Date().toISOString() })),
        writeClient.transaction(),
      );
      await tx.commit({ visibility: 'async' });
    }
    return page('Leiratkoztál', 'Rendben — többé nem küldünk sajtóközleményt erre a címre. Ha meggondolod magad, írj a media@slampoetry.hu címre.', 200);
  } catch {
    return page('Átmeneti hiba', 'A leiratkozást most nem tudtuk rögzíteni. Kérlek próbáld újra később, vagy írj a media@slampoetry.hu címre.', 500);
  }
}

export const GET: APIRoute = ({ request }) => handle(request);
export const POST: APIRoute = ({ request }) => handle(request);
