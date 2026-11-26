import type { APIRoute } from 'astro';
import { sanityClient } from 'sanity:client';
import { validateSlammerEdit } from '../../lib/validation';
import { getEmailSettings } from '../../sanity/lib/api';
import { sendMail } from '../../lib/mailer';
import { escapeHtml as esc } from '../../lib/escape';
import { submissionRecipients, notifyFallbackEmail } from '../../lib/recipients';
import { writeClient } from '../../sanity/lib/writeClient';
import { isConsented, collectValidUrls } from '../../lib/validation';

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

  const photo = form.get('photo');
  const hasPhoto = photo instanceof File && photo.size > 0;

  const vids = collectValidUrls(form.getAll('videoLink'));
  if (!vids.ok) return json({ ok: false, error: vids.error }, 400);

  const fields = {
    slammerSlug: String(form.get('slammerSlug') ?? ''),
    slammerName: String(form.get('slammerName') ?? ''),
    bioChange: String(form.get('bioChange') ?? ''),
    linksChange: String(form.get('linksChange') ?? ''),
    removeRequest: form.get('removeRequest'),
    activeRequest: form.get('activeSlammer'),
    email: String(form.get('email') ?? ''),
    website: String(form.get('website') ?? ''),
    hasPhoto,
    hasVideos: vids.urls.length > 0,
  };

  const result = validateSlammerEdit(fields);
  if (!result.ok) {
    if (result.error === 'spam') return json({ ok: true }, 200);
    return json({ ok: false, error: result.error }, 400);
  }


  if (hasPhoto) {
    if (!(photo as File).type.startsWith('image/')) return json({ ok: false, error: 'A feltöltött fájl nem kép.' }, 400);
    if ((photo as File).size > MAX_PHOTO_BYTES) return json({ ok: false, error: 'A kép túl nagy (max 8 MB).' }, 400);
  }

  if (!writeClient) {
    return json({ ok: false, error: 'A beküldés most nem elérhető. Próbáld újra később.' }, 503);
  }

  try {
    const profiles = await writeClient.fetch<any[]>('*[_type == "slammer" && !(_id in path("drafts.**")) && slug.current == $slug][0...2]{_id,name,slug}', { slug: fields.slammerSlug.trim() }, { perspective: 'raw' });
    if (profiles.length !== 1) return json({ ok: false, error: 'A slammerprofil nem azonosítható. Frissítsd az oldalt.' }, 400);
    const profile = profiles[0];
    let photoRef: any = undefined;
    if (hasPhoto) {
      const buffer = Buffer.from(await (photo as File).arrayBuffer());
      const asset = await writeClient.assets.upload('image', buffer, {
        filename: (photo as File).name || 'slammer-edit.jpg',
        contentType: (photo as File).type,
      });
      photoRef = { _type: 'image', asset: { _type: 'reference', _ref: asset._id } };
    }

    const remove = isConsented(fields.removeRequest);
    const activeRequest = isConsented(fields.activeRequest);
    await writeClient.create({
      _type: 'slammerEditRequest',
      slammer: { _type: 'reference', _ref: profile._id, _weak: true },
      slammerName: profile.name,
      slammerSlug: fields.slammerSlug.trim().slice(0, 200),
      removeRequest: remove,
      activeRequest,
      bioChange: fields.bioChange ? fields.bioChange.trim().slice(0, 3000) : undefined,
      linksChange: fields.linksChange ? fields.linksChange.trim().slice(0, 1000) : undefined,
      videoLinks: vids.urls.length ? vids.urls : undefined,
      newPhoto: photoRef,
      submitterEmail: fields.email ? fields.email.trim().slice(0, 200) : undefined,
      submittedAt: new Date().toISOString(),
      handled: false,
    });

    // Best-effort értesítő a kezelőnek.
    try {
      const emails = await getEmailSettings(sanityClient);
      const to = submissionRecipients(emails, notifyFallbackEmail(import.meta.env, process.env));
      if (to.length) {
        await sendMail({
          to,
          subject: `Slammer-módosítási kérés — ${fields.slammerName}`,
          html: `<h2>Módosítási kérés: ${esc(fields.slammerName)}</h2>
            ${remove ? '<p><strong>❗ A slammer kéri, hogy ne szerepeljen az oldalon.</strong></p>' : ''}
            ${activeRequest ? '<p>✅ Aktív slammernek jelölte magát.</p>' : ''}
            ${fields.bioChange ? `<p><strong>Bio:</strong><br>${esc(fields.bioChange).replace(/\n/g, '<br>')}</p>` : ''}
            ${fields.linksChange ? `<p><strong>Linkek:</strong><br>${esc(fields.linksChange).replace(/\n/g, '<br>')}</p>` : ''}
            ${vids.urls.length ? `<p><strong>Videó-linkek:</strong><br>${vids.urls.map(esc).join('<br>')}</p>` : ''}
            ${hasPhoto ? '<p>Új fotót is csatolt.</p>' : ''}
            <p>Nézd át a Studióban: <em>✏️ Slammer-módosítási kérések</em>.</p>`,
        });
      }
    } catch { /* az értesítő nem kötelező */ }

    return json({ ok: true }, 200);
  } catch (e) {
    return json({ ok: false, error: 'A beküldés sikertelen. Próbáld újra később.' }, 500);
  }
};
