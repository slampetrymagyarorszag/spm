import type { APIRoute } from 'astro';
import { sanityClient } from 'sanity:client';
import { sendMail } from '../../lib/mailer';
import { sanitizeHeader } from '../../lib/escape';
import {
  buildRecipients,
  renderPressEmailHtml,
  unsubscribeToken,
  type PressContact,
} from '../../lib/press';

export const prerender = false;

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const envOf = (k: string) => (import.meta.env as any)[k] ?? process.env[k];

export const POST: APIRoute = async ({ request }) => {
  const authSecret = envOf('PRESS_SEND_SECRET');
  const unsubSecret = envOf('PRESS_UNSUB_SECRET');
  const from = envOf('PRESS_FROM') || 'Slam Poetry Magyarország <sajto@slampoetry.hu>';
  const replyTo = envOf('PRESS_REPLY_TO') || 'media@slampoetry.hu';
  const siteUrl = envOf('PUBLIC_SITE_URL') || 'https://slampoetry.hu';

  // Fail closed: titok nélkül a végpont nem küld semmit.
  if (!authSecret || !unsubSecret) {
    return json({ ok: false, error: 'A kiküldés nincs konfigurálva (PRESS_SEND_SECRET / PRESS_UNSUB_SECRET).' }, 503);
  }

  const data = await request.json().catch(() => ({}));
  if (String(data.secret || '') !== String(authSecret)) {
    return json({ ok: false, error: 'Hibás kiküldési jelszó.' }, 401);
  }

  const subject = String(data.subject || '').trim();
  const body = String(data.body || '').trim();
  if (subject.length < 3) return json({ ok: false, error: 'A tárgy megadása kötelező.' }, 400);
  if (body.length < 10) return json({ ok: false, error: 'A közlemény szövege túl rövid.' }, 400);

  const tag = data.tag ? String(data.tag) : undefined;
  const testTo = data.testTo ? String(data.testTo).trim() : '';

  // TESZT-KÜLDÉS: egyetlen címre, a valódi listát nem érinti.
  if (testTo) {
    const token = unsubscribeToken(testTo, unsubSecret);
    const unsubscribeUrl = `${siteUrl}/api/press-unsubscribe?e=${encodeURIComponent(testTo)}&t=${token}`;
    try {
      await sendMail({
        from,
        to: sanitizeHeader(testTo),
        replyTo: sanitizeHeader(replyTo),
        subject: sanitizeHeader(`[TESZT] ${subject}`),
        html: renderPressEmailHtml({ subject, body, unsubscribeUrl, siteUrl }),
        headers: { 'List-Unsubscribe': `<${unsubscribeUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
      });
      return json({ ok: true, test: true, sent: 1 }, 200);
    } catch (e: any) {
      return json({ ok: false, error: `A teszt-levél nem ment ki: ${e?.message || 'ismeretlen hiba'}` }, 500);
    }
  }

  // ÉLES KIKÜLDÉS: a címzetteket a SZERVER olvassa a Sanityből — a kliens nem adhat meg
  // tetszőleges címlistát, így a végpontot nem lehet spam-relayként használni.
  let contacts: PressContact[] = [];
  try {
    contacts = (await sanityClient.fetch(
      '*[_type == "pressContact"]{_id, name, email, outlet, tags, subscribed}',
    )) as PressContact[];
  } catch {
    return json({ ok: false, error: 'A sajtólistát nem sikerült beolvasni.' }, 500);
  }

  const recipients = buildRecipients(contacts, tag);
  if (recipients.length === 0) {
    return json({ ok: false, error: 'Nincs kiküldhető címzett ezzel a szűréssel.' }, 400);
  }
  if (data.confirmCount !== recipients.length) {
    return json(
      { ok: false, error: `A címzettek száma közben megváltozott (${recipients.length}). Frissíts és próbáld újra.`, count: recipients.length },
      409,
    );
  }

  const failed: { email: string; error: string }[] = [];
  let sent = 0;
  for (const r of recipients) {
    const email = r.email!;
    const token = unsubscribeToken(email, unsubSecret);
    const unsubscribeUrl = `${siteUrl}/api/press-unsubscribe?e=${encodeURIComponent(email)}&t=${token}`;
    try {
      await sendMail({
        from,
        to: sanitizeHeader(email),
        replyTo: sanitizeHeader(replyTo),
        subject: sanitizeHeader(subject),
        html: renderPressEmailHtml({ subject, body, unsubscribeUrl, siteUrl }),
        headers: { 'List-Unsubscribe': `<${unsubscribeUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
      });
      sent++;
    } catch (e: any) {
      failed.push({ email, error: e?.message || 'ismeretlen hiba' });
    }
    // Kímélet a szolgáltató percenkénti korlátjának.
    await new Promise((res) => setTimeout(res, 120));
  }

  return json({ ok: true, sent, failed, total: recipients.length }, 200);
};
