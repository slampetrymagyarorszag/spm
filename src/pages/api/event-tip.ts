import type { APIRoute } from 'astro';
import { sanityClient } from 'sanity:client';
import { validateEventTip, isConsented } from '../../lib/validation';
import { getEmailSettings } from '../../sanity/lib/api';
import { sendMail } from '../../lib/mailer';
import { escapeHtml as esc } from '../../lib/escape';
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
  if (!isConsented(data.consent)) {
    return json({ ok: false, error: 'A beküldéshez el kell fogadnod a feltételeket.' }, 400);
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

    // Best-effort értesítő a kezelőnek (ha be van állítva).
    try {
      const emails = await getEmailSettings(sanityClient);
      if (emails.notifyOnSubmissions && emails.notifyEmail) {
        await sendMail({
          to: emails.notifyEmail,
          subject: 'Új esemény-tipp érkezett — elbírálásra',
          html: `<h2>Új esemény-tipp</h2>
            <p><strong>Rendezvény:</strong> ${esc(String(data.eventName))}</p>
            <p>Nézd át és hagyd jóvá a Studióban: <em>📥 Beküldött események → Elbírálásra vár</em>.</p>`,
        });
      }
    } catch { /* az értesítő nem kötelező */ }

    return json({ ok: true }, 200);
  } catch (e) {
    return json({ ok: false, error: 'A beküldés sikertelen. Próbáld újra később.' }, 500);
  }
};
