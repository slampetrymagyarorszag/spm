import { useState } from 'react';
import { useClient, useFormValue, set } from 'sanity';
import { Box, Button, Card, Stack, Text, useToast } from '@sanity/ui';

export function FacebookEventCoverInput(props: any) {
  const facebookUrl = useFormValue(['facebookEventUrl']) as string | undefined;
  const client = useClient({ apiVersion: '2024-01-01' });
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const hasCover = !!props.value?.asset;

  const importCover = async () => {
    if (!facebookUrl || hasCover) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/facebook-event-cover?url=${encodeURIComponent(facebookUrl)}`);
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Nem sikerült lekérni a borítót.');
      const bytes = Uint8Array.from(atob(data.imageData), (char) => char.charCodeAt(0));
      const type = data.imageType || 'image/jpeg';
      const asset = await client.assets.upload('image', new Blob([bytes], { type }), {
        filename: `facebook-esemeny-${Date.now()}.${type.includes('png') ? 'png' : 'jpg'}`, contentType: type,
      });
      props.onChange(set({ _type: 'image', asset: { _type: 'reference', _ref: asset._id }, alt: data.eventName || '' }));
      toast.push({ status: 'success', title: 'Borító átvéve', description: 'Ellenőrizd a képet, majd mentsd/publikáld az eseményt.' });
    } catch (e: any) {
      toast.push({ status: 'error', title: 'Nem sikerült átvenni a borítót', description: e?.message || 'Töltsd fel kézzel a képet.' });
    } finally { setBusy(false); }
  };

  return <Stack space={3}>
    <Card padding={3} radius={2} border><Stack space={2}>
      <Text size={1}>A Facebook-linkből a borítókép nem kerül át magától. A gomb a saját eseményeinknél egy kattintással átveszi; egyébként tölts fel képet alább.</Text>
      <Box><Button text={busy ? 'Borító átvétele…' : 'Borító átvétele Facebookról'} mode="ghost" disabled={busy || !facebookUrl || hasCover} onClick={importCover} /></Box>
      {hasCover && <Text size={1} muted>Már van borító. Másik képhez előbb távolítsd el a meglévőt.</Text>}
    </Stack></Card>
    {props.renderDefault(props)}
  </Stack>;
}
