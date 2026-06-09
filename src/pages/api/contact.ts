import type { APIRoute } from 'astro';
import { sanityClient } from 'sanity:client';
import { validateSubmission } from '../../lib/validation';
import { getEmailSettings } from '../../sanity/lib/api';
import { sendMail } from '../../lib/mailer';
import { escapeHtml as esc, sanitizeHeader } from '../../lib/escape';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json().catch(() => ({}));
  const result = validateSubmission(data);
  if (!result.ok) {
    const status = result.error === 'spam' ? 200 : 400; // spam: csendben elnyel
    return new Response(JSON.stringify({ ok: result.error === 'spam' }), { status, headers: { 'Content-Type': 'application/json' } });
  }
  // A címzettet a SZERVER dönti el (a kliens csak egy 'dept' kulcsot ad, sosem tetszőleges
  // email-címet) — így nem lehet az űrlapot spam-relayként használni. A konkrét címeket a
  // Sanity „Email-címzettek" blokkból olvassuk; üres esetén alapértékek.
  const emails = await getEmailSettings(sanityClient);
  const envFallback = import.meta.env.CONTACT_EMAIL ?? process.env.CONTACT_EMAIL ?? 'info@slampoetry.hu';
  const general = emails.generalEmail || envFallback;
  const press = emails.pressEmail || 'media@slampoetry.hu';
  const to = data.dept === 'media' ? press : general;
  const html = `<h2>Új üzenet a weboldalról</h2>
    <p><strong>Név:</strong> ${esc(data.name)}</p>
    <p><strong>Email:</strong> ${esc(data.email)}</p>
    ${data.phone ? `<p><strong>Telefon:</strong> ${esc(data.phone)}</p>` : ''}
    <p><strong>Üzenet:</strong><br>${esc(data.message).replace(/\n/g, '<br>')}</p>`;
  try {
    await sendMail({ to, subject: 'Kapcsolati üzenet — slampoetry.hu', html, replyTo: sanitizeHeader(data.email) });
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'Az üzenet küldése sikertelen. Próbáld újra később.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
