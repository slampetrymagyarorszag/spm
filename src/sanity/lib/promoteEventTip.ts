import type { SanityClient } from '@sanity/client';
import { slugify } from './slugify';
import { textToBlocks } from './slammerChanges';
export async function promoteEventTipDocument(client: SanityClient, doc: any) {
  if (!doc?._id || doc.promoted) throw new Error('A tipp már feldolgozott, vagy még nincs elmentve.');
  const sourceId = String(doc._id).replace(/^drafts\./, '');
  const targetId = `event-from-${sourceId.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  const sources = await client.getDocuments([sourceId, `drafts.${sourceId}`]);
  const current = sources.find(source => source?._id === doc._id);
  if (!current || current._rev !== doc._rev || sources.some(s => s?.promoted)) throw new Error('A tipp megváltozott vagy már feldolgozták. Frissítsd az adatokat.');
  const title = String(doc.eventName || '').trim();
  if (!title) throw new Error('Add meg a rendezvény nevét.');
  const base = slugify(title) || 'esemeny';
  const taken = await client.fetch<number>('count(*[_type=="event" && slug.current==$slug && !(_id in [$id,$draft])])', {slug:base,id:targetId,draft:`drafts.${targetId}`}, {perspective:'raw'});
  const event: any = {_id:`drafts.${targetId}`, _type:'event', title, slug:{_type:'slug', current:taken ? `${base}-${sourceId.slice(-6)}` : base}};
  if (doc.facebookUrl) event.facebookEventUrl = doc.facebookUrl;
  if (doc.ticketUrl) event.ticketUrl = doc.ticketUrl;
  if (doc.description) event.description = textToBlocks(doc.description);
  // Never overwrite an already edited target; create and status change succeed together.
  const tx = client.transaction().create(event);
  for (const source of sources.filter(Boolean)) tx.patch(source!._id, p => p.ifRevisionId(source!._rev).set({promoted:true,promotedEventId:targetId}));
  await tx.commit();
  return {id:targetId,title};
}
