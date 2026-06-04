import type { APIRoute } from 'astro';
import { sanityClient } from 'sanity:client';
import { validateSubmission } from '../../lib/validation';
import { sendMail } from '../../lib/mailer';
import { escapeHtml as esc, sanitizeHeader } from '../../lib/escape';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json().catch(() => ({}));
  const result = validateSubmission(data);
  if (!result.ok) {
    const status = result.error === 'spam' ? 200 : 400;
    return new Response(JSON.stringify({ ok: result.error === 'spam' }), { status, headers: { 'Content-Type': 'application/json' } });
  }
  // A címzettet és az esemény címét a szerver olvassa ki (a kliens nem adhatja meg).
  const slug = typeof data.eventSlug === 'string' ? data.eventSlug : '';
  const fallback = import.meta.env.CONTACT_EMAIL ?? process.env.CONTACT_EMAIL ?? 'contest@slampoetry.hu';
  const ev = slug
    ? await sanityClient.fetch(
        `*[_type == "event" && slug.current == $slug][0]{ title, registrationEnabled, registrationEmail }`,
        { slug }
      )
    : null;
  if (!ev || ev.registrationEnabled !== true) {
    return new Response(JSON.stringify({ ok: false, error: 'Erre az eseményre nem lehet jelentkezni.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  const to = ev.registrationEmail || fallback;
  const html = `<h2>Új jelentkezés: ${esc(ev.title)}</h2>
    <p><strong>Név:</strong> ${esc(data.name)}</p>
    <p><strong>Email:</strong> ${esc(data.email)}</p>
    ${data.phone ? `<p><strong>Telefon:</strong> ${esc(data.phone)}</p>` : ''}
    <p><strong>Üzenet:</strong><br>${esc(data.message).replace(/\n/g, '<br>')}</p>`;
  try {
    await sendMail({ to, subject: sanitizeHeader(`Jelentkezés — ${ev.title}`), html, replyTo: sanitizeHeader(data.email) });
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'A jelentkezés küldése sikertelen. Próbáld újra később.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
