import type { APIRoute } from 'astro';
import { validateSlammerApplication } from '../../lib/validation';
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

    await writeClient.create({
      _type: 'slammerApplication',
      realName: fields.realName.trim().slice(0, 200),
      stageName: fields.stageName.trim().slice(0, 200),
      description: fields.description.trim().slice(0, 3000),
      youtubeUrl: fields.youtubeUrl.trim().slice(0, 500),
      submitterEmail: fields.email ? fields.email.trim().slice(0, 200) : undefined,
      photo: { _type: 'image', asset: { _type: 'reference', _ref: asset._id } },
      submittedAt: new Date().toISOString(),
      approved: false,
    });

    return json({ ok: true }, 200);
  } catch (e) {
    return json({ ok: false, error: 'A beküldés sikertelen. Próbáld újra később.' }, 500);
  }
};
