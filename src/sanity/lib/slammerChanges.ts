import type { SanityClient } from '@sanity/client';

export type ChangeSelection = { photo?: boolean; bio?: boolean; bioText?: string; videos?: boolean; active?: boolean; social?: boolean; facebook?: string; instagram?: string };
export function textToBlocks(text: string) {
  return text.trim().split(/\n\s*\n/).filter(Boolean).map((text, i) => ({
    _type: 'block', _key: `paragraph${i}`, style: 'normal', markDefs: [],
    children: [{ _type: 'span', _key: `text${i}`, text, marks: [] }],
  }));
}
export async function findSlammerForRequest(client: SanityClient, request: any) {
  const id = request.slammer?._ref || request.appliedSlammerId;
  const matches = await client.fetch<any[]>(`*[_type == "slammer" && !(_id in path("drafts.**")) && select(defined($id) => _id == $id, slug.current == $slug)]`, { id: id || null, slug: request.slammerSlug || '' }, { perspective: 'raw' });
  if (matches.length > 1) throw new Error('Több profil tartozik ehhez a kéréshez. Előbb tisztázd, melyik a helyes.');
  if (!matches.length) throw new Error('A kapcsolódó, közzétett slammerprofil nem található.');
  return matches[0];
}
function socialUrl(value: string, platform: string) {
  const clean = value.trim();
  if (!clean) return '';
  let parsed: URL;
  try { parsed = new URL(clean); } catch { throw new Error(`A ${platform}-link nem érvényes.`); }
  if (parsed.protocol !== 'https:' || !(parsed.hostname === `${platform}.com` || parsed.hostname.endsWith(`.${platform}.com`))) throw new Error(`https://${platform}.com/ kezdetű linket adj meg.`);
  return clean;
}
export function buildSlammerChanges(profile: any, request: any, selected: ChangeSelection) {
  if (request.appliedAt) throw new Error('Ez a kérés már át lett vezetve.');
  if (request.removeRequest) throw new Error('Az eltávolítási kérést külön, a profil megnyitásával kell elintézni.');
  const set: Record<string, any> = {};
  const unset: string[] = [];
  if (selected.photo) {
    if (!request.newPhoto?.asset?._ref) throw new Error('Nincs beküldött új kép.');
    set.photo = { ...request.newPhoto, _type: 'image', alt: request.newPhoto.alt || profile.name };
  }
  if (selected.bio) {
    if (!request.bioChange?.trim()) throw new Error('Nincs beküldött bemutatkozás.');
    const approvedText = selected.bioText ?? request.bioChange;
    if (!approvedText.trim()) throw new Error('A jóváhagyott bemutatkozás nem lehet üres.');
    set.bio = textToBlocks(approvedText);
  }
  if (selected.videos) {
    if (!request.videoLinks?.length) throw new Error('Nincs beküldött videó.');
    set.videos = [...new Set([...(profile.videos || []), ...request.videoLinks])];
  }
  if (selected.active) {
    if (!request.activeRequest) throw new Error('A beküldő nem kért aktív státuszt.');
    set.active = true;
  }
  if (selected.social) {
    for (const field of ['facebook', 'instagram'] as const) {
      const value = socialUrl(selected[field] ?? profile.social?.[field] ?? '', field);
      if (value) set[`social.${field}`] = value;
      else if (profile.social?.[field]) unset.push(`social.${field}`);
    }
  }
  if (!Object.keys(set).length && !unset.length) throw new Error('Jelölj ki legalább egy átvezetendő változtatást.');
  return { set, unset };
}
export async function applySlammerChanges(client: SanityClient, request: any, profile: any, draft: any, selected: ChangeSelection, requestDraft?: any) {
  const changes = buildSlammerChanges(profile, request, selected);
  // Each revision is the version actually shown in the review. A conflict aborts the whole transaction.
  const tx = client.transaction();
  for (const target of [profile, draft].filter(Boolean)) {
    if (!target._rev) throw new Error('Frissítsd a megnyitott profilt, hiányzik a verzióazonosító.');
    const targetChanges = target === profile ? changes : buildSlammerChanges(target, request, selected);
    tx.patch(target._id, p => {
      let patch = p.ifRevisionId(target._rev);
      if (selected.social) patch = patch.setIfMissing({social:{_type:'object'}});
      patch = patch.set(targetChanges.set);
      if (targetChanges.unset.length) patch = patch.unset(targetChanges.unset);
      return patch;
    });
  }
  if (!request._rev) throw new Error('Frissítsd a kérést a feldolgozás előtt.');
  const completion = request._type === 'slammerApplication' ? { promoted: true, approved: true, promotedSlammerId: profile._id, appliedAt: new Date().toISOString(), appliedFields: [...new Set(Object.keys(changes.set).map(key => key.split('.')[0]))] } : {
    handled: true, appliedAt: new Date().toISOString(), appliedSlammerId: profile._id,
    appliedFields: [...new Set([...Object.keys(changes.set), ...changes.unset].map(key => key.split('.')[0]))],
  };
  for (const source of [request, requestDraft].filter(Boolean)) tx.patch(source._id, p => p.ifRevisionId(source._rev).set(completion));
  return tx.commit();
}
