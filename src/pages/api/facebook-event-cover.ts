import type { APIRoute } from 'astro';

export const prerender = false;
const GRAPH = 'https://graph.facebook.com/v19.0';
const json = (body: unknown, status: number) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export const GET: APIRoute = async ({ url }) => {
  const token = import.meta.env.FB_PAGE_ACCESS_TOKEN ?? process.env.FB_PAGE_ACCESS_TOKEN;
  if (!token) return json({ ok: false, error: 'Nincs beállítva Facebook Page-token a szerveren.' }, 503);
  const raw = url.searchParams.get('url') || '';
  let eventId: string | undefined;
  try {
    const parsed = new URL(raw);
    if (!['facebook.com', 'www.facebook.com', 'm.facebook.com'].includes(parsed.hostname)) throw new Error('not-facebook');
    eventId = parsed.pathname.match(/^\/events\/(\d+)(?:\/|$)/)?.[1];
  } catch { /* hibás link */ }
  if (!eventId) return json({ ok: false, error: 'Facebook-esemény link kell, például facebook.com/events/123456…' }, 400);

  try {
    const endpoint = new URL(`${GRAPH}/${eventId}`);
    endpoint.searchParams.set('fields', 'cover,name');
    endpoint.searchParams.set('access_token', token);
    const response = await fetch(endpoint);
    const event = await response.json();
    if (!response.ok || event.error) return json({ ok: false, error: event.error?.message || 'A Facebook nem adta vissza az eseményt.' }, 502);
    if (!event.cover?.source) return json({ ok: false, error: 'Ehhez az eseményhez a Facebook nem adott elérhető borítót.' }, 404);

    const imageResponse = await fetch(event.cover.source);
    if (!imageResponse.ok) return json({ ok: false, error: 'A Facebook borítóképe nem tölthető le.' }, 502);
    const contentType = imageResponse.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) return json({ ok: false, error: 'A Facebook nem képfájlt adott vissza.' }, 502);
    const bytes = Buffer.from(await imageResponse.arrayBuffer());
    if (bytes.length > 8 * 1024 * 1024) return json({ ok: false, error: 'A borítókép 8 MB-nál nagyobb; töltsd fel kézzel.' }, 413);
    return json({ ok: true, imageData: bytes.toString('base64'), imageType: contentType, eventName: event.name || '' }, 200);
  } catch (e: any) {
    return json({ ok: false, error: e?.message || 'A borítókép lekérése nem sikerült.' }, 502);
  }
};
