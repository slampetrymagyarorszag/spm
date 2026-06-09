import type { APIRoute } from 'astro';
import { sanityClient } from 'sanity:client';
import { validateMonthlyContest } from '../../lib/validation';
import { sendMail } from '../../lib/mailer';
import { escapeHtml as esc, sanitizeHeader } from '../../lib/escape';

export const prerender = false;

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json().catch(() => ({}));
  const result = validateMonthlyContest(data);
  if (!result.ok) {
    if (result.error === 'spam') return json({ ok: true }, 200);
    return json({ ok: false, error: result.error }, 400);
  }

  // A szerver ellenőrzi, hogy a jelentkezés tényleg nyitva van-e, és innen veszi a
  // hónap-címkét is (a kliens nem hamisíthatja).
  const mc = await sanityClient.fetch(
    `*[_type == "siteSettings"][0].monthlyContest{ enabled, monthLabel, opensAt, closesAt }`,
  );
  if (!mc || mc.enabled !== true) {
    return json({ ok: false, error: 'A jelentkezés jelenleg nem elérhető.' }, 400);
  }
  const now = Date.now();
  if (mc.opensAt && now < Date.parse(mc.opensAt)) {
    return json({ ok: false, error: 'A jelentkezés még nem nyílt meg.' }, 400);
  }
  if (mc.closesAt && now > Date.parse(mc.closesAt)) {
    return json({ ok: false, error: 'A jelentkezési időszak lezárult.' }, 400);
  }

  const to = import.meta.env.CONTACT_EMAIL ?? process.env.CONTACT_EMAIL ?? 'contest@slampoetry.hu';
  const monthLabel = mc.monthLabel || 'Havi klub';
  const typeLabel = data.entryType === 'openmic' ? 'Open mic' : 'Verseny';

  const html = `<h2>Havi klub jelentkezés — ${esc(monthLabel)}</h2>
    <p><strong>Név / művésznév:</strong> ${esc(data.name)}</p>
    <p><strong>Email:</strong> ${esc(data.email)}</p>
    <p><strong>Jelentkezés típusa:</strong> ${typeLabel}</p>
    <p><strong>Melyik klub:</strong> ${esc(monthLabel)}</p>`;

  try {
    await sendMail({
      to,
      subject: sanitizeHeader(`Havi klub jelentkezés (${typeLabel}) — ${monthLabel}`),
      html,
      replyTo: sanitizeHeader(data.email),
    });
    return json({ ok: true }, 200);
  } catch (e) {
    return json({ ok: false, error: 'A jelentkezés küldése sikertelen. Próbáld újra később.' }, 500);
  }
};
