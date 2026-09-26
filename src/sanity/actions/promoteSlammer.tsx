import { useState } from 'react';
import { useClient } from 'sanity';
import { useToast } from '@sanity/ui';
import { slugify } from '../lib/slugify';

const key = () => Math.random().toString(36).slice(2, 10);

// A két belépési pont (dokumentumgomb és Sanity-művelet) ugyanazt az atomi műveletet használja.
export async function promoteSlammerDocument(client: ReturnType<typeof useClient>, doc: any) {
  if (!doc?._id || doc.promoted) throw new Error('Ez a jelentkezés már feldolgozott, vagy még nincs elmentve.');
  const sourceId = String(doc._id).replace(/^drafts\./, '');
  const targetId = `slammer-from-${sourceId.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  const name = String(doc.stageName || doc.realName || 'Névtelen slammer').trim();
  const base = slugify(name) || 'slammer';
  const slug = (await client.fetch<number>('count(*[_type=="slammer" && slug.current==$s && _id!=$id])', { s: base, id: targetId })) > 0
    ? `${base}-${key().slice(0, 4)}` : base;
  const slammer: any = {
    _id: targetId,
    _type: 'slammer',
    name,
    slug: { _type: 'slug', current: slug },
    featured: false,
    active: !!doc.isActive,
  };
  if (doc.photo?.asset) slammer.photo = {
    _type: 'image', asset: doc.photo.asset,
    ...(doc.photo.hotspot ? { hotspot: doc.photo.hotspot } : {}),
    ...(doc.photo.crop ? { crop: doc.photo.crop } : {}), alt: name,
  };
  if (doc.description) slammer.bio = [{
    _type: 'block', _key: key(), style: 'normal', markDefs: [],
    children: [{ _type: 'span', _key: key(), text: String(doc.description), marks: [] }],
  }];
  const videos = Array.isArray(doc.youtubeUrls) && doc.youtubeUrls.length ? doc.youtubeUrls : (doc.youtubeUrl ? [doc.youtubeUrl] : []);
  if (videos.length) slammer.videos = videos;

  // Ha a forrásfrissítés hibázik, a profil sem jön létre; ismételt kattintás nem duplikál.
  await client.transaction()
    .createIfNotExists(slammer)
    .patch(sourceId, (p) => p.set({ promoted: true, approved: true, promotedSlammerId: targetId }))
    .commit();
  return { id: targetId, name };
}

export function promoteSlammerAction(props: any) {
  const { type, published, draft, onComplete } = props;
  const client = useClient({ apiVersion: '2024-01-01' });
  const toast = useToast();
  const [running, setRunning] = useState(false);
  if (type !== 'slammerApplication') return null;
  const doc = published || draft;
  return {
    label: doc?.promoted ? 'Már slammerré alakítva' : 'Slammerré alakítás',
    tone: 'positive' as const,
    disabled: running || !doc || !!doc.promoted,
    onHandle: async () => {
      setRunning(true);
      try {
        const result = await promoteSlammerDocument(client, doc);
        toast.push({ status: 'success', title: 'Slammerré alakítva', description: `${result.name} bekerült a Slammerek közé.` });
        onComplete();
      } catch (e: any) {
        toast.push({ status: 'error', title: 'Hiba a slammerré alakításkor', description: e?.message || 'Ismeretlen hiba' });
      } finally { setRunning(false); }
    },
  };
}
