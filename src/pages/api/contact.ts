import type { APIRoute } from 'astro';
import { validateSubmission } from '../../lib/validation';
import { sendMail } from '../../lib/mailer';

export const prerender = false;

const esc = (s: string) => s.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]!));

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json().catch(() => ({}));
  const result = validateSubmission(data);
  if (!result.ok) {
    const status = result.error === 'spam' ? 200 : 400; // spam: csendben elnyel
    return new Response(JSON.stringify({ ok: result.error === 'spam' }), { status, headers: { 'Content-Type': 'application/json' } });
  }
  const to = import.meta.env.CONTACT_EMAIL ?? process.env.CONTACT_EMAIL ?? 'contest@slampoetry.hu';
  const html = `<h2>Új üzenet a weboldalról</h2>
    <p><strong>Név:</strong> ${esc(data.name)}</p>
    <p><strong>Email:</strong> ${esc(data.email)}</p>
    ${data.phone ? `<p><strong>Telefon:</strong> ${esc(data.phone)}</p>` : ''}
    <p><strong>Üzenet:</strong><br>${esc(data.message).replace(/\n/g, '<br>')}</p>`;
  try {
    await sendMail({ to, subject: 'Kapcsolati üzenet — slampoetry.hu', html, replyTo: data.email });
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'Az üzenet küldése sikertelen. Próbáld újra később.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
