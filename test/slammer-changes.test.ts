import { describe, expect, it, vi } from 'vitest';
import { buildSlammerChanges, applySlammerChanges, findSlammerForRequest } from '../src/sanity/lib/slammerChanges';
import { validateSlammerEdit } from '../src/lib/validation';
const profile = { _id: 'slammer-1', _rev: 'p1', _type: 'slammer', name: 'Teszt Slammer', slug: { current: 'teszt' }, photo: { _type: 'image', asset: { _ref: 'old-image' }, crop: { left: .4 } }, bio: [{ _type: 'block', children: [{ text: 'Régi bio' }] }], active: true, featured: true, videos: ['https://youtu.be/abc12345678'], social: { facebook: 'https://facebook.com/old', instagram: 'https://instagram.com/keep' } };
const request = { _id: 'request-1', _rev: 'r1', _type: 'slammerEditRequest', slammerSlug: 'teszt', bioChange: 'Új bio\n\nMásodik bekezdés', newPhoto: { _type: 'image', asset: { _ref: 'new-image' } }, activeRequest: false, videoLinks: ['https://youtu.be/abc12345678', 'https://youtu.be/xyz12345678'] };

describe('reviewed profile changes', () => {
  it('only replaces the selected photo and discards the old photo crop', () => {
    const result = buildSlammerChanges(profile, request, { photo: true });
    expect(result.set.photo.asset._ref).toBe('new-image');
    expect(result.set.photo.crop).toBeUndefined();
    expect(Object.keys(result.set)).toEqual(['photo']);
    expect(result.set.featured).toBeUndefined();
  });
  it('converts the full requested bio into paragraphs without touching other fields', () => {
    const result = buildSlammerChanges(profile, request, { bio: true });
    expect(result.set.bio).toHaveLength(2);
    expect(result.set.bio[1].children[0].text).toBe('Második bekezdés');
    expect(result.set.bioEn).toBeUndefined();
    expect(result.set.active).toBeUndefined();
  });
  it('adds videos without losing old links or creating duplicates', () => {
    expect(buildSlammerChanges(profile, request, { videos: true }).set.videos).toEqual(['https://youtu.be/abc12345678', 'https://youtu.be/xyz12345678']);
  });
  it('never treats an unchecked active request as a request to deactivate', () => {
    expect(() => buildSlammerChanges(profile, request, { active: true })).toThrow(/aktív/i);
  });
  it('rejects an empty selection, an already applied request, and a removal request', () => {
    expect(() => buildSlammerChanges(profile, request, {})).toThrow(/jelölj/i);
    expect(() => buildSlammerChanges(profile, { ...request, appliedAt: '2026-11-26' }, { photo: true })).toThrow(/már/i);
    expect(() => buildSlammerChanges(profile, { ...request, removeRequest: true }, { photo: true })).toThrow(/eltávolítás/i);
  });
  it('changes only the explicitly reviewed social fields', () => {
    const result = buildSlammerChanges(profile, request, { social: true, facebook: 'https://facebook.com/new', instagram: 'https://instagram.com/keep' });
    expect(result.set['social.facebook']).toBe('https://facebook.com/new');
    expect(result.unset).toEqual([]);
  });
});
function mockClient(conflict = false) {
  const patches: any[] = [];
  const commit = vi.fn().mockImplementation(() => conflict ? Promise.reject(new Error('revision conflict')) : Promise.resolve({ transactionId: 'test' }));
  const tx: any = { patch: (id: string, builder: any) => { const data: any = { id }; const p: any = { ifRevisionId: (rev: string) => { data.ifRevisionID = rev; return p; }, set: (set: any) => { data.set = set; return p; }, unset: (unset: any) => { data.unset = unset; return p; } }; builder(p); patches.push(data); return tx; }, commit };
  return { patches, commit, fetch: vi.fn().mockResolvedValue([profile]), getDocuments: vi.fn().mockResolvedValue([request, null]), transaction: () => tx };
}
it('updates the original profile and records completion atomically with revision guards', async () => {
  const client = mockClient();
  await applySlammerChanges(client as any, request, profile, null, { photo: true });
  expect(client.patches.map(x => x.id)).toEqual(['slammer-1', 'request-1']);
  expect(client.patches[0].ifRevisionID).toBe('p1');
  expect(client.patches[1]).toMatchObject({ ifRevisionID: 'r1', set: { handled: true, appliedSlammerId: 'slammer-1', appliedFields: ['photo'] } });
  expect(client.commit).toHaveBeenCalledOnce();
});
it('also updates only the selected fields on an existing profile draft', async () => {
  const client = mockClient();
  await applySlammerChanges(client as any, request, profile, { ...profile, _id: 'drafts.slammer-1', _rev: 'draft-p1' }, { photo: true });
  expect(client.patches[1]).toMatchObject({ id: 'drafts.slammer-1', ifRevisionID: 'draft-p1' });
  expect(Object.keys(client.patches[1].set)).toEqual(['photo']);
});
it('propagates concurrent-edit conflicts without claiming success', async () => {
  const client = mockClient(true);
  await expect(applySlammerChanges(client as any, request, profile, null, { photo: true })).rejects.toThrow('revision conflict');
});
it('blocks ambiguous legacy matches rather than choosing the first profile', async () => {
  const client = mockClient(); client.fetch.mockResolvedValue([profile, { ...profile, _id: 'slammer-2' }]);
  await expect(findSlammerForRequest(client as any, request)).rejects.toThrow(/több/i);
});
it('accepts active-only and video-only edit requests', () => {
  expect(validateSlammerEdit({ slammerSlug: 'teszt', activeRequest: '1' } as any).ok).toBe(true);
  expect(validateSlammerEdit({ slammerSlug: 'teszt', hasVideos: true } as any).ok).toBe(true);
});
it('allows the editor to remove instructions from a requested bio before approving',()=>{
 const result=buildSlammerChanges(profile,{...request,bioChange:'Új bemutatkozás\n\n(Ezt ne írd bele)'},{bio:true,bioText:'Új bemutatkozás'});
 expect(result.set.bio).toHaveLength(1);expect(result.set.bio[0].children[0].text).toBe('Új bemutatkozás');
});
