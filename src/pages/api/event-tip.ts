import type { APIRoute } from 'astro';
import { validateEventTip } from '../../lib/validation';
import { sendMail } from '../../lib/mailer';
import { escapeHtml as esc, sanitizeHeader } from '../../lib/escape';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json().catch(() => ({}));
  const result = validateEventTip(data);
  if (!result.ok) {
    const status = result.error === 'spam' ? 200 : 400; // spam: csendben elnyel
    return new Response(
      JSON.stringify({ ok: result.error === 'spam', error: result.error === 'spam' ? undefined : result.error }),
      { status, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Az esemény-tippek a szervezőkhöz mennek (a kliens nem adhat meg címzettet).
  const to = import.meta.env.CONTACT_EMAIL ?? process.env.CONTACT_EMAIL ?? 'contest@slampoetry.hu';
  const html = `<h2>Esemény-tipp a weboldalról</h2>
    <p><strong>Rendezvény neve:</strong> ${esc(data.eventName)}</p>
    <p><strong>Leírás:</strong><br>${esc(data.description).replace(/\n/g, '<br>')}</p>
    <p><strong>Facebook esemény:</strong> <a href="${esc(data.facebookUrl)}">${esc(data.facebookUrl)}</a></p>
    ${data.email ? `<p><strong>Beküldő email:</strong> ${esc(data.email)}</p>` : ''}`;

  try {
    await sendMail({
      to,
      subject: sanitizeHeader('Esemény-tipp — slampoetry.hu'),
      html,
      replyTo: data.email ? sanitizeHeader(data.email) : undefined,
    });
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: 'A küldés sikertelen. Próbáld újra később.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
