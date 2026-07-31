import type { APIRoute } from 'astro';
import { sanityClient } from 'sanity:client';
import { validateSlamClub } from '../../lib/validation';
import { getEmailSettings } from '../../sanity/lib/api';
import { sendMail } from '../../lib/mailer';
import { escapeHtml as esc } from '../../lib/escape';
import { submissionRecipients, notifyFallbackEmail } from '../../lib/recipients';
import { writeClient } from '../../sanity/lib/writeClient';

export const prerender = false;

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json().catch(() => ({}));
  const result = validateSlamClub(data);
  if (!result.ok) {
    if (result.error === 'spam') return json({ ok: true }, 200);
    return json({ ok: false, error: result.error }, 400);
  }
  if (!writeClient) {
    return json({ ok: false, error: 'A beküldés most nem elérhető. Próbáld újra később.' }, 503);
  }
  try {
    await writeClient.create({
      _type: 'slamClub',
      city: String(data.city).trim().slice(0, 120),
      name: data.name ? String(data.name).trim().slice(0, 160) : undefined,
      facebookUrl: String(data.facebookUrl).trim().slice(0, 500),
      submitterEmail: data.email ? String(data.email).trim().slice(0, 200) : undefined,
      submittedAt: new Date().toISOString(),
      approved: false,
    });

    // Best-effort értesítő a kezelőnek.
    try {
      const emails = await getEmailSettings(sanityClient);
      const to = submissionRecipients(emails, notifyFallbackEmail(import.meta.env, process.env));
      if (to.length) {
        await sendMail({
          to,
          subject: 'Új klub beküldés — elbírálásra',
          html: `<h2>Új klub</h2>
            <p><strong>Város:</strong> ${esc(String(data.city))}</p>
            ${data.name ? `<p><strong>Név:</strong> ${esc(String(data.name))}</p>` : ''}
            <p><strong>Link:</strong> ${esc(String(data.facebookUrl))}</p>
            <p>Hagyd jóvá a Studióban: <em>🏙️ Klubok → Elbírálásra vár</em>.</p>`,
        });
      }
    } catch { /* nem kötelező */ }

    return json({ ok: true }, 200);
  } catch (e) {
    return json({ ok: false, error: 'A beküldés sikertelen. Próbáld újra később.' }, 500);
  }
};
