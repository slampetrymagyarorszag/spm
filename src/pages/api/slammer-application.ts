import type { APIRoute } from 'astro';
import { sanityClient } from 'sanity:client';
import { validateSlammerApplication, isConsented } from '../../lib/validation';
import { getEmailSettings } from '../../sanity/lib/api';
import { sendMail } from '../../lib/mailer';
import { escapeHtml as esc } from '../../lib/escape';
import { writeClient } from '../../sanity/lib/writeClient';

export const prerender = false;

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const MAX_PHOTO_BYTES = 8 * 1024 * 1024; // 8 MB

export const POST: APIRoute = async ({ request }) => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: 'Hibás beküldés.' }, 400);
  }

  const fields = {
    realName: String(form.get('realName') ?? ''),
    stageName: String(form.get('stageName') ?? ''),
    description: String(form.get('description') ?? ''),
    youtubeUrl: String(form.get('youtubeUrl') ?? ''),
    email: String(form.get('email') ?? ''),
    consent: form.get('consent'),
    website: String(form.get('website') ?? ''),
  };

  const result = validateSlammerApplication(fields);
  if (!result.ok) {
    if (result.error === 'spam') return json({ ok: true }, 200);
    return json({ ok: false, error: result.error }, 400);
  }

  const photo = form.get('photo');
  if (!(photo instanceof File) || photo.size === 0) {
    return json({ ok: false, error: 'Tölts fel egy képet magadról.' }, 400);
  }
  if (!photo.type.startsWith('image/')) {
    return json({ ok: false, error: 'A feltöltött fájl nem kép.' }, 400);
  }
  if (photo.size > MAX_PHOTO_BYTES) {
    return json({ ok: false, error: 'A kép túl nagy (max 8 MB).' }, 400);
  }

  if (!writeClient) {
    return json({ ok: false, error: 'A beküldés most nem elérhető. Próbáld újra később.' }, 503);
  }

  try {
    const buffer = Buffer.from(await photo.arrayBuffer());
    const asset = await writeClient.assets.upload('image', buffer, {
      filename: photo.name || 'slammer.jpg',
      contentType: photo.type,
    });

    const stageName = fields.stageName.trim().slice(0, 200);
    await writeClient.create({
      _type: 'slammerApplication',
      realName: fields.realName.trim().slice(0, 200),
      stageName: stageName || undefined,
      description: fields.description.trim().slice(0, 3000),
      youtubeUrl: fields.youtubeUrl.trim().slice(0, 500),
      submitterEmail: fields.email ? fields.email.trim().slice(0, 200) : undefined,
      isActive: isConsented(form.get('isActive')),
      photo: { _type: 'image', asset: { _type: 'reference', _ref: asset._id } },
      submittedAt: new Date().toISOString(),
      approved: false,
    });

    // Best-effort értesítő a kezelőnek (ha be van állítva). Hiba esetén nem buktatjuk a beküldést.
    try {
      const emails = await getEmailSettings(sanityClient);
      if (emails.notifyOnSubmissions && emails.notifyEmail) {
        await sendMail({
          to: emails.notifyEmail,
          subject: 'Új slammer-jelentkezés érkezett — elbírálásra',
          html: `<h2>Új slammer-jelentkezés</h2>
            <p><strong>Név:</strong> ${esc(fields.realName)}</p>
            ${stageName ? `<p><strong>Művésznév:</strong> ${esc(stageName)}</p>` : ''}
            <p>Nézd át és hagyd jóvá a Studióban: <em>📥 Beküldött slammerek → Elbírálásra vár</em>.</p>`,
        });
      }
    } catch { /* az értesítő nem kötelező */ }

    return json({ ok: true }, 200);
  } catch (e) {
    return json({ ok: false, error: 'A beküldés sikertelen. Próbáld újra később.' }, 500);
  }
};
