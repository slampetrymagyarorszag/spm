import { useCallback, useEffect, useState } from 'react';
import { useClient, useFormValue, type StringInputProps } from 'sanity';
import { IntentLink } from 'sanity/router';
import { Button, Card, Checkbox, Flex, Heading, Label, Stack, Text, TextArea, TextInput, useToast } from '@sanity/ui';
import imageUrlBuilder from '@sanity/image-url';
import { promoteSlammerDocument } from '../lib/promoteSlammer';
import { applySlammerChanges, findSlammerForRequest, type ChangeSelection } from '../lib/slammerChanges';

const plain = (blocks: any[]) => (blocks || []).map(b => (b.children || []).map((s: any) => s.text || '').join('')).join('\n\n');
export function SlammerChangesInput(_props: StringInputProps) {
  const form = useFormValue([]) as any;
  const client = useClient({ apiVersion: '2024-01-01' });
  const toast = useToast();
  const id = String(form?._id || '').replace(/^drafts\./, '');
  const [state, setState] = useState<any>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<ChangeSelection>({});
  const load = useCallback(async () => {
    setError(''); setState(null); setSelected({});
    try {
      const [publishedSource, draftSource] = await client.getDocuments([id, `drafts.${id}`]);
      const source: any = publishedSource?._type === 'slammerEditRequest' ? publishedSource : draftSource || publishedSource;
      if (!source) throw new Error('Előbb mentsd el a kérést.');
      let request = source;
      let profile: any;
      if (source._type === 'slammerApplication') {
        const targetId = source.promotedSlammerId || publishedSource?.promotedSlammerId;
        const matches = await client.fetch<any[]>('*[_type == "slammer" && !(_id in path("drafts.**")) && select(defined($id) => _id == $id, lower(name) == lower($name))]', {id: targetId || null, name: String(source.stageName || source.realName || '').trim()}, {perspective:'raw'});
        if (matches.length > 1) throw new Error('Több azonos nevű profil található. Ellenőrizd a Slammerek listában a megfelelő személyt.');
        if (!matches.length) {
          if (targetId) throw new Error('A korábban létrehozott profil nem található. Ellenőrizd a Slammerek listában.');
          setState({ request: source, newProfile: true }); return;
        }
        profile = matches[0];
        request = {...source, appliedAt: source.appliedAt || publishedSource?.appliedAt, newPhoto:source.photo, bioChange:source.description, activeRequest:source.isActive, videoLinks:source.youtubeUrls || (source.youtubeUrl ? [source.youtubeUrl] : [])};
      } else {
        try {profile = await findSlammerForRequest(client, request);}
        catch (e) {
          if (!request.removeRequest) throw e;
          setState({request,unavailableProfile:true,requestDraft:source === publishedSource ? draftSource : publishedSource});return;
        }
      }
      const draft = await client.getDocument(`drafts.${profile._id}`);
      const requestDraft = source === publishedSource ? draftSource : publishedSource;
      setState({ request, profile, draft, requestDraft });
      setSelected({ facebook: profile.social?.facebook || '', instagram: profile.social?.instagram || '', bioText: request.bioChange || '' });
    } catch (e: any) { setError(e.message || 'Nem sikerült betölteni a profilt.'); }
  }, [client, id]);
  useEffect(() => { if (id) load(); }, [load, id]);
  const change = (field: keyof ChangeSelection, value: any) => setSelected(s => ({ ...s, [field]: value }));
  const create = async () => {
    setBusy(true); setError('');
    try { await promoteSlammerDocument(client, state.request); toast.push({status:'success',title:'Az új profil létrejött.'}); await load(); }
    catch(e:any) { setError(e.message); } finally {setBusy(false);}
  };
  const run = async (closeOnly = false) => {
    if (!state) return;
    setBusy(true); setError('');
    try {
      if (closeOnly) {
        const tx = client.transaction();
        for (const doc of [state.request, state.requestDraft].filter(Boolean)) tx.patch(doc._id, p => p.ifRevisionId(doc._rev).set({ handled: true, closedAt: new Date().toISOString() }));
        await tx.commit();
      } else await applySlammerChanges(client, state.request, state.profile, state.draft, selected, state.requestDraft);
      toast.push({ status: 'success', title: closeOnly ? 'Kérés lezárva, a profil nem változott.' : 'A kijelölt változások megjelentek a profilon.' });
      await load();
    } catch (e: any) { setError(`${e.message || 'Nem sikerült a mentés.'} Ütköző szerkesztésnél frissítsd az összehasonlítást, és ellenőrizd újra a kijelölést.`); }
    finally { setBusy(false); }
  };
  const picture = (photo: any, alt: string) => photo?.asset?._ref ? <img src={imageUrlBuilder(client).image(photo).width(280).height(280).fit('crop').url()} alt={alt} style={{ width: '100%', maxWidth: 220, height: 220, objectFit: 'cover', borderRadius: 4 }} /> : <Text size={1} muted>Nincs kép.</Text>;
  const compare = (title: string, field: keyof ChangeSelection, current: any, proposed: any) => <Card padding={3} border radius={2}><Stack space={3}>
    <Flex gap={3} align="center"><Checkbox id={`apply-${field}`} checked={!!selected[field]} disabled={busy || !!state.request.appliedAt || state.request.removeRequest} onChange={e => change(field, e.currentTarget.checked)} /><Label htmlFor={`apply-${field}`}>{title}</Label></Flex>
    <Flex gap={4} wrap="wrap"><Stack space={2} style={{ flex: '1 1 220px', minWidth: 0 }}><Text size={0} muted>Jelenleg az oldalon</Text>{current}</Stack><Stack space={2} style={{ flex: '1 1 220px', minWidth: 0 }}><Text size={0} muted>Beküldött változtatás</Text>{proposed}</Stack></Flex>
  </Stack></Card>;
  const content = (value: string) => <div style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: 14, lineHeight: 1.6 }}>{value || 'Nincs megadva.'}</div>;
  return <Card border padding={3} radius={2} style={{fontFamily:'system-ui, -apple-system, sans-serif'}}><Stack space={4}>
    <Heading size={1}>Profilmódosítás ellenőrzése</Heading>
    <Text size={1}>Hasonlítsd össze az adatokat, és jelöld ki, mit vezessünk át. A bemutatkozás szövegéből mentés előtt törölheted a beküldő szerkesztői megjegyzéseit. A gomb az eredeti profilt frissíti és lezárja a kérést.</Text>
    <Button text="Összehasonlítás frissítése" mode="ghost" onClick={load} disabled={busy} />
    {error && <Card tone="critical" padding={3}><Text size={1}>{error}</Text></Card>}
    {!state && !error && <Text size={1}>Profil és kérés betöltése…</Text>}
    {state?.newProfile && <Stack space={3}><Text size={1}>Nem találtunk ilyen nevű meglévő profilt. Ellenőrizd a nevet, a fotót és a bemutatkozást lent. A gomb új, nyilvános profilt hoz létre.</Text><Button tone="positive" text="Új slammerprofil létrehozása" disabled={busy || !state.request.realName?.trim()} onClick={create} /></Stack>}
    {state?.unavailableProfile && <Stack space={3}><Text size={1}>Eltávolítási kérés: a profil már nem található a nyilvános profilok között. Ellenőrizd a Slammerek listában, majd zárd le a kérést.</Text>{!state.request.handled && <Button text="Lezárás (a profil nem változik)" mode="ghost" disabled={busy} onClick={()=>run(true)} />}</Stack>}
    {state && !state.newProfile && !state.unavailableProfile && <>
      <IntentLink intent="edit" params={{ id: state.profile._id, type: 'slammer' }}>Érintett profil: {state.profile.name}</IntentLink>
      {state.request.appliedAt && <Card tone="positive" padding={3}><Text size={1}>Átvezetve: {new Date(state.request.appliedAt).toLocaleString('hu-HU', { timeZone: 'Europe/Budapest' })}. Módosított mezők: {(state.request.appliedFields || []).join(', ')}.</Text></Card>}
      {state.request.handled && !state.request.appliedAt && <Card tone="caution" padding={3}><Text size={1}>Korábban lezárt kérés. Nincs rögzített automatikus átvezetés; ellenőrizd a jelenlegi profilt, mielőtt újra alkalmazod.</Text></Card>}
      {state.draft && <Card tone="caution" padding={3}><Text size={1}>A profilnak piszkozata is van. A kijelölt mezőket azon is frissítjük; a többi piszkozatban lévő változtatás nem kerül közzétételre.</Text></Card>}
      {state.request.removeRequest ? <Card tone="caution" padding={3}><Text size={1}>Eltávolítási kérés. Nyisd meg a fenti profilt, válaszd a közzététel visszavonását, majd itt zárd le a kérést. A rendszer nem töröl automatikusan profilt.</Text></Card> : <>
        {state.request.newPhoto?.asset && compare('Új profilkép átvétele', 'photo', picture(state.profile.photo, 'Jelenlegi profilkép'), picture(state.request.newPhoto, 'Beküldött profilkép'))}
        {state.request.bioChange && compare('Bemutatkozás cseréje', 'bio', content(plain(state.profile.bio)), <TextArea aria-label="Jóváhagyott bemutatkozás" rows={9} value={selected.bioText || ''} disabled={busy || !!state.request.appliedAt} onChange={e => change('bioText', e.currentTarget.value)} />)}
        {!!state.request.videoLinks?.length && compare('Videók hozzáadása (a meglévők megmaradnak)', 'videos', content((state.profile.videos || []).join('\n')), content(state.request.videoLinks.join('\n')))}
        {state.request.activeRequest && compare('Aktív slammer státusz bekapcsolása', 'active', content(state.profile.active ? 'Aktív' : 'Nincs aktívnak jelölve'), content('Aktív szeretnék lenni'))}
        {state.request.linksChange && <Card border padding={3}><Stack space={3}>
          <Flex gap={3}><Checkbox id="apply-social" checked={!!selected.social} disabled={busy || !!state.request.appliedAt} onChange={e => change('social', e.currentTarget.checked)} /><Label htmlFor="apply-social">Közösségi linkek módosítása</Label></Flex>
          <Text size={1}>Beküldött kérés (szabad szöveg):</Text>{content(state.request.linksChange)}
          <Text size={1} muted>Írd be a jóváhagyott linkeket. A mezők kezdetben a jelenlegi értéket mutatják; kiürítésük a kijelölt link törlését jelenti.</Text>
          <label>Facebook<TextInput value={selected.facebook || ''} onChange={e => change('facebook', e.currentTarget.value)} disabled={busy || !!state.request.appliedAt} /></label>
          <label>Instagram<TextInput value={selected.instagram || ''} onChange={e => change('instagram', e.currentTarget.value)} disabled={busy || !!state.request.appliedAt} /></label>
        </Stack></Card>}
        {!state.request.appliedAt && <Button tone="positive" text={busy ? 'Mentés…' : 'Kijelölt változtatások élesítése'} disabled={busy || !['photo', 'bio', 'videos', 'active', 'social'].some(k => selected[k as keyof ChangeSelection])} onClick={() => run()} />}
      </>}
      {state.request._type !== 'slammerApplication' && !state.request.handled && <Button mode="ghost" text="Lezárás módosítás nélkül" disabled={busy} onClick={() => run(true)} />}
    </>}
  </Stack></Card>;
}
