import type { APIRoute } from 'astro';
import { validateEventTip } from '../../lib/validation';
import { writeClient } from '../../sanity/lib/writeClient';

export const prerender = false;

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json().catch(() => ({}));
  const result = validateEventTip(data);
  if (!result.ok) {
    if (result.error === 'spam') return json({ ok: true }, 200); // spam: csendben elnyel
    return json({ ok: false, error: result.error }, 400);
  }

  if (!writeClient) {
    return json({ ok: false, error: 'A beküldés most nem elérhető. Próbáld újra később.' }, 503);
  }

  try {
    // Elbírálásra váró dokumentum (approved: false) — a szerkesztő hagyja jóvá a Studióban.
    await writeClient.create({
      _type: 'eventTip',
      eventName: String(data.eventName).trim().slice(0, 200),
      description: String(data.description).trim().slice(0, 2000),
      facebookUrl: String(data.facebookUrl).trim().slice(0, 500),
      submitterEmail: data.email ? String(data.email).trim().slice(0, 200) : undefined,
      submittedAt: new Date().toISOString(),
      approved: false,
    });
    return json({ ok: true }, 200);
  } catch (e) {
    return json({ ok: false, error: 'A beküldés sikertelen. Próbáld újra később.' }, 500);
  }
};
