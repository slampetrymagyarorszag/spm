import type { APIRoute } from 'astro';
import { sanityClient } from 'sanity:client';
import { getEmailSettings } from '../../sanity/lib/api';
import { validateSubmission, validateChampionship } from '../../lib/validation';
import { sendMail } from '../../lib/mailer';
import { escapeHtml as esc, sanitizeHeader } from '../../lib/escape';

export const prerender = false;

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json().catch(() => ({}));
  const isChampionship = data.kind === 'championship';

  // A megfelelő validáció a jelentkezés típusa szerint.
  const result = isChampionship ? validateChampionship(data) : validateSubmission(data);
  if (!result.ok) {
    if (result.error === 'spam') return json({ ok: true }, 200);
    return json({ ok: false, error: result.error }, 400);
  }

  // A címzettet és az esemény címét a szerver olvassa ki (a kliens nem adhatja meg).
  const slug = typeof data.eventSlug === 'string' ? data.eventSlug : '';
  const emails = await getEmailSettings(sanityClient);
  const fallback = emails.applicationsEmail ?? import.meta.env.CONTACT_EMAIL ?? process.env.CONTACT_EMAIL ?? 'contest@slampoetry.hu';
  const ev = slug
    ? await sanityClient.fetch(
        `*[_type == "event" && slug.current == $slug][0]{ title, registrationEnabled, championshipRegistration, registrationEmail }`,
        { slug }
      )
    : null;
  if (!ev || ev.registrationEnabled !== true) {
    return json({ ok: false, error: 'Erre az eseményre nem lehet jelentkezni.' }, 400);
  }

  const to = ev.registrationEmail || fallback;
  let subject: string;
  let html: string;

  if (isChampionship) {
    subject = `Bajnoki jelentkezés — ${ev.title}`;
    html = `<h2>Új bajnoki jelentkezés: ${esc(ev.title)}</h2>
      <p><strong>Név:</strong> ${esc(data.name)}</p>
      <p><strong>Email:</strong> ${esc(data.email)}</p>
      <p><strong>Művésznév:</strong> ${esc(data.stageName)}</p>
      ${data.achievements ? `<p><strong>Eddigi eredmények:</strong><br>${esc(String(data.achievements)).replace(/\n/g, '<br>')}</p>` : ''}
      ${data.unavailableDay ? `<p><strong>Nem megfelelő nap:</strong><br>${esc(String(data.unavailableDay)).replace(/\n/g, '<br>')}</p>` : '<p><em>Nem jelzett ütköző napot.</em></p>'}`;
  } else {
    subject = `Jelentkezés — ${ev.title}`;
    html = `<h2>Új jelentkezés: ${esc(ev.title)}</h2>
      <p><strong>Név:</strong> ${esc(data.name)}</p>
      <p><strong>Email:</strong> ${esc(data.email)}</p>
      ${data.phone ? `<p><strong>Telefon:</strong> ${esc(data.phone)}</p>` : ''}
      <p><strong>Üzenet:</strong><br>${esc(data.message).replace(/\n/g, '<br>')}</p>`;
  }

  try {
    await sendMail({ to, subject: sanitizeHeader(subject), html, replyTo: sanitizeHeader(data.email) });
    return json({ ok: true }, 200);
  } catch (e) {
    return json({ ok: false, error: 'A jelentkezés küldése sikertelen. Próbáld újra később.' }, 500);
  }
};
