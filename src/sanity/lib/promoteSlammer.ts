import type { SanityClient } from '@sanity/client';
import { slugify } from './slugify';
const key = () => Math.random().toString(36).slice(2, 10);

// A két belépési pont (dokumentumgomb és Sanity-művelet) ugyanazt az atomi műveletet használja.
export async function promoteSlammerDocument(client: SanityClient, doc: any) {
  if (!doc?._id || doc.promoted) throw new Error('Ez a jelentkezés már feldolgozott, vagy még nincs elmentve.');
  const sourceId = String(doc._id).replace(/^drafts\./, '');
  const targetId = `slammer-from-${sourceId.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  const name = String(doc.stageName || doc.realName || '').trim();
  if (name.length < 2) throw new Error('Adj meg egy nevet a profil létrehozásához.');
  const existing = await client.fetch<any[]>('*[_type == "slammer" && !(_id in path("drafts.**")) && (_id == $id || lower(name) == lower($name))]{_id}', {id: targetId, name}, {perspective:'raw'});
  if (existing.length) throw new Error('Már van ilyen slammerprofil. A jelentkezés tetején hasonlítsd össze az adatokat, és ott vezesd át a változásokat.');
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
  const docs = await client.getDocuments([sourceId, `drafts.${sourceId}`]);
  const current = docs.find(d => d?._id === doc._id);
  if (!current || current._rev !== doc._rev) throw new Error('A jelentkezés megváltozott. Frissítsd az adatokat.');
  const tx = client.transaction().create(slammer);
  for (const source of docs.filter(Boolean)) tx.patch(source!._id, p => p.ifRevisionId(source!._rev).set({promoted:true,approved:true,promotedSlammerId:targetId}));
  await tx.commit();
  return { id: targetId, name };
}
