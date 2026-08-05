import type { APIRoute } from 'astro';
import { sanityClient } from 'sanity:client';
import { getEmailSettings } from '../../sanity/lib/api';
import {
  validateSubmission,
  validateChampionship,
  normalizeAvailableDays,
  DEFAULT_CHAMPIONSHIP_DAYS,
} from '../../lib/validation';
import { isCtaActive } from '../../sanity/lib/cta';
import { championshipConfirmationHtml, championshipConfirmationSubject } from '../../lib/championshipMail';
import { sendMail } from '../../lib/mailer';
import { escapeHtml as esc, sanitizeHeader } from '../../lib/escape';
import { writeClient } from '../../sanity/lib/writeClient';

export const prerender = false;

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json().catch(() => ({}));
  const isChampionship = data.kind === 'championship';
  const slug = typeof data.eventSlug === 'string' ? data.eventSlug : '';
  // Eseményhez NEM kötött bajnoki jelentkezés: a főoldali CTA felugró űrlapja. Ilyenkor
  // nincs eventSlug, a jelentkezés jogosságát a siteSettings CTA-időablaka dönti el.
  const isStandaloneChampionship = isChampionship && !slug;

  // A választható napokat is a szerver adja (a kliens nem küldhet tetszőleges napot).
  const cta = isStandaloneChampionship
    ? await sanityClient.fetch(
        `*[_type == "siteSettings"][0]{ championshipCtaEnabled, championshipCtaLabel, championshipCtaFrom, championshipCtaTo, championshipDays }`,
      )
    : null;
  const allowedDays: string[] =
    Array.isArray(cta?.championshipDays) && cta.championshipDays.length
      ? cta.championshipDays.map((d: unknown) => String(d))
      : DEFAULT_CHAMPIONSHIP_DAYS;

  // A megfelelő validáció a jelentkezés típusa szerint. A felugró űrlapon legalább egy
  // megfelelő napot meg kell jelölni (ez vezérli a sorsolást), a beágyazott, eseményhez
  // kötött űrlapon viszont — a korábbi viselkedést megtartva — nem kötelező.
  const result = isChampionship
    ? validateChampionship(data, isStandaloneChampionship ? { requireDays: true, allowedDays } : {})
    : validateSubmission(data);
  if (!result.ok) {
    if (result.error === 'spam') return json({ ok: true }, 200);
    return json({ ok: false, error: result.error }, 400);
  }

  // A címzettet és az esemény címét a szerver olvassa ki (a kliens nem adhatja meg).
  const emails = await getEmailSettings(sanityClient);
  const fallback = emails.applicationsEmail ?? import.meta.env.CONTACT_EMAIL ?? process.env.CONTACT_EMAIL ?? 'contest@slampoetry.hu';

  let ev: { title: string; registrationEmail?: string } | null = null;
  if (isStandaloneChampionship) {
    // Csak akkor fogadjuk el, ha a CTA a Studióban tényleg be van kapcsolva és épp aktív —
    // különben egy lejárt űrlappal is lehetne jelentkezni.
    if (!isCtaActive(cta ?? {})) {
      return json({ ok: false, error: 'A bajnokságra jelentkezés jelenleg nem nyitott.' }, 400);
    }
    ev = { title: cta?.championshipCtaLabel || 'Országos bajnokság' };
  } else {
    const found = slug
      ? await sanityClient.fetch(
          `*[_type == "event" && slug.current == $slug][0]{ title, registrationEnabled, championshipRegistration, registrationEmail }`,
          { slug }
        )
      : null;
    if (!found || found.registrationEnabled !== true) {
      return json({ ok: false, error: 'Erre az eseményre nem lehet jelentkezni.' }, 400);
    }
    ev = found;
  }

  const days = normalizeAvailableDays(data.availableDays, allowedDays);
  const note = typeof data.note === 'string' ? data.note.trim().slice(0, 3000) : '';
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
      ${days.length ? `<p><strong>Megfelelő napok:</strong> ${esc(days.join(', '))}</p>` : ''}
      ${note ? `<p><strong>Megjegyzés:</strong><br>${esc(note).replace(/\n/g, '<br>')}</p>` : ''}
      ${data.unavailableDay ? `<p><strong>Nem megfelelő nap:</strong><br>${esc(String(data.unavailableDay)).replace(/\n/g, '<br>')}</p>` : ''}`;
  } else {
    subject = `Jelentkezés — ${ev.title}`;
    html = `<h2>Új jelentkezés: ${esc(ev.title)}</h2>
      <p><strong>Név:</strong> ${esc(data.name)}</p>
      <p><strong>Email:</strong> ${esc(data.email)}</p>
      ${data.phone ? `<p><strong>Telefon:</strong> ${esc(data.phone)}</p>` : ''}
      <p><strong>Üzenet:</strong><br>${esc(data.message).replace(/\n/g, '<br>')}</p>`;
  }

  // A bajnoki jelentkezéseket időbélyeggel naplózzuk a Sanityben (export miatt).
  if (isChampionship) {
    try {
      if (writeClient) {
        await writeClient.create({
          _type: 'formSubmission', kind: 'bajnoksag', submittedAt: new Date().toISOString(),
          name: String(data.name || '').slice(0, 200),
          email: String(data.email || '').slice(0, 200),
          stageName: data.stageName ? String(data.stageName).slice(0, 200) : undefined,
          contextLabel: ev.title,
          achievements: data.achievements ? String(data.achievements).slice(0, 3000) : undefined,
          availableDays: days.length ? days : undefined,
          note: note || undefined,
          unavailableDay: data.unavailableDay ? String(data.unavailableDay).slice(0, 1000) : undefined,
        });
      }
    } catch { /* a napló nem kötelező */ }
  }

  try {
    await sendMail({ to, subject: sanitizeHeader(subject), html, replyTo: sanitizeHeader(data.email) });
  } catch (e) {
    return json({ ok: false, error: 'A jelentkezés küldése sikertelen. Próbáld újra később.' }, 500);
  }

  // Automatikus visszaigazolás a JELENTKEZŐNEK. Best-effort: a jelentkezés ekkor már
  // rögzült és a szervezők értesültek, ezért egy hibás címzett vagy egy Resend-hiba
  // nem buktathatja a beküldést — a felhasználó sikert lát.
  if (isChampionship) {
    try {
      const social = await sanityClient.fetch(`*[_type == "siteSettings"][0].social`);
      await sendMail({
        to: sanitizeHeader(String(data.email)),
        subject: championshipConfirmationSubject(),
        html: championshipConfirmationHtml({ name: data.name, days, social }),
      });
    } catch { /* a visszaigazolás nem kötelező */ }
  }

  return json({ ok: true }, 200);
};
