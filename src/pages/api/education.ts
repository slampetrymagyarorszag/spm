import type { APIRoute } from 'astro';
import { educationEnabled, parseEducationInput } from '../../lib/education';
import { educationEmail } from '../../lib/education-email';
import { sendMail } from '../../lib/mailer';
import { createHash } from 'node:crypto';
import { educationGuideAttachment, educationRecipients } from '../../lib/education-guide';
export const prerender = false;
const json = (data: object, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export const POST: APIRoute = async ({ request, url }) => {
  const origin = request.headers.get('origin');
  if (origin && origin !== url.origin) return json({ ok: false }, 403);
  if (!request.headers.get('content-type')?.includes('application/json')) return json({ ok: false }, 415);
  const raw = await request.text();
  if (raw.length > 6000) return json({ ok: false }, 413);
  let data: unknown;
  try { data = JSON.parse(raw); } catch { return json({ ok: false }, 400); }
  if (data && typeof data === 'object' && 'website' in data && data.website) return json({ ok: true });
  const input = parseEducationInput(data);
  if (!input) return json({ ok: false }, 400);
  if (!educationEnabled()) return json({ ok: false, error: 'unavailable' }, 503);
  const replyTo = import.meta.env.EDUCATION_REPLY_TO ?? process.env.EDUCATION_REPLY_TO;
  const onepager = import.meta.env.EDUCATION_ONEPAGER_URL ?? process.env.EDUCATION_ONEPAGER_URL;
  if (!replyTo || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(replyTo) || (onepager && !/^https:\/\//.test(onepager))) return json({ ok: false }, 503);
  try {
    const attachment = await educationGuideAttachment();
    const html = educationEmail(input, onepager);
    // Resend deduplicates the same enquiry and PDF for 24 hours, including retries after a timeout.
    const digest = createHash('sha256').update(JSON.stringify(input)).update(html).update(attachment.content).digest('hex');
    await sendMail({
      to: input.email,
      bcc: educationRecipients.filter(email => email.toLowerCase() !== input.email.toLowerCase()),
      replyTo,
      from: `Slam Poetry Magyarország <${replyTo}>`,
      subject: input.lang === 'en' ? 'Slam poetry – literature sessions and workshops' : 'Slam az intézményetekben – rendhagyó óra és workshop',
      html,
      attachments: [attachment],
      idempotencyKey: `education/${digest}`,
    });
    return json({ ok: true });
  } catch { return json({ ok: false }, 500); }
};
