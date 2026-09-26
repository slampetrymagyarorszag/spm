import { useState } from 'react';
import { useClient, useFormValue, type StringInputProps } from 'sanity';
import { IntentLink } from 'sanity/router';
import { Button, Card, Stack, Text, useToast } from '@sanity/ui';
import { promoteSlammerDocument } from '../actions/promoteSlammer';

export function PromoteSlammerInput(_props: StringInputProps) {
  const doc = useFormValue([]) as any;
  const client = useClient({ apiVersion: '2024-01-01' });
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const promoted = !!doc?.promoted || done;

  const promote = async () => {
    setBusy(true);
    try {
      const result = await promoteSlammerDocument(client, doc);
      setDone(true);
      setCreatedId(result.id);
      toast.push({ status: 'success', title: 'Slammerré alakítva', description: `${result.name} profilja létrejött.` });
    } catch (e: any) {
      toast.push({ status: 'error', title: 'Nem sikerült az átalakítás', description: e?.message || 'Ismeretlen hiba' });
    } finally { setBusy(false); }
  };

  return <Card padding={3} radius={2} tone={promoted ? 'positive' : 'primary'} border>
    <Stack space={3}>
      <Text size={1}>{promoted
        ? 'Ez a jelentkezés már bekerült a Slammerek közé.'
        : 'Ha átnézted az adatokat, itt készíthetsz belőle szerkeszthető slammerprofilt.'}</Text>
      {!promoted && <Button text={busy ? 'Átalakítás…' : 'Slammerré alakítás'} tone="primary" disabled={busy || !doc?._id} onClick={promote} />}
      {promoted && (createdId || doc?.promotedSlammerId) && <IntentLink intent="edit" params={{ id: createdId || doc.promotedSlammerId, type: 'slammer' }} style={{ textDecoration: 'underline' }}>Slammerprofil megnyitása</IntentLink>}
    </Stack>
  </Card>;
}
